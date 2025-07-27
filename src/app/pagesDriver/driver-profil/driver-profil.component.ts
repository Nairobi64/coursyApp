import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ref, uploadBytes, getDownloadURL, Storage} from '@angular/fire/storage';
import { AlertController } from '@ionic/angular';

import { Auth} from '@angular/fire/auth';

import {Firestore, doc, getDoc, getDocs, setDoc, collection,query, where, onSnapshot} from '@angular/fire/firestore';

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
    photoUrl: ''
  };

  disponible = false;
  nouvelleCourse = false;

  acceptedCount = 0;
  refusedCount = 0;
  totalCourses = 0;

  filteredCourses: {
    depart: string;
    destination: string;
    status: 'acceptée' | 'refusée';
    date?: string;
  }[] = [];

  profileImage: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private popoverController: PopoverController,
    private storage: Storage,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser;

    if (user) {
      const driverRef = doc(this.firestore, 'drivers', user.uid);
      const snapshot = await getDoc(driverRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        this.drivers = {
          nom: data['nom'] || '',
          prenom: data['prenom'] || '',
          ville: data['ville'] || '',
          photoUrl: data['photoUrl'] || ''
        };
        this.profileImage = this.drivers.photoUrl;
        this.disponible = data['disponible'] ?? false;

        if (this.disponible) {
          this.listenForCourses();
        }
      }

      this.loadCourses();
      this.detectLocation();
    }
  }

  // 🔁 Active ou désactive la disponibilité
  async toggleDisponibilite() {
    this.disponible = !this.disponible;

    const user = this.auth.currentUser;
    if (user) {
      const driverRef = doc(this.firestore, 'drivers', user.uid);
      await setDoc(driverRef, { disponible: this.disponible }, { merge: true });

      if (this.disponible) {
        this.listenForCourses();
      } else {
        this.nouvelleCourse = false;
      }
    }
  }

  // 🔁 Écoute les courses disponibles en temps réel
 listenForCourses() {
  const q = query(
    collection(this.firestore, 'commandes'),
    where('statut', '==', 'en attente'),
    where('service', '==', 'taxi'),
    where('chauffeurId', '==', '')
  );

  let notifiedIds: string[] = [];

    onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      const docId = change.doc.id;
      if (change.type === 'added' && !notifiedIds.includes(docId)) {
        this.nouvelleCourse = true;
        this.alertNewCommande(change.doc.data()['depart'], change.doc.data()['destination']);
        notifiedIds.push(docId);
      }
    });

    if (snapshot.size === 0) {
      this.nouvelleCourse = false;
    }
  });
}

async alertNewCommande(depart: string, destination: string) {
  const alert = await this.alertCtrl.create({
    header: 'Nouvelle course disponible !',
    message: `Départ : ${depart}<br>Destination : ${destination}`,
    buttons: ['Voir plus tard']
  });

  await alert.present();
}

  // 📥 Téléversement de photo
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

  // ✅ Charger les commandes affectées à ce chauffeur
  async loadCourses() {
    const user = this.auth.currentUser;
    if (!user) return;

    const q = query(
      collection(this.firestore, 'commandes'),
      where('chauffeurId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    this.filteredCourses = snapshot.docs.map(doc => doc.data() as any);

    this.acceptedCount = this.filteredCourses.filter(c => c.status === 'acceptée').length;
    this.refusedCount = this.filteredCourses.filter(c => c.status === 'refusée').length;
    this.totalCourses = this.filteredCourses.length;
  }

  async presentPopover(ev: Event) {
    const popover = await this.popoverController.create({
      component: DriverPopoverComponent,
      event: ev,
      translucent: true,
    });
    await popover.present();
  }

  // 📍 Mise à jour localisation en temps réel
  async detectLocation() {
    const user = this.auth.currentUser;
    if (!user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const driverRef = doc(this.firestore, 'drivers', user.uid);
          await setDoc(driverRef, {
            location: { lat, lng }
          }, { merge: true });

        },
        (error) => {
          console.error('Erreur de géolocalisation :', error);
        }
      );
    } else {
      console.error("La géolocalisation n'est pas supportée");
    }
  }
}
