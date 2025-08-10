import { Component, OnInit } from '@angular/core';
import { Firestore, doc, updateDoc, collection, query, where, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { IonicModule } from '@ionic/angular'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-livreur',
  templateUrl: './profile-livreur.component.html',
  styleUrls: ['./profile-livreur.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProfileLivreurComponent implements OnInit {

uid: string = '';
  disponible: boolean = false;

  coursesAcceptees$!: Observable<any[]>;
  coursesRefusees$!: Observable<any[]>;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private alertController : AlertController
  ) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }
    this.uid = user.uid;

    // Charger la dispo actuelle
    try {
      const livreurDocRef = doc(this.firestore, 'livreurs', this.uid);
      const snap = await getDoc(livreurDocRef);
      if (snap.exists()) {
        const data = snap.data();
        this.disponible = data?.['disponible'] ?? false;
      }
    } catch (error) {
      console.error('Erreur récupération disponibilité:', error);
    }

    // Configurer les observables des courses acceptées/refusées
    this.loadCourses();
  }

  loadCourses() {
    const colAcceptees = query(
      collection(this.firestore, 'courses'),
      where('livreurId', '==', this.uid),
      where('status', '==', 'acceptée')
    );
    this.coursesAcceptees$ = collectionData(colAcceptees, { idField: 'id' });

    const colRefusees = query(
      collection(this.firestore, 'courses'),
      where('livreurId', '==', this.uid),
      where('status', '==', 'refusée')
    );
    this.coursesRefusees$ = collectionData(colRefusees, { idField: 'id' });
  }

  async toggleDisponibilite(event: CustomEvent) {
  if (!this.uid) {
    console.error('UID non défini, impossible de mettre à jour disponibilité');
    return;
  }
  const newValue = event.detail.checked;
  this.disponible = newValue;

  const ref = doc(this.firestore, 'livreurs', this.uid);
  try {
    await updateDoc(ref, { disponible: this.disponible });
    console.log('Disponibilité mise à jour:', this.disponible);
  } catch (error) {
    console.error('Erreur mise à jour disponibilité:', error);
    // gérer erreur alert etc.
  }
}


  async presentError(message: string) {
    const alert = await this.alertController.create({
      header: 'Erreur',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
