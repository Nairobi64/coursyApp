import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, IonCard, IonButton, IonInput, IonLabel } from '@ionic/angular';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';



@Component({
  selector: 'app-suivi-colis',
  templateUrl: './suivi-colis.component.html',
  styleUrls: ['./suivi-colis.component.scss'],
  standalone : true,
  imports: [IonicModule, CommonModule, FormsModule ]
})
export class SuiviColisComponent  implements OnInit {

 trackingNumber: string = '';
  colis: any = null;
  loading: boolean = false;

  constructor(private firestore: Firestore, private toastCtrl: ToastController) {}

  ngOnInit() {}

  async rechercherColis() {
    if (!this.trackingNumber) return;

    this.loading = true;
    this.colis = null;

    try {
      const colisRef = collection(this.firestore, 'colis');
      const q = query(colisRef, where('trackingNumber', '==', this.trackingNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        this.colis = querySnapshot.docs[0].data();
      } else {
        const toast = await this.toastCtrl.create({
          message: 'Aucun colis trouvé avec ce numéro de suivi.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    } catch (error) {
      console.error(error);
      const toast = await this.toastCtrl.create({
        message: 'Erreur lors de la récupération du colis.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }


}
