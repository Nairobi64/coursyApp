import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Trajet} from 'src/app/models/model-trajet';

declare var google: any;

@Component({
  selector: 'app-carte-trajet',
  templateUrl: './carte-trajet.component.html',
  styleUrls: ['./carte-trajet.component.scss'],
  standalone: true,
  imports: [ IonicModule, CommonModule]
})
export class CarteTrajetComponent  implements OnInit {
  trajet: Trajet = {
    uid: '',
  createdAt: new Date(),
    Depart: '',
    Destination: '',
    Distance: 0,
    Duree: 0,
    Prix: 0
  };


   driver = {
    nom: 'Jean',
    prenom: 'Dupont',
    photoURL: 'assets/icon/driver.png',
    role: 'chauffeur',
    telephone: '+221700000000'
  };

  constructor(private route: ActivatedRoute,
  ) {}

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      this.trajet.Depart = params['depart'] || '';
      this.trajet.Destination = params['destination'] || '';
      this.trajet.Distance = Number(params['distance']) || 0;
      this.trajet.Duree = Number(params['duree']) || 0;
      this.trajet.Prix = Number(params['prix']) || 0;
    });
  }


ngAfterViewInit() {
    if (this.trajet.Depart && this.trajet.Destination) {
      this.initMap();
    }
  }

   initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    const map = new google.maps.Map(mapElement, {
      zoom: 13,
      center: { lat: 0, lng: 0 }
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: this.trajet.Depart,
        destination: this.trajet.Destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }
  
  
  callDriver() {
    window.open(`tel:${this.driver.telephone}`);
  }

  messageDriver() {
    window.open(`sms:${this.driver.telephone}`);
  }

}
