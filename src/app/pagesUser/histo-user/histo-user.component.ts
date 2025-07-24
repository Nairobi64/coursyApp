import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-histo-user',
  templateUrl: './histo-user.component.html',
  styleUrls: ['./histo-user.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HistoUserComponent implements OnInit {

  userCourses: any[] = [];
  loading = true;

  constructor(private firestore: Firestore, private auth: Auth) { }

  async ngOnInit() {
    const user: User | null = this.auth.currentUser;

    if (!user) {
      this.loading = false;
      return;
    }

    // 🔽 Lecture des anciennes commandes
    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(
      commandesRef,
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    this.userCourses = snapshot.docs.map(doc => doc.data());

    // 🔽 Écriture d'une commande fictive (à supprimer ou adapter)
    await addDoc(commandesRef, {
      uid: user.uid,
      depart: 'Adresse de départ',
      destination: 'Adresse d’arrivée',
      distance: 5.2,
      duree: 12,
      prix: 3000,
      statut: 'en attente',
      createdAt: serverTimestamp()
    });

    this.loading = false;
  }

  getStatusColor(status: string): string {
  switch (status) {
    case 'en attente':
      return 'warning';
    case 'confirmée':
      return 'success';
    case 'annulée':
      return 'danger';
    default:
      return 'medium';
  }
}

}
