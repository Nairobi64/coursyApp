import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, updateDoc, doc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { IonicModule } from '@ionic/angular';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';

interface Course {
  depart: string;
  destination: string;
  statut: 'en attente' | 'acceptée' | 'refusée';
  date: string;
  prix: number;
  chauffeurId?: string;
  driverId?: string;
}

@Component({
  selector: 'app-liste-courses',
  templateUrl: './liste-courses.component.html',
  styleUrls: ['./liste-courses.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, NgIf, NgFor]
})
export class ListeCoursesComponent implements OnInit {

  commandesEnAttente: { id: string, data: Course }[] = [];

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    const q = query(
      collection(this.firestore, 'commandes'),
      where('statut', '==', 'en attente'),
      where('service', '==', 'taxi') // adapte si besoin pour livreur
    );

    onSnapshot(q, snapshot => {
      this.commandesEnAttente = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data() as Course
      }));
    });
  }

  async accepterCommande(commandeId: string) {
    const user = this.auth.currentUser;
    if (!user) {
      alert('Utilisateur non connecté.');
      return;
    }

    const courseRef = doc(this.firestore, 'commandes', commandeId);
    await updateDoc(courseRef, {
      statut: 'acceptée',
      chauffeurId: user.uid,
      driverId: user.uid // 🔁 Ce champ sera utilisé pour l'affichage sur carte-trajet
    });

    alert('✅ Commande acceptée.');
  }

  async refuserCommande(commandeId: string) {
    const user = this.auth.currentUser;
    if (!user) {
      alert('Utilisateur non connecté.');
      return;
    }

    const courseRef = doc(this.firestore, 'commandes', commandeId);
    await updateDoc(courseRef, {
      statut: 'refusée',
      chauffeurId: user.uid
    });

    alert('❌ Commande refusée.');
  }

  goBack() {
    this.router.navigate(['/driver/profile']);
  }
}
