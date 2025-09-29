import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, orderBy } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { User } from 'firebase/auth';
import { collectionData } from 'rxfire/firestore';
import { Subscription } from 'rxjs';   // ✅ celui-ci
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-histo-user-livraison',
  templateUrl: './histo-user-livraison.component.html',
  styleUrls: ['./histo-user-livraison.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HistoUserLivraisonComponent  implements OnInit {
userLivraisons: any[] = [];
  loading = true;
  private sub?: Subscription;

  constructor(private firestore: Firestore, private auth: Auth) { }

  async ngOnInit() {
    const user: User | null = this.auth.currentUser;

    if (!user) {
      this.loading = false;
      return;
    }

    const livraisonRef = collection(this.firestore, 'livraison');
    const q = query(
      livraisonRef,
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // ✅ écoute en temps réel (au lieu de getDocs)
    this.sub = collectionData(q, { idField: 'id' }).subscribe(livraisons => {
      this.userLivraisons = livraisons;
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'en attente':
        return 'warning';
      case 'prise en charge':
        return 'tertiary';
      case 'réalisée':
        return 'success';
      case 'annulée':
        return 'danger';
      default:
        return 'medium';
    }
  }

}
