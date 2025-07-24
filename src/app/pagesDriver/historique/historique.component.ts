import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-historique',
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.scss'],
  standalone:true,
  imports : [IonicModule]
})
export class HistoriqueComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
