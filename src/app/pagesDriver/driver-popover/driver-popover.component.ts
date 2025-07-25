import { Component, OnInit } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-driver-popover',
  templateUrl: './driver-popover.component.html',
  styleUrls: ['./driver-popover.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class DriverPopoverComponent  implements OnInit {
 

  constructor(private popoverCtrl: PopoverController) {}
 

  ngOnInit() {}


  editProfile() {
    this.popoverCtrl.dismiss();
    // logiques de modification
  }

  logout() {
    this.popoverCtrl.dismiss();
    // déconnexion
  }
}
