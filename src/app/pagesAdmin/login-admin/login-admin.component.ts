import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth.service.service';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss'],
  standalone : true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginAdminComponent  implements OnInit {

  email = '';
  password = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private authService : AuthServiceService
  ) { }

  private async showToast(message: string, color: 'success' | 'danger' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }

  ngOnInit() {}

   async login() {
    if (!this.email || !this.password) {
      return this.showToast('Veuillez remplir tous les champs', 'danger');
    }

    const loading = await this.loadingCtrl.create({ message: 'Connexion...' });
    await loading.present();

    try {
      const cred = await signInWithEmailAndPassword(this.auth, this.email, this.password);

      // Vérifier le document admin dans Firestore
      const adminRef = doc(this.firestore, `admins/${cred.user.uid}`);
      const snap = await getDoc(adminRef);

      if (!snap.exists()) {
        await loading.dismiss();
        await this.showToast('Profil admin introuvable.', 'danger');
        // déconnecter si nécessaire
        try { await this.auth.signOut(); } catch {}
        return;
      }

      const data = snap.data() as any;
      if ((data.role || '').toLowerCase() !== 'admin') {
        await loading.dismiss();
        await this.showToast('Accès refusé : rôle non administrateur.', 'danger');
        try { await this.auth.signOut(); } catch {}
        return;
      }

      // Sauvegarde locale minimale (tu peux adapter)
      localStorage.setItem('currentAdmin', JSON.stringify({
        uid: cred.user.uid,
        email: this.email,
        name: data.name || data.nom || ''
      }));

      await loading.dismiss();
      await this.showToast('Connecté en tant qu’administrateur', 'success');

      // Redirection tableau de bord admin
      this.router.navigate(['/admin/dashboard']);

    } catch (err: any) {
      await loading.dismiss();
      const msg = err?.message ?? 'Erreur de connexion';
      console.error('Login admin error', err);
      await this.showToast(msg, 'danger');
    }
  }
loginWithGoogle() {
  this.authService.loginWithGoogle()
    .then(user => console.log('Utilisateur connecté:', user))
    .catch(err => console.error(err));
}

}
