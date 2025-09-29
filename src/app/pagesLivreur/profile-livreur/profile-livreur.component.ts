import { Notification } from './../../services/notifications.service';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import { orderBy } from '@angular/fire/firestore';
import { Geolocation } from '@capacitor/geolocation';




import { LivreurPopupComponent } from '../livreur-popup/livreur-popup.component';
import { LivraisonService } from '../../../app/services/livraison-service.service';
import { Firestore, doc, setDoc, collection, query, onSnapshot, updateDoc } from '@angular/fire/firestore';

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

@Component({
  selector: 'app-profile-livreur',
  templateUrl: './profile-livreur.component.html',
  styleUrls: ['./profile-livreur.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, IonicModule]
})
export class ProfileLivreurComponent implements OnInit, OnDestroy {

  user: any = null;
  profileImageUrl: string | null = null;
  historique: any[] = [];
  position: { lat: number; lng: number } | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  watchId: string | null = null;
  

  unreadNotifications$: Observable<Notification[]> | null = null;
  userId: string | null = null;

  livreurs = {
    nom: '',
    prenom: '',
    ville: '',
    role: 'livreur' as 'livreur',
    matricule: '',
    marque: '',
    couleur: '',
    uid: '',
    photoUrl: '',
    disponible: false,
    
  };

  disponible = false;
  nouvelleCourse = false;

  acceptedCount = 0;
  refusedCount = 0;
  totalCourses = 0;

  filteredCourses: any[] = [];
  profileImage: string | null = null;

  private unsubscribeHistorique: any;
  private unsubscribeLivreur: any;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private router: Router,
    private livraisonService: LivraisonService,
    private notifService : NotificationsService,
  ) {}

 async ngOnInit() {
  // 1) Attendre que Firebase Auth ait restauré la session
  onAuthStateChanged(this.auth, (user) => {
    if (!user) {
      return;

      this.notifService.initPush();
      this.startTracking();

    }

    this.user = user;
    this.livraisonService.setUser(user);

    // 2) Cache local
    const cached = localStorage.getItem('livreurData');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.livreurs = parsed;
        this.profileImage = parsed.photoUrl || null;
        this.disponible = !!parsed.disponible;
      } catch {}
    }

    // 3) Écoute profil Firestore
    if (this.unsubscribeLivreur) this.unsubscribeLivreur();
    this.unsubscribeLivreur = onSnapshot(
      doc(this.firestore, 'livreurs', user.uid),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        this.livreurs = {
          nom: data['nom'] || '',
          prenom: data['prenom'] || '',
          ville: data['ville'] || '',
          role: 'livreur',
          matricule: data['matricule'] || '',
          marque: data['marque'] || '',
          couleur: data['couleur'] || '',
          uid: user.uid,
          photoUrl: data['photoUrl'] || '',
          disponible: data['disponible'] === true
        };
        this.profileImage = this.livreurs.photoUrl || null;
        this.disponible = this.livreurs.disponible;
        localStorage.setItem('livreurData', JSON.stringify(this.livreurs));
        if (this.disponible) this.listenForCourses();
      }
    );

    // 4) Notifications pour ce user
    this.userId = user.uid;
    this.unreadNotifications$ = this.notifService.getUnreadNotifications(this.userId);

    // 5) Historique : on veut l'afficher trié — utilise getHistoriqueLivreur et place le résultat dans filteredCourses
    this.loadHistorique();
    // 6) et écouter subcollection historique en temps réel (optionnel) :
    this.listenHistorique();
  });
}

// charge l'historique depuis la collection `livraison` (method getHistoriqueLivreur)
async loadHistorique() {
  const user = this.auth.currentUser;
  if (!user) return;
  const commandes = await this.livraisonService.getHistoriqueLivreur(user.uid);
  // on met dans filteredCourses (le template l'utilise)
  this.filteredCourses = commandes;
  // calcule les compteurs
  this.acceptedCount = commandes.filter((c:any) => c.statut === 'acceptée').length;
  this.refusedCount = commandes.filter((c:any) => c.statut === 'refusée').length;
  this.totalCourses = commandes.length;
}


  ngOnDestroy() {
    if (this.unsubscribeHistorique) this.unsubscribeHistorique();
    if (this.unsubscribeLivreur) this.unsubscribeLivreur();
  }

async toggleDisponibilite() {
  this.disponible = !this.disponible;

  if (!this.user) return;

  const livreurRef = doc(this.firestore, 'livreurs', this.user.uid);
  await setDoc(livreurRef, { disponible: this.disponible }, { merge: true });

  // mets à jour aussi le cache local
  this.livreurs.disponible = this.disponible;
  localStorage.setItem('livreurData', JSON.stringify(this.livreurs));

  if (this.disponible) {
    this.listenForCourses();
  } else {
    this.nouvelleCourse = false;
  }
}


  listenForCourses() {
    this.livraisonService.listenToCommandes((commande, id) => {
      this.nouvelleCourse = true;
      this.alertNewCommande(commande.depart, commande.destination, id);
    });
  }

  // ✅ Sauvegarde dans l’historique du livreur
  async saveToHistory(commandeId: string, data: any) {
    if (!this.user) return;
    const histRef = doc(this.firestore, `livreurs/${this.user.uid}/historique/${commandeId}`);
    await setDoc(histRef, data, { merge: true });
  }

  async alertNewCommande(depart: string, destination: string, commandeId: string) {
  const alert = await this.alertCtrl.create({
    header: '🚨 Nouvelle livraison disponible !',
    message: `Départ : ${depart}<br>Destination : ${destination}`,
    buttons: [
      {
        text: 'Refuser',
        role: 'cancel',
        handler: async () => {
          await setDoc(doc(this.firestore, `livraison/${commandeId}`), {
            statut: 'refusée',
            livreurId: this.user.uid
          }, { merge: true });

          await this.saveToHistory(commandeId, {
            depart,
            destination,
            statut: 'refusée',
            date: new Date()
          });
        }
      },
      {
  text: 'Accepter',
  handler: async () => {
    const ok = await this.livraisonService.acceptLivraison(commandeId);
    if (ok) {
      this.nouvelleCourse = false;

      // On uniformise aussi ici : statut 'acceptée'
      await setDoc(doc(this.firestore, `livraison/${commandeId}`), {
        statut: 'acceptée',
        livreurId: this.user.uid
      }, { merge: true });

      await this.saveToHistory(commandeId, {
        depart,
        destination,
        statut: 'acceptée',
        date: new Date()
      });

      // Mise à jour locale immédiate des compteurs pour feedback instantané
      this.acceptedCount = (this.acceptedCount || 0) + 1;
      this.totalCourses = (this.totalCourses || 0) + 1;
    } else {
      const info = await this.alertCtrl.create({
        header: '⚠️ Erreur',
        message: 'Cette livraison a déjà été prise par un autre livreur.',
        buttons: ['OK']
      });
      await info.present();
    }
  }
}
    ]
  });

  await alert.present();
}


  // ✅ Uploader image → on met à jour uniquement photoUrl
async onImageSelected(event: any) {
  const file = event.target.files[0];
  if (!file || !this.user) return;

  const filePath = `profiles/${this.user.uid}/profile.jpg`;
  const fileRef = ref(this.storage, filePath);

  // Téléchargement de l'image
  await uploadBytes(fileRef, file);
  this.profileImageUrl = await getDownloadURL(fileRef);

  // Mise à jour de Firestore et de localStorage pour la photo
  const livreurRef = doc(this.firestore, 'livreurs', this.user.uid);
  await setDoc(livreurRef, { photoUrl: this.profileImageUrl }, { merge: true });

  // Mise à jour de localStorage
  this.livreurs.photoUrl = this.profileImageUrl;
  localStorage.setItem('livreurData', JSON.stringify(this.livreurs));
}


  // ✅ Historique en temps réel
listenHistorique() {
  if (!this.user) return;

  // Avec tri par date décroissante (nécessite un index si erreur Firestore)
  const q = query(
    collection(this.firestore, `livreurs/${this.user.uid}/historique`),
    // @ts-ignore
    orderBy('date', 'desc')
  );

  if (this.unsubscribeHistorique) this.unsubscribeHistorique();
  this.unsubscribeHistorique = onSnapshot(q, (querySnapshot) => {
    const items: any[] = [];
    let accepted = 0;
    let refused = 0;

    querySnapshot.forEach((docSnap) => {
  const data: any = docSnap.data();
  items.push(data);
  if (data.statut === 'acceptée') accepted++;
  if (data.statut === 'refusée') refused++;
});

    this.filteredCourses = items;
    this.acceptedCount = accepted;
    this.refusedCount = refused;
    this.totalCourses = items.length;

    console.log('📌 Historique mis à jour :', this.filteredCourses);
  });
}


  async presentPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: LivreurPopupComponent,
      event: ev,
      translucent: true
    });
    await popover.present();
  }

  triggerFileInput() {
    document.getElementById('fileInput')?.click();
  }



  async annulerCourse(commandeId: string) {
  const alert = await this.alertCtrl.create({
    header: 'Annuler la livraison',
    inputs: [
      {
        name: 'motif',
        type: 'text',
        placeholder: 'Indiquez le motif de l’annulation'
      }
    ],
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Valider',
        handler: async (data) => {
          if (!data.motif || !data.motif.trim()) {
            const info = await this.alertCtrl.create({
              header: '⚠️ Erreur',
              message: 'Vous devez saisir un motif.',
              buttons: ['OK']
            });
            await info.present();
            return false; // garde l’alerte ouverte
          }

          // Mettre à jour la commande dans Firestore
          await setDoc(
            doc(this.firestore, `livraison/${commandeId}`),
            {
              statut: 'annulée',
              annulePar: 'livreur',
              motifAnnulation: data.motif
            },
            { merge: true }
          );

          // Mettre à jour l’historique du livreur
          await this.saveToHistory(commandeId, {
            statut: 'annulée',
            motifAnnulation: data.motif,
            annulePar: 'livreur',
            date: new Date()
          });
          return true; // ferme l’alerte au premier clic
        }
      }
    ]
  });

  await alert.present();

  await setDoc(doc(this.firestore, `livreurs/${this.user.uid}`), {
  disponible: true
}, { merge: true });

}


// ouvrir les notifications
openNotifications() {
    if (this.userId) {
      this.notifService.markAllAsRead(this.userId);
    }
  }


  async terminerCourse(commandeId: string) {
  // ⚡ Confirmation
  const alert = await this.alertCtrl.create({
    header: 'Terminer la livraison',
    message: 'Confirmez-vous que cette livraison est terminée ?',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Oui, terminer',
        handler: async () => {
          // ✅ Mise à jour Firestore
          await setDoc(
            doc(this.firestore, `livraison/${commandeId}`),
            {
              statut: 'terminée',
              dateFin: new Date()
            },
            { merge: true }
          );

          // ✅ Sauvegarde dans l’historique du livreur
          await this.saveToHistory(commandeId, {
            statut: 'terminée',
            dateFin: new Date()
          });

          // ✅ Notification au client via le service
          await this.livraisonService.notifierClientCommande(
            commandeId,
            'Votre commande a été livrée avec succès 🚚. Merci !'
          );
        }
      }
    ]
  });

  await alert.present();

  await setDoc(doc(this.firestore, `livreurs/${this.user.uid}`), {
  disponible: true
}, { merge: true });

}


startTracking() {
  Geolocation.watchPosition({}, async (position: Position | null, err: any) => {
    if (err) {
      console.error('Erreur localisation', err);
      return;
    }

    if (position && this.user) {
      const livreurRef = doc(this.firestore, 'livreurs', this.user.uid);
      await updateDoc(livreurRef, {
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        updatedAt: new Date()
      });
    }
  });
}

getCurrentPosition() {
  Geolocation.getCurrentPosition().then((position: Position) => {
    this.latitude = position.coords.latitude;
    this.longitude = position.coords.longitude;
    console.log('Current position:', this.latitude, this.longitude);
  }).catch((err) => {
    console.error('Error getting location', err);
  });

}

stopTracking(){}


}
