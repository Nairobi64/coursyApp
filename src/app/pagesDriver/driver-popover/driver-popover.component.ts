import { Component, OnInit } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-driver-popover',
  templateUrl: './driver-popover.component.html',
  styleUrls: ['./driver-popover.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class DriverPopoverComponent  implements OnInit {
 

  constructor(
    private popoverController: PopoverController,
    private router: Router
  ) {}
 

  ngOnInit() {}


  async goToEditProfile() {
    await this.popoverController.dismiss();
    this.router.navigate(['/driver/modif-driver']); // ou autre route
  }

  async logout() {
    await this.popoverController.dismiss();
    // Ajouter la logique de déconnexion si besoin
    this.router.navigate(['/login-driver']);
  }
}
