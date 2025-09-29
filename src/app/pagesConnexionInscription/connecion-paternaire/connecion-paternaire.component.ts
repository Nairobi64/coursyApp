import { Component, inject,OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth.service.service';


@Component({
  selector: 'app-connecion-paternaire',
  templateUrl: './connecion-paternaire.component.html',
  styleUrls: ['./connecion-paternaire.component.scss'],
  standalone: true,
  imports : [IonicModule,CommonModule, RouterModule,ReactiveFormsModule]
})
export class ConnecionPaternaireComponent  implements OnInit {

  activeTab: 'drivers' | 'livreurs' = 'drivers';
  loading = false;
  errorMessage = '';


  constructor(
    private fb : FormBuilder,
    private authService : AuthServiceService,
    private router : Router

  
  ) { }

  ngOnInit() {}

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });


  async login() {
    
    try {
      const credentials = await this.authService.login(this.loginForm.value.email!, this.loginForm.value.password!);
      const uid = credentials.user.uid;

      // On récupère le profil chauffeur ou livreur
      // Essaye d'abord dans chauffeurs, sinon dans livreurs
      let userDoc: any = null;
      try {
        userDoc = await this.authService.getUserProfile(uid, 'drivers').toPromise();
      } catch {}
      if (!userDoc) {
        try {
          userDoc = await this.authService.getUserProfile(uid, 'livreurs').toPromise();
        } catch {}
      }

      if (!userDoc) {
        throw new Error('Aucun profil trouvé.');
      }

      // Sauvegarde local
      localStorage.setItem('currentUser', JSON.stringify(userDoc));

      // Redirection selon rôle
      this.authService.redirectAfterLogin(userDoc.role);
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors de la connexion.';
      console.error('Erreur de connection:', error);
    } finally {
      this.loading = false;
    }


    
  }

   loginWithGoogle() {
  this.authService.loginWithGoogle()
    .then(user => console.log('Utilisateur connecté:', user))
    .catch(err => console.error(err));
}

}
