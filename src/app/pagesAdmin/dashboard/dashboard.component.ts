import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf,AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { StatutDirectService } from 'src/app/services/statut-direct.service';
import { UtilisateursListeComponent } from '../utilisateurs-liste/utilisateurs-liste.component';
import { ChauffeursListeComponent } from '../chauffeurs-liste/chauffeurs-liste.component';
import { LivreursListeComponent } from '../livreurs-liste/livreurs-liste.component';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone : true,
  imports: [CommonModule, RouterModule, UtilisateursListeComponent, ChauffeursListeComponent, LivreursListeComponent, NgIf, AsyncPipe]
})
export class DashboardComponent  implements OnInit {

  listeActive : 'utilisateurs' | 'chauffeurs' | 'livreurs' | null = 'utilisateurs';

// inscriptions Firestore
  utilisateurs$!: Observable<any[]>;
  chauffeurs$!: Observable<any[]>;
  livreurs$!: Observable<any[]>;

  // présence temps réel (Realtime Database)
  usersOnline: number = 0;
  driversOnline: number = 0;
  couriersOnline: number = 0;
  totalOnline: number = 0;



  constructor(
    private firestore: Firestore,
    private statutDirectService: StatutDirectService
  ) {}

  ngOnInit() {
    // 🔹 Firestore → inscriptions
    const usersRef = collection(this.firestore, 'users');
    const chauffeursRef = collection(this.firestore, 'drivers');   // ⚠️ tu avais `chauffeurs` mais ta collection est `drivers`
    const livreursRef = collection(this.firestore, 'livreurs');

    this.utilisateurs$ = collectionData(usersRef, { idField: 'id' });
    this.chauffeurs$ = collectionData(chauffeursRef, { idField: 'id' });
    this.livreurs$ = collectionData(livreursRef, { idField: 'id' });

    // 🔹 Realtime Database → présence connectés
    this.statutDirectService.counts$().subscribe(counts => {
      this.usersOnline = counts.users;
      this.driversOnline = counts.drivers;
      this.couriersOnline = counts.couriers;
      this.totalOnline = counts.totalOnline;
    });
  }

  afficherListe(type: 'utilisateurs' | 'chauffeurs' | 'livreurs') {
  this.listeActive = type;
}

}
