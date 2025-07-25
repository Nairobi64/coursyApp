import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-driver-menu',
  templateUrl: './driver-menu.component.html',
  styleUrls: ['./driver-menu.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
})
export class DriverMenuComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

  logout() {
    // log out avec Firebase Auth
    localStorage.clear();
    location.href = '/login-driver'; // ou utiliser Router
  }

}
