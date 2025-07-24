import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';

declare var google: any;

@Component({
  selector: 'app-form-taxi',
  templateUrl: './form-taxi.component.html',
  styleUrls: ['./form-taxi.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule,ReactiveFormsModule]
})
export class FormTaxiComponent  implements OnInit {

  taxiForm!: FormGroup;
  map: any;
  directionsRenderer: any;
  directionsService: any;

  suggestions: any[] = [];
  selectedField: 'depart' | 'destination' | null = null;
  formSubmitted = false;

  constructor(private fb: FormBuilder, 
              private router: Router) { }

  ngOnInit() {

    this.taxiForm = this.fb.group({
      depart: ['', Validators.required],
      destination: ['', Validators.required]
    });

     this.getCurrentPosition();
  }
 ngAfterViewInit() {
    this.initMap();
}



initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    this.map = new google.maps.Map(mapElement, {
      zoom: 12,
      center: { lat: 14.716677, lng: -17.467686 }, // Dakar
    });
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
    this.directionsService = new google.maps.DirectionsService();
  }

   searchPlace(event: any, field: 'depart' | 'destination') {
    const input = event.target.value;
    if (!input) {
      this.suggestions = [];
      return;
    }
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({
      input,
      componentRestrictions: { country: 'sn' },
      types: ['geocode']
    }, (predictions: any[], status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        this.suggestions = predictions;
      } else {
        this.suggestions = [];
      }
    });
    this.selectedField = field;
  }

    selectSuggestion(suggestion: any, field: 'depart' | 'destination') {
    if (field === 'depart') {
      this.taxiForm.get('depart')?.setValue(suggestion.description);
    } else {
      this.taxiForm.get('destination')?.setValue(suggestion.description);
    }
    this.suggestions = [];
    this.updateMap();
  }

     updateMap() {
    const depart = this.taxiForm.get('depart')?.value;
    const destination = this.taxiForm.get('destination')?.value;
    if (depart && destination && this.directionsService) {
      this.directionsService.route({
        origin: depart,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);
        }
      });
    }
  }

   onSubmit() {
    this.formSubmitted = true;
    if (this.taxiForm.valid) {
      const depart = this.taxiForm.get('depart')?.value;
      const destination = this.taxiForm.get('destination')?.value;
      if (depart && destination && this.directionsService) {
        this.directionsService.route({
          origin: depart,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result: any, status: any) => {
          if (status === 'OK') {
            const leg = result.routes[0].legs[0];
            const distance = parseFloat((leg.distance.value / 1000).toFixed(2));
            const duree = Math.round(leg.duration.value / 60);
            const prix = Math.round(distance * 200); // exemple : 200 FCFA/km
            this.router.navigate(['/user/trajet-taxi'], {
              queryParams: {
                depart: depart,
                destination: destination,
                distance: distance,
                duree: duree,
                prix: prix
              }
            });
          }
        });
      }
    }
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
    this.taxiForm.patchValue({ depart: adresse });
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