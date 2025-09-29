import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

interface Historique {
  depart: string;
  destination: string;
  statut: 'en attente' | 'acceptée' | 'refusée' | 'prise en charge' | 'terminée';
  date: string;
  prix: number;
}

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoriqueComponent implements OnInit {

  historique: Historique[] = [];
  filtered: Historique[] = [];
  filter = 'tous';
  totalGain: number = 0;

  userRole: 'chauffeur' | 'livreur' = 'chauffeur'; // Tu peux adapter ça dynamiquement si besoin

  constructor(private auth: Auth, private firestore: Firestore) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const q = collection(this.firestore, `drivers/${user.uid}/historique`);
const snapshot = await getDocs(q);

this.historique = snapshot.docs.map(doc => {
  const data = doc.data() as any;
  return {
    depart: data.depart,
    destination: data.destination,
    statut: data.statut,
    date: data.date,
    prix: data.prix,
  };
});


    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'tous') {
      this.filtered = this.historique;
    } else {
      this.filtered = this.historique.filter(c => c.statut === this.filter);
    }

    this.totalGain = this.filtered.reduce((total, item) => {
      return total + this.getGain(item);
    }, 0);
  }

  getGain(item: Historique): number {
    // Ici tu peux adapter selon la logique : gain si acceptée ou terminée
    return (item.statut === 'acceptée' || item.statut === 'terminée') ? item.prix * 0.2 : 0;
  }

  filteredCourses(): Historique[] {
    return this.filtered;
  }
 
}
