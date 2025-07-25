import { Component, inject ,OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-driver-profil',
  templateUrl: './driver-profil.component.html',
  styleUrls: ['./driver-profil.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class DriverProfilComponent implements OnInit {

  profileImage: string | null = null;
  isAvailable: boolean = true;
  driverId: string = '';
  driver: any = {};

  acceptedCount = 0;
  refusedCount = 0;
  totalCourses = 0;

  courses: {
    depart: string,
    destination: string,
    status: 'acceptée' | 'refusée',
    date: string
  }[] = [];


  constructor(private firestore: Firestore, private auth: Auth) {}

 async ngOnInit() {
    const user = this.auth.currentUser;
  if (user) {
    this.driverId = user.uid;
    const driverRef = doc(this.firestore, 'chauffeurs', this.driverId);
    const snapshot = await getDoc(driverRef);
    if (snapshot.exists()) {
      this.driver = snapshot.data();
      this.profileImage = this.driver.photoURL || null;
      this.isAvailable = this.driver.disponible ?? true;
    }
    this.fetchCourses();
  }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
        // Optionnel : envoyer au backend / Firebase
      };
      reader.readAsDataURL(file);
    }
  }

  toggleAvailability() {
    this.isAvailable = !this.isAvailable;
    // Optionnel : mettre à jour l’état dans Firestore
  }

  fetchDriverData() {
    // Exemple : charger les infos depuis Firestore
    this.driver = {
      nom: 'Fall',
      prenom: 'Amadou',
      email: 'amadou@callcoursy.sn'
    };
  }

  fetchCourses() {
    this.courses = [
      { depart: 'Sacré-Cœur', destination: 'Plateau', status: 'acceptée', date: new Date().toISOString() },
      { depart: 'Yoff', destination: 'Liberté 6', status: 'refusée', date: new Date().toISOString() },
      // etc.
    ];

    this.acceptedCount = this.courses.filter(c => c.status === 'acceptée').length;
    this.refusedCount = this.courses.filter(c => c.status === 'refusée').length;
    this.totalCourses = this.courses.length;
  }
}
