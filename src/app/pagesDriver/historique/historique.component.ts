import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

interface Course {
  depart: string;
  destination: string;
  statut: 'en attente' | 'acceptée' | 'refusée';
  date: string;
  prix: number;
  chauffeurId?: string;
}

@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoriqueComponent implements OnInit {

  courses: Course[] = [];
  filteredCourses: Course[] = [];
  filter = 'tous';
  totalGain: number = 0;

  constructor(private auth: Auth, private firestore: Firestore) {}

  async ngOnInit() {
    const user = this.auth.currentUser;
    if (!user) return;

    const q = query(
      collection(this.firestore, 'commandes'),
      where('chauffeurId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    this.courses = snapshot.docs.map(doc => doc.data() as Course);

    this.applyFilter();
  }

  applyFilter() {
    if (this.filter === 'tous') {
      this.filteredCourses = this.courses;
    } else {
      this.filteredCourses = this.courses.filter(c => c.statut === this.filter);
    }

    this.totalGain = this.filteredCourses.reduce((total, course) => {
      return total + this.getGain(course);
    }, 0);
  }

  getGain(course: Course): number {
    return course.statut === 'acceptée' ? course.prix * 0.2 : 0;
  }
}
