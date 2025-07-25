
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';

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


  onSubmit() {
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
      (result: any, status: any) => {
        if (status === 'OK') {
          const leg = result.routes[0].legs[0];
          const distance = parseFloat((leg.distance.value / 1000).toFixed(2)); // km
          const duree = Math.round(leg.duration.value / 60); // min
          const prix = Math.round(distance * 200); // exemple : 200 FCFA/km

          this.router.navigate(['/user/trajet'], {
            queryParams: {
              depart,
              destination,
              distance,
              duree,
              prix
            }
          });
        } else {
          this.errorMessage = 'Erreur lors de la récupération du trajet.';
        }
      }
    );
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



  

