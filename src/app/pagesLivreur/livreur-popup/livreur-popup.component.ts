import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonicModule, PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-livreur-popup',
  templateUrl: './livreur-popup.component.html',
  styleUrls: ['./livreur-popup.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LivreurPopupComponent  implements OnInit {

  constructor(

private popoverController: PopoverController,
     private router: Router
  ){}

  

  ngOnInit() {}


  
  async goToEditProfile() {
    await this.popoverController.dismiss();
    this.router.navigate(['/livreur/modif-livreur']); // ou autre route
  }

  async logout() {
    await this.popoverController.dismiss();
    // Ajouter la logique de déconnexion si besoin
    this.router.navigate(['/login-driver']);
  }

}
