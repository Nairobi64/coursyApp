import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-driver-profil',
  templateUrl: './driver-profil.component.html',
  styleUrls: ['./driver-profil.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class DriverProfilComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  driver: any = null;
  loading: boolean = true;
  error: string = '';

  constructor() {
    this.loadDriver();
  }

  loadDriver() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (!user) {
        this.error = 'Utilisateur non connecté.';
        this.router.navigate(['/connexion-driver']);
        return;
      }

      try {
        const driverRef = doc(this.firestore, `drivers/${user.uid}`);
        const snap = await getDoc(driverRef);

        if (snap.exists()) {
          this.driver = snap.data();

          // 🔐 Enregistrer les infos dans localStorage
          localStorage.setItem('currentUser', JSON.stringify(this.driver));
        } else {
          this.error = 'Aucun profil chauffeur trouvé.';
        }
      } catch (err: any) {
        console.error('Erreur chargement chauffeur :', err);
        this.error = 'Erreur lors du chargement du profil.';
      } finally {
        this.loading = false;
      }
    });
  }
}
