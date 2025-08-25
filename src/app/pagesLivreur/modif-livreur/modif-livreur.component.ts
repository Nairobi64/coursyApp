import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, updatePassword, User, updateEmail  } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';



@Component({
  selector: 'app-modif-livreur',
  templateUrl: './modif-livreur.component.html',
  styleUrls: ['./modif-livreur.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule, FormsModule]
})
export class ModifLivreurComponent  implements OnInit {

 livreurId: string = '';
   livreurs: any = {
     nom: '',
     prenom: '',
     telephone: ''
   };
   newPassword: string = '';
   newEmail: string = '';
 
 
   constructor(
     private firestore: Firestore,
     private auth: Auth,
     private location: Location,
     private toastCtrl: ToastController
   ) {}
 
   async ngOnInit() {
     const user = this.auth.currentUser;
     if (user) {
       this.livreurId = user.uid;
       const driverRef = doc(this.firestore, 'drivers', this.livreurId);
       const snapshot = await getDoc(driverRef);
       if (snapshot.exists()) {
         this.livreurs = snapshot.data();
       }
     }
   }
 
   async updateProfile() {
     const user = this.auth.currentUser;
     if (!user) return;
 
     const driverRef = doc(this.firestore, 'drivers', this.livreurId);
     try {
       await updateDoc(driverRef, {
         prenom: this.livreurs.prenom,
         nom: this.livreurs.nom,
         telephone: this.livreurs.telephone
       });
 
       if (this.newPassword) {
         await updatePassword(user, this.newPassword);
       }
 
       this.presentToast('Profil mis à jour avec succès');
       this.location.back();
 
     } catch (error) {
       console.error('Erreur lors de la mise à jour :', error);
       this.presentToast("Erreur lors de la mise à jour du profil");
     }
 
     if (this.newEmail && user.email !== this.newEmail) {
   try {
     await updateEmail(user, this.newEmail);
   } catch (emailError) {
     console.error("Erreur lors de la modification de l'email :", emailError);
     this.presentToast("Erreur : vous devez vous reconnecter pour changer votre email.");
     return; // on arrête la suite si l'email échoue
   }
 }
   }
 
   goBack() {
     this.location.back();
   }
 
   async presentToast(message: string) {
     const toast = await this.toastCtrl.create({
       message,
       duration: 2500,
       position: 'bottom',
       color: 'success'
     });
     toast.present();
   }

}
