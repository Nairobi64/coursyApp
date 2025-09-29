import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-indisponible',
  templateUrl: './indisponible.component.html',
  styleUrls: ['./indisponible.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class IndisponibleComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
