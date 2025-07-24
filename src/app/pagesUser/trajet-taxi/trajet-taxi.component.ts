import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CommandeUser } from 'src/app/models/commande.model';
import { CommandeService } from 'src/app/services/commande.service';

declare var google: any;

@Component({
  selector: 'app-trajet-taxi',
  templateUrl: './trajet-taxi.component.html',
  styleUrls: ['./trajet-taxi.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TrajetTaxiComponent  implements OnInit {
  depart = '';
  destination = '';
  distance = 0;
  duree = 0;
  prix = 0;
  createdAt= new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  driver = {
    nom: 'Jean Dupont',
    photoURL: 'assets/images/chaffeur.jpeg'
  };

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

   constructor(private route: ActivatedRoute,
               
   ) {}

  ngOnInit() {

    setTimeout(() => {
  this.initMap();
}, 500); // Légère pause pour attendre le DOM


     this.route.queryParams.subscribe(params => {
      this.depart = params['depart'] || '';
      this.destination = params['destination'] || '';
      this.distance = Number(params['distance']) || 0;
      this.duree = Number(params['duree']) || 0;
      this.prix = Number(params['prix']) || 0;
    });
  }

  initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 14.6928, lng: -17.4467 }, // Dakar par exemple
    zoom: 13
  });

  // Affiche un marqueur au point de départ
  new google.maps.Marker({
    position: { lat: 14.6928, lng: -17.4467 },
    map,
    title: "Départ"
  });
}


  async validerCommande() {
  const user = this.auth.currentUser;

  if (!user) {
    alert('Veuillez vous connecter pour valider la commande.');
    return;
  }

const commandeUser: Omit<CommandeUser, 'id'> & {
    uid: string;
    service: string;
    driver: {
      nom: string;
      photoURL: string;
    };
  } = {
    depart: this.depart,
    destination: this.destination,
    distance: this.distance,
    duree: this.duree,
    prix: this.prix,
    statut: 'en attente',
    createdAt: new Date(), // ou serverTimestamp() si tu veux l’heure Firebase
    uid: user.uid,
    service: 'taxi',
    driver: {
      nom: this.driver.nom,
      photoURL: this.driver.photoURL
    }
  };

  try {
    await addDoc(collection(this.firestore, 'commandes'), commandeUser);
    alert('✅ Commande enregistrée avec succès !');
    this.router.navigate(['/user/paiement']); // Redirige une fois l'enregistrement réussi
  } catch (error) {
    console.error('Erreur enregistrement :', error);
    alert('❌ Une erreur est survenue lors de l’enregistrement.');
  }
  }
}