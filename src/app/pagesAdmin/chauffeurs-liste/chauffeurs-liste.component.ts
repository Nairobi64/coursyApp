import { Component, OnInit } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription  } from 'rxjs';
import { StatutDirectService } from 'src/app/services/statut-direct.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-chauffeurs-liste',
  templateUrl: './chauffeurs-liste.component.html',
  styleUrls: ['./chauffeurs-liste.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ChauffeursListeComponent  implements OnInit {

chauffeurs$!: Observable<any[]>;
  onlineCount: number = 0;
  driversOnline = 0;

  constructor(private firestore: Firestore,
              private statutService: StatutDirectService
  ) {}

 ngOnInit() {
    // Récupérer tous les chauffeurs depuis Firestore
    const col = collection(this.firestore, 'chauffeurs');
    this.chauffeurs$ = collectionData(col, { idField: 'id' });

    // Suivre les connectés via Realtime Database
    this.statutService.counts$().subscribe(counts => {
      this.onlineCount = counts.drivers;
    });

     this.statutService.counts$().subscribe(counts => {
      this.driversOnline = counts.drivers;
    });
  }

}
