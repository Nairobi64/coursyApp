import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common'



@Component({
  selector: 'app-popup-commande',
  templateUrl: './popup-commande.component.html',
  styleUrls: ['./popup-commande.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class PopupCommandeComponent  implements OnInit {


  @Input() depart!: string;
  @Input() destination!: string;
  @Input() distance!: number;
  @Input() duree!: number;
  @Input() prix!: number;

  constructor(private modalCtrl: ModalController) {}

    ngOnInit() {}

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    this.modalCtrl.dismiss(
      { depart: this.depart, destination: this.destination, distance: this.distance, duree: this.duree, prix: this.prix },
      'confirm'
    );
  }

}
