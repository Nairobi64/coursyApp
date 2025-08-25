import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, PopoverController, AlertController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ref, uploadBytes, getDownloadURL, Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';


import { LivreurPopupComponent } from '../livreur-popup/livreur-popup.component';
import { LivraisonService } from '../../../app/services/livraison-service.service';
import { Firestore, doc, getDoc, getDocs, setDoc, collection, query } from '@angular/fire/firestore';

@Component({
  selector: 'app-profile-livreur',
  templateUrl: './profile-livreur.component.html',
  styleUrls: ['./profile-livreur.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class ProfileLivreurComponent implements OnInit {

  user: any = null;
  profileImageUrl: string | null = null;

  livreurs = {
    nom: '',
    prenom: '',
    ville: '',
    role: 'livreur' as 'livreur' | 'chauffeur',
    matricule: '',
    marque: '',
    couleur: '',
    uid: '',
    photoUrl: '',
    disponible: false
  };

  disponible = false;
  nouvelleCourse = false;

  acceptedCount = 0;
  refusedCount = 0;
  totalCourses = 0;

  filteredCourses: any[] = [];
  profileImage: string | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private router: RouterModule,

    private livraisonService: LivraisonService
  ) {}

  async ngOnInit() {
    this.user = this.auth.currentUser;
    if (!this.user) return;

    this.livraisonService.setUser(this.user);

    // Charger les infos livreur
    const livreurRef = doc(this.firestore, 'livreurs', this.user.uid);
    const snapshot = await getDoc(livreurRef);

    if (snapshot.exists()) {
      const data = snapshot.data();

      this.livreurs = {
        nom: data['nom'] || '',
        prenom: data['prenom'] || '',
        ville: data['ville'] || '',
        role: data['role'] || 'chauffeur',
        matricule: data['matricule'] || '',
        marque: data['marque'] || '',
        couleur: data['couleur'] || '',
        uid: this.user.uid,
        photoUrl: data['photoUrl'] || '',
        disponible: data['disponible'] ?? false
      };

      this.profileImage = this.livreurs.photoUrl;
      this.disponible = this.livreurs.disponible;

      if (this.disponible) {
        this.listenForCourses();
      }
    }

    // Charger l’historique au démarrage
    await this.loadCourses();
  }

  async toggleDisponibilite() {
    this.disponible = !this.disponible;

    this.user = this.auth.currentUser;
    if (this.user) {
      const livreurRef = doc(this.firestore, 'livreurs', this.user.uid);
      await setDoc(livreurRef, { disponible: this.disponible }, { merge: true });

      if (this.disponible) {
        this.listenForCourses();
      } else {
        this.nouvelleCourse = false;
      }
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

            // 👉 Sauvegarde historique
            await this.saveToHistory(commandeId, {
              depart,
              destination,
              statut: 'refusée',
              date: new Date()
            });

            await this.loadCourses();
          }
        },
        {
          text: 'Accepter',
          handler: async () => {
            const ok = await this.livraisonService.acceptLivraison(commandeId);
            if (ok) {
              this.nouvelleCourse = false;

              // 👉 Sauvegarde historique
              await this.saveToHistory(commandeId, {
                depart,
                destination,
                statut: 'acceptée',
                date: new Date()
              });

              await this.loadCourses();
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

  // 👉 Méthode pour uploader une nouvelle image de profil
  async onImageSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.user) return;

    const filePath = `profiles/${this.user.uid}.jpg`;
    const fileRef = ref(this.storage, filePath);

    await uploadBytes(fileRef, file);
    this.profileImageUrl = await getDownloadURL(fileRef);
  }

  // ✅ Charger l’historique des courses depuis Firestore
  async loadCourses() {
    if (!this.user) return;

    const q = query(collection(this.firestore, `livreurs/${this.user.uid}/historique`));
    const querySnapshot = await getDocs(q);

    this.filteredCourses = [];
    this.acceptedCount = 0;
    this.refusedCount = 0;
    this.totalCourses = 0;

    querySnapshot.forEach((docSnap) => {
      const data: any = docSnap.data();
      this.filteredCourses.push(data);

      if (data.statut === 'acceptée') this.acceptedCount++;
      if (data.statut === 'refusée') this.refusedCount++;
      this.totalCourses++;
    });

    console.log("Historique rechargé :", this.filteredCourses);
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

  
}
