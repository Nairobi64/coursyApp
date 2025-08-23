import { Component, OnInit } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { StatutDirectService } from 'src/app/services/statut-direct.service';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-livreurs-liste',
  templateUrl: './livreurs-liste.component.html',
  styleUrls: ['./livreurs-liste.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LivreursListeComponent  implements OnInit {

  livreurs$!: Observable<any[]>;
  onlineCount: number = 0;

  constructor(private firestore: Firestore,
              private statutService: StatutDirectService
  ) {}

  ngOnInit(): void {
    // Récupérer tous les livreurs depuis Firestore
    const col = collection(this.firestore, 'livreurs');
    this.livreurs$ = collectionData(col, { idField: 'id' });

    // Suivre les connectés via Realtime Database
    this.statutService.counts$().subscribe(counts => {
      this.onlineCount = counts.couriers;
    });
  }

}
