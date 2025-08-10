import { Component, OnInit, inject  } from '@angular/core';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { AuthServiceService } from 'src/app/services/auth.service.service';

@Component({
  selector: 'app-register-driver',
  templateUrl: './register-driver.component.html',
  styleUrls: ['./register-driver.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class RegisterDriverComponent  implements OnInit {

  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';

   private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthServiceService);

  
  constructor(
  private firestore: Firestore,
  private auth: Auth
) {
  this.registerForm = this.fb.group({
  nom: ['', Validators.required],
  prenom: ['', Validators.required],
  ville: ['', Validators.required],
  telephone: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  role: ['drivers', Validators.required], // 👈 chauffeur/livreur
  matricule: ['', Validators.required],
  marque: ['', Validators.required],
  couleur: ['', Validators.required]
});

}



  ngOnInit() {

    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{8,15}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['drivers', Validators.required], // 👈 chauffeur/livreur
      matricule: ['', Validators.required],
      marque: ['', Validators.required],
      couleur: ['', Validators.required]
    });
  }


  async register() {
  this.errorMessage = '';
  this.loading = true;

  // Stop si invalide
  if (this.registerForm.invalid) return;

  const {
    nom,
    prenom,
    ville,
    telephone,
    email,
    password,
    role,        // 👈 Doit être présent dans le formulaire
    matricule,
    marque,
    couleur
  } = this.registerForm.value;

  try {
    await this.authService.register(email, password, {
      nom,
      prenom,
      ville,
      telephone,
      role,        // 'chauffeur' ou 'livreur'
      matricule,
      marque,
      couleur,
      disponible: false // par défaut
    });

    this.router.navigate(['/driver/profile']);
    console.log('✅ Chauffeur inscrit avec succès');
  } catch (error: any) {
    this.errorMessage = error.message;
  } finally {
    this.loading = false;
  }
}


}
