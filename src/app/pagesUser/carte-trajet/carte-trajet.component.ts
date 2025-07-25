import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Trajet} from 'src/app/models/model-trajet';

import { Firestore, collection, addDoc,getDoc, doc,serverTimestamp } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

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

   private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      this.trajet.Depart = params['depart'] || '';
      this.trajet.Destination = params['destination'] || '';
      this.trajet.Distance = Number(params['distance']) || 0;
      this.trajet.Duree = Number(params['duree']) || 0;
      this.trajet.Prix = Number(params['prix']) || 0;
    });
  }


  async saveCommandeToFirestore() {
  const user = this.auth.currentUser;
  if (!user) return;

  const commande = {
    uid: user.uid,
    createdAt: serverTimestamp(),
    depart: this.trajet.Depart,
    destination: this.trajet.Destination,
    distance: this.trajet.Distance,
    duree: this.trajet.Duree,
    prix: this.trajet.Prix,
    statut: 'En attente',
    driver: {
      nom: this.driver.nom,
      prenom: this.driver.prenom,
      telephone: this.driver.telephone,
      uid: this.driver|| null // utile pour la notif

      // uid: this.driver.uid || null ** a ajouter lors de l'initialisation du chauffeur
    }
  };

  try {
    const historiqueRef = collection(this.firestore, `users/${user.uid}/historique`);
    await addDoc(historiqueRef, commande);
    console.log('Commande enregistrée dans l’historique');

    // En option : tu peux aussi l'ajouter dans une collection centrale
    // await addDoc(collection(this.firestore, 'commandes'), commande);

    // 🔔 Envoie notification au livreur
    // if (this.driver.uid) {
    //   this.sendNotificationToDriver(this.driver.uid, 'Nouvelle commande', 'Un client vient de passer une commande.');
    // }

  } catch (err) {
    console.error('Erreur Firestore :', err);
  }
}

// pour les notifications

async sendNotificationToDriver(driverUid: string, title: string, message: string) {
  const tokenDoc = await getDoc(doc(this.firestore, `fcmTokens/${driverUid}`));

  if (tokenDoc.exists()) {
    const token = tokenDoc.data()['token'];

    const payload = {
      notification: {
        title: title,
        body: message
      },
      to: token
    };

    // 🔐 Clé secrète de ton projet Firebase
    const serverKey = 'AAAA...'; // ⚠️ Mets ta clé serveur FCM ici, côté backend (jamais côté frontend en prod !)

    try {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('Notification envoyée');
    } catch (err) {
      console.error('Erreur notification :', err);
    }
  } else {
    console.warn('Token FCM du livreur introuvable.');
  }
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
  
  
  async callDriver() {
  await this.saveCommandeToFirestore(); //  Enregistre dans Firestore
  window.open(`tel:${this.driver.telephone}`);
}

async messageDriver() {
  await this.saveCommandeToFirestore(); //  Enregistre dans Firestore
  const phone = this.driver.telephone.replace('+', '').replace(/\s+/g, '');
  const message = encodeURIComponent(`Bonjour ${this.driver.nom}, je suis votre client sur Call-coursy.`);
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}


}
