
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, addDoc, getDoc, doc, serverTimestamp } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';


declare var google: any;

@Component({
  selector: 'app-commande',
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.scss'],
  standalone : true,
  imports: [CommonModule, IonicModule,ReactiveFormsModule,FormsModule]
})
export class CommandeComponent  implements OnInit {
  commandeForm!: FormGroup;
  formSubmitted: boolean = false;

  suggestions: google.maps.places.AutocompletePrediction[] = [];
  errorMessage: string = '';

  autocompleteService!: google.maps.places.AutocompleteService;
  placeService!: google.maps.places.PlacesService;


  selectedField: 'depart' | 'destination' | null = null;




  constructor(private fb: FormBuilder, 
              private router: Router,
              private auth: Auth,
              private firestore : Firestore,
              private AlertController : AlertController
             ) {}

  ngOnInit() {

    this.commandeForm = this.fb.group({
      depart: ['', Validators.required],
      destination: ['', Validators.required]
    });
    
     if (typeof google !== 'undefined') {
    this.autocompleteService = new google.maps.places.AutocompleteService();

    // Crée un élément fictif pour initialiser PlacesService
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
    } as any; // `as any` pour éviter l'erreur TS

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
        const alert = await this.AlertController.create({
          header: 'Confirmez votre commande',
          message: `
            <div style="text-align:left; font-size: 16px; line-height: 1.4;">
            <p><strong>📍 Départ :</strong><br> ${depart}</p>
            <p><strong>🏁 Destination :</strong><br> ${destination}</p>
            <p><strong>🛣️ Distance estimée :</strong><br> ${distance} km</p>
            <p><strong>⏱️ Durée estimée :</strong><br> ${duree} min</p>
            <p><strong>💰 Prix estimé :</strong><br> ${prix} FCFA</p>
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
  const user = this.auth.currentUser;
  if (!user) {
    this.errorMessage = 'Utilisateur non connecté.';
    return;
  }

  const commande = {
    uid: user.uid,
    createdAt: serverTimestamp(),
    depart,
    destination,
    distance,
    duree,
    prix,
    statut: 'en attente',
    service: 'taxi'
  };

  try {
    // Enregistrer commande dans Firestore
    const commandesRef = collection(this.firestore, 'commandes');
    const docRef = await addDoc(commandesRef, commande);

    console.log('Commande enregistrée avec ID:', docRef.id);

    // Naviguer vers la page trajet en passant l’ID de commande
    this.router.navigate(['/user/trajet'], {
      queryParams: { commandeId: docRef.id }
    });

  } catch (err) {
    console.error('Erreur lors de la création de la commande :', err);
    this.errorMessage = 'Impossible d’enregistrer la commande.';
  }
}


  goToResto() {
    this.router.navigate(['/restaurant/menu']);
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



  

