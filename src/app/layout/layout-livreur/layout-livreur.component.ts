import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PopoverController } from '@ionic/angular';
import { LivreurPopupComponent } from 'src/app/pagesLivreur/livreur-popup/livreur-popup.component';


@Component({
  selector: 'app-layout-livreur',
  templateUrl: './layout-livreur.component.html',
  styleUrls: ['./layout-livreur.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule]
})
export class LayoutLivreurComponent  implements OnInit {

  constructor(
    private popoverCtrl: PopoverController,
    private popoverController: PopoverController
  ) { }

  ngOnInit() {}
 async presentPopover(ev: any) {
     const popover = await this.popoverCtrl.create({
       component: LivreurPopupComponent,
       event: ev,
       translucent: true
     });
     await popover.present();
   }
 
   triggerFileInput() {
     document.getElementById('fileInput')?.click();
   }
}
