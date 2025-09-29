import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Firestore, collection, addDoc, serverTimestamp, doc, onSnapshot } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

declare var google: any;

@Component({
  selector: 'app-trajet-taxi',
  templateUrl: './trajet-taxi.component.html',
  styleUrls: ['./trajet-taxi.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TrajetTaxiComponent implements OnInit, OnDestroy {
  depart = '';
  destination = '';
  distance = 0;
  duree = 0;
  prix = 0;

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  createdAt!: string;
  private commandeId: string | null = null;
  private commandeSub: (() => void) | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.createdAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTimeout(() => this.initMap(), 500);

    this.route.queryParams.subscribe(params => {
      this.depart = params['depart'] || '';
      this.destination = params['destination'] || '';
      this.distance = Number(params['distance']) || 0;
      this.duree = Number(params['duree']) || 0;
      this.prix = Number(params['prix']) || 0;
    });
  }

  ngOnDestroy() {
    if (this.commandeSub) this.commandeSub(); // arrêter l'écoute en quittant la page
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
      statut: 'en attente',
      service: 'taxi',
      chauffeurId: ''
    };

    try {
      const docRef = await addDoc(collection(this.firestore, 'commandes'), data);
      this.commandeId = docRef.id;
      alert('Votre commande a été envoyée. Un chauffeur va la prendre en charge.');

      // Écoute en temps réel la commande pour recevoir les infos du chauffeur
      this.listenCommande(docRef.id);

      this.router.navigate(['/user/trajet']);
    } catch (error) {
      console.error('Erreur lors de l’enregistrement :', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  }

  private listenCommande(commandeId: string) {
    const commandeRef = doc(this.firestore, `commandes/${commandeId}`);

    this.commandeSub = onSnapshot(commandeRef, async (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data() as any;

      // Dès que le chauffeur accepte
      if (data.statut === 'prise en charge' && data.chauffeur) {
        const chauffeur = data.chauffeur;
        await this.showChauffeurInfo(chauffeur);
      }
    });
  }

  private async showChauffeurInfo(chauffeur: any) {
    const alert = await this.alertCtrl.create({
      header: 'Votre chauffeur est prêt !',
      message: `
        <strong>Nom :</strong> ${chauffeur.prenom}<br>
        <strong>ID :</strong> ${chauffeur.uid}<br>
        ${chauffeur.photoURL ? `<img src="${chauffeur.photoURL}" width="100">` : ''}
      `,
      buttons: ['OK']
    });
    await alert.present();
  }
}
