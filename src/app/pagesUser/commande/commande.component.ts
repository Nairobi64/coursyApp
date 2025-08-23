import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-commande',
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class CommandeComponent implements OnInit {
  commandeForm!: FormGroup;
  formSubmitted: boolean = false;

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  errorMessage: string = '';

  autocompleteService!: google.maps.places.AutocompleteService;
  placeService!: google.maps.places.PlacesService;

  selectedField: 'depart' | 'destination' | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.commandeForm = this.fb.group({
      depart: ['', Validators.required],
      destination: ['', Validators.required]
    });

    if (typeof google !== 'undefined') {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      this.placeService = new google.maps.places.PlacesService(dummyDiv);
    }

    this.getCurrentPosition();
  }

  searchPlace(event: any, field: 'depart' | 'destination') {
    const input = event.target.value;
    this.selectedField = field;

    if (!input || input.length <= 2 || !this.autocompleteService) {
      this.suggestions = [];
      return;
    }

    const request = {
      input,
      types: ['address'],
      componentRestrictions: { country: 'SN' }
    } as any;

    this.autocompleteService.getPlacePredictions(
      request,
      (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.suggestions = predictions;
        } else {
          this.suggestions = [];
        }
      }
    );
  }

  selectSuggestion(suggestion: any, field: 'depart' | 'destination') {
    if (!suggestion.place_id || !this.placeService) return;

    this.placeService.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const address = place.formatted_address || suggestion.description;

        this.commandeForm.patchValue({ [field]: address });

        this.suggestions = [];
        this.selectedField = null;
      } else {
        console.error('Erreur lors de la récupération des détails du lieu.');
      }
    });
  }

  async onSubmit() {
    this.formSubmitted = true;

    if (this.commandeForm.invalid) return;

    const { depart, destination } = this.commandeForm.value;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: depart,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      async (result: any, status: any) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          const distance = parseFloat((leg.distance.value / 1000).toFixed(2)); // km
          const duree = Math.round(leg.duration.value / 60); // min
          const prix = Math.round(distance * 200); // exemple : 200 FCFA/km

          // Affiche la popup avec les infos récap
          const alert = await this.alertController.create({
            header: 'Confirmez votre commande',
            message: `
              <div class="popup-backdrop" *ngIf="showPopup">
                <div class="popup-card">
                  <h2 class="popup-title">Disponibilité</h2>
                  <p class="popup-message">
                    Souhaitez-vous <strong>{{ disponible ? 'désactiver' : 'activer' }}</strong> votre disponibilité ?
                  </p>
                  <div class="popup-actions">
                    <button class="btn btn-cancel" (click)="closePopup()">Annuler</button>
                    <button 
                      class="btn btn-confirm" 
                      [class.active]="!disponible" 
                      (click)="toggleDisponibilite()">
                      Oui
                    </button>
                  </div>
                </div>
              </div>
            `,
            buttons: [
              {
                text: 'Annuler',
                role: 'cancel',
                cssClass: 'alert-button-cancel'
              },
              {
                text: 'Valider',
                cssClass: 'alert-button-validate',
                handler: () => this.confirmCommande(depart, destination, distance, duree, prix)
              }
            ],
            cssClass: 'custom-alert'
          });
          await alert.present();
        } else {
          this.errorMessage = 'Erreur lors de la récupération du trajet.';
        }
      }
    );
  }

  async confirmCommande(depart: string, destination: string, distance: number, duree: number, prix: number) {
    // On considère que l'utilisateur est connecté car page protégée
    const user = this.auth.currentUser!;
    
    const serviceType = 'livraison'; // ou taxi si besoin

    const commande = {
      uid: user.uid,
      createdAt: serverTimestamp(),
      depart,
      destination,
      distance,
      duree,
      prix,
      statut: 'en attente',
      service: serviceType
    };

    try {
      const collectionName = serviceType === 'livraison' ? 'livraison' : 'commandes';
      const commandesRef = collection(this.firestore, collectionName);
      const docRef = await addDoc(commandesRef, commande);

      console.log(`Commande enregistrée dans ${collectionName} avec ID:`, docRef.id);

      this.router.navigate(['/user/trajet'], {
        queryParams: { commandeId: docRef.id, type: serviceType }
      });

    } catch (err) {
      console.error('Erreur lors de la création de la commande :', err);
      this.errorMessage = 'Impossible d’enregistrer la commande.';
    }
  }

  goToColis() {
    this.router.navigate(['/user/noscolis']);
  }

  goToTaxi() {
    this.router.navigate(['/user/taxi']);
  }

  getCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;

          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
            if (status === 'OK' && results[0]) {
              const adresse = results[0].formatted_address;
              this.commandeForm.patchValue({ depart: adresse });
            } else {
              console.error('Impossible de récupérer l’adresse à partir de la position.');
            }
          });
        },
        error => {
          console.error('Erreur de géolocalisation :', error.message);
        }
      );
    } else {
      console.error('La géolocalisation n’est pas prise en charge par ce navigateur.');
    }
  }
}
