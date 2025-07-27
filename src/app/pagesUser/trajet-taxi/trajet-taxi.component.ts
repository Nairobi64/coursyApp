import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

declare var google: any;



@Component({
  selector: 'app-trajet-taxi',
  templateUrl: './trajet-taxi.component.html',
  styleUrls: ['./trajet-taxi.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TrajetTaxiComponent implements OnInit {
  depart = '';
  destination = '';
  distance = 0;
  duree = 0;
  prix = 0;

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  createdAt!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
  this.createdAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  setTimeout(() => {
    this.initMap();
  }, 500);

  this.route.queryParams.subscribe(params => {
    this.depart = params['depart'] || '';
    this.destination = params['destination'] || '';
    this.distance = Number(params['distance']) || 0;
    this.duree = Number(params['duree']) || 0;
    this.prix = Number(params['prix']) || 0;
  });
}

  initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 14.6928, lng: -17.4467 },
      zoom: 13
    });

    new google.maps.Marker({
      position: { lat: 14.6928, lng: -17.4467 },
      map,
      title: 'Départ'
    });
  }

  async validerCommande() {
    const user = this.auth.currentUser;

    if (!user) {
      alert('Veuillez vous connecter pour valider la commande.');
      return;
    }

    const data = {
      uid: user.uid,
      createdAt: serverTimestamp(),
      depart: this.depart,
      destination: this.destination,
      distance: this.distance,
      duree: this.duree,
      prix: this.prix,
      statut: 'en attente',  // très important pour déclencher l'écoute chez le chauffeur
      service: 'taxi'
    };

    try {
      await addDoc(collection(this.firestore, 'commandes'), data);
      alert('Votre commande a été envoyée. Un chauffeur va la prendre en charge.');
      this.router.navigate(['/user/histoUser']);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement :', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  }
}
