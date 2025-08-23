import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router'

@Component({
  selector: 'app-register-admin',
  templateUrl: './register-admin.component.html',
  styleUrls: ['./register-admin.component.scss'],
  standalone : true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterAdminComponent  implements OnInit {

  name = '';
  email = '';
  password = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {}


  async register() {
    if (!this.name || !this.email || !this.password) {
      return this.showToast('Veuillez remplir tous les champs', 'danger');
    }

    const loading = await this.loadingCtrl.create({ message: 'Création du compte...' });
    await loading.present();

    try {
      const cred = await createUserWithEmailAndPassword(this.auth, this.email, this.password);

      // Enregistrer dans Firestore avec le rôle admin
      await setDoc(doc(this.firestore, `admins/${cred.user.uid}`), {
        uid: cred.user.uid,
        name: this.name,
        email: this.email,
        role: 'admin',
        createdAt: new Date()
      });

      await loading.dismiss();
      this.showToast('Compte admin créé avec succès', 'success');
      this.router.navigate(['/admin/dashboard']);
    } catch (err: any) {
      await loading.dismiss();
      this.showToast(err.message, 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
