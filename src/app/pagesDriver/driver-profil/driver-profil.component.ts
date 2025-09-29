import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, AlertController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc
} from '@angular/fire/firestore';

import { DriverPopoverComponent } from '../driver-popover/driver-popover.component';

@Component({
  selector: 'app-driver-profil',
  templateUrl: './driver-profil.component.html',
  styleUrls: ['./driver-profil.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class DriverProfilComponent implements OnInit {
  drivers = {
    nom: '',
    prenom: '',
    ville: '',
    role: 'chauffeur' as 'chauffeur' | 'livreur',
    matricule: '',
    marque: '',
    couleur: '',
    uid: '',
    photoUrl: '',
    disponible: false
  };

  disponible = false;
  nouvelleCourse = false;

  // Statistiques
  acceptedCount = 0;
  refusedCount = 0;
  totalCourses = 0;

  // Historique
  filteredCourses: {
    depart: string;
    destination: string;
    status: 'acceptée' | 'refusée';
    date?: string;
  }[] = [];

  profileImage: string | null = null;

  // pour éviter les notifications doublons
  private notifiedIds = new Set<string>();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private popoverController: PopoverController,
    private storage: Storage,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    // Charger les infos du driver
    const driverRef = doc(this.firestore, 'drivers', user.uid);
    const snapshot = await getDoc(driverRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      this.drivers = {
        nom: data['nom'] || '',
        prenom: data['prenom'] || '',
        ville: data['ville'] || '',
        role: data['role'] || 'chauffeur',
        matricule: data['matricule'] || '',
        marque: data['marque'] || '',
        couleur: data['couleur'] || '',
        uid: user.uid,
        photoUrl: data['photoUrl'] || '',
        disponible: data['disponible'] ?? false
      };

      this.profileImage = this.drivers.photoUrl;
      this.disponible = this.drivers.disponible;

      if (this.disponible) {
        this.drivers.role === 'chauffeur' ? this.listenForCourses() : this.listenForDeliveries();
      }
    }

    // Charger l’historique
    this.loadCourses();
    this.detectLocation();
  }

  // 🔁 Active/désactive la disponibilité
  async toggleDisponibilite() {
    this.disponible = !this.disponible;
    const user = this.auth.currentUser;
    if (!user) return;

    const driverRef = doc(this.firestore, 'drivers', user.uid);
    await setDoc(driverRef, { disponible: this.disponible }, { merge: true });

    if (this.disponible) {
      this.notifiedIds.clear(); // réinitialiser notifications
      this.drivers.role === 'chauffeur'
        ? this.listenForCourses()
        : this.listenForDeliveries();
    } else {
      this.nouvelleCourse = false;
      this.notifiedIds.clear();
    }
  }

  // 🚕 Écoute des courses Taxi
  listenForCourses() {
    const q = query(
      collection(this.firestore, 'commandes'),
      where('statut', '==', 'en attente'),
      where('service', '==', 'taxi')
    );

    onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        const docId = change.doc.id;
        const data = change.doc.data() as any;

        if (change.type === 'added' && !this.notifiedIds.has(docId)) {
          this.nouvelleCourse = true;
          // stocke pour éviter ré-affichage multiple
          this.notifiedIds.add(docId);
          this.alertNewCommande(docId, data['depart'], data['destination'], data['prix']);
        }
      });

      if (snapshot.size === 0) this.nouvelleCourse = false;
    });
  }

  // 🚚 Écoute des livraisons (si tu veux la même logique côté livreur)
  listenForDeliveries() {
    const q = query(
      collection(this.firestore, 'commandes'),
      where('statut', '==', 'en attente'),
      where('service', '==', 'livraison')
    );

    onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        const docId = change.doc.id;
        const data = change.doc.data() as any;

        if (change.type === 'added' && !this.notifiedIds.has(docId)) {
          this.nouvelleCourse = true;
          this.notifiedIds.add(docId);
          this.alertNewCommande(docId, data['depart'], data['destination'], data['prix']);
        }
      });

      if (snapshot.size === 0) this.nouvelleCourse = false;
    });
  }

  // 🔔 Alerte nouvelle commande — choix obligatoire Accepter / Refuser
  async alertNewCommande(commandeId: string, depart: string, destination: string, prix: number) {
    const alert = await this.alertCtrl.create({
      header: 'Nouvelle course disponible !',
      message: `
        <strong>Départ :</strong> ${depart}<br>
        <strong>Destination :</strong> ${destination}<br>
        <strong>Prix :</strong> ${prix} FCFA
      `,
      backdropDismiss: false, // obligé de choisir
      buttons: [
        {
          text: 'Refuser',
          role: 'cancel',
          handler: async () => {
            // n'altère pas la commande globale (permet à d'autres chauffeurs de la prendre)
            await this.recordHistorique(commandeId, depart, destination, prix, 'refusée');
            // on garde l'id dans notifiedIds pour ne pas redemander
          }
        },
        {
          text: 'Accepter',
          handler: async () => {
            await this.acceptCommande(commandeId, depart, destination, prix);
          }
        }
      ]
    });

    await alert.present();
  }

  // Accepter : vérifie l'état, met a jour la commande et l'historique, rend le driver indisponible
  private async acceptCommande(commandeId: string, depart: string, destination: string, prix: number) {
    const user = this.auth.currentUser;
    if (!user) return;

    const commandeRef = doc(this.firestore, 'commandes', commandeId);
    const snap = await getDoc(commandeRef);

    if (!snap.exists() || snap.data()?.['statut'] !== 'en attente') {
      const info = await this.alertCtrl.create({
        header: 'Commande déjà prise',
        message: `Désolé, cette commande a déjà été acceptée.`,
        buttons: ['OK']
      });
      await info.present();
      return;
    }

    const prenom = this.drivers.prenom || user.displayName || 'Chauffeur';
    const photoURL = this.drivers.photoUrl || user.photoURL || '';

    // Mise à jour de la commande
    await updateDoc(commandeRef, {
      statut: 'prise en charge',
      chauffeurId: user.uid,
      chauffeur: { uid: user.uid, prenom, photoURL }
    });

    // Historique chauffeur
    await this.recordHistorique(commandeId, depart, destination, prix, 'acceptée');

    // Marquer le chauffeur indisponible pour éviter qu'il prenne plusieurs courses
    const driverRef = doc(this.firestore, 'drivers', user.uid);
    await setDoc(driverRef, { disponible: false }, { merge: true });
    this.disponible = false;
    this.nouvelleCourse = false;

    // recharge l'historique / stats
    await this.loadCourses();
  }

  // Enregistre dans drivers/{uid}/historique
  private async recordHistorique(commandeId: string, depart: string, destination: string, prix: number, status: 'acceptée' | 'refusée') {
    const user = this.auth.currentUser;
    if (!user) return;

    const historiqueRef = doc(collection(this.firestore, `drivers/${user.uid}/historique`));
    await setDoc(historiqueRef, {
      commandeId,
      depart,
      destination,
      prix,
      status,
      date: new Date().toISOString()
    });
  }

  // 📸 Gestion photo de profil
  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const user = this.auth.currentUser;
    if (!user) return;

    const filePath = `drivers/${user.uid}/profile.jpg`;
    const fileRef = ref(this.storage, filePath);

    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      const driverRef = doc(this.firestore, 'drivers', user.uid);
      await setDoc(driverRef, { photoUrl: downloadURL }, { merge: true });

      this.profileImage = downloadURL;
      this.drivers.photoUrl = downloadURL;
    } catch (error) {
      console.error("Erreur d'upload :", error);
    }
  }

  // 📜 Charger l’historique
  async loadCourses() {
    const user = this.auth.currentUser;
    if (!user) return;

    const q = collection(this.firestore, `drivers/${user.uid}/historique`);
    const snapshot = await getDocs(q);

    this.filteredCourses = snapshot.docs.map(doc => doc.data() as any);

    this.acceptedCount = this.filteredCourses.filter(c => c.status === 'acceptée').length;
    this.refusedCount = this.filteredCourses.filter(c => c.status === 'refusée').length;
    this.totalCourses = this.filteredCourses.length;
  }

  // 📍 Localisation
  async detectLocation() {
    const user = this.auth.currentUser;
    if (!user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const driverRef = doc(this.firestore, 'drivers', user.uid);
          await setDoc(driverRef, { location: { lat, lng } }, { merge: true });
        },
        (error) => console.error('Erreur de géolocalisation :', error)
      );
    }
  }

  // 📌 Menu
  async presentPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: DriverPopoverComponent,
      event: ev,
      translucent: true,
    });
    await popover.present();
  }
}
