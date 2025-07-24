import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth.service.service';

import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class RegisterUserComponent implements OnInit {
  registerForm!: FormGroup;

  // 👉 Injection manuelle avec `inject()` pour éviter les erreurs
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);
  private db = inject(Firestore);
  private authService = inject(AuthServiceService);


  loading = false;
  errorMessage = '';

  ngOnInit() {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{8,15}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

    invalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }


  async register() {
  console.log('🟢 Tentative d’enregistrement');
  this.errorMessage = '';
  this.loading = true;

  if (this.registerForm.invalid) {
    console.warn('Formulaire invalide');
    this.loading = false;
    return;
  }

  const { nom, prenom, telephone, email, password } = this.registerForm.value;

  try {
    await this.authService.register(email, password, {
      nom,
      prenom,
      telephone,
      role: 'user'
    });

    console.log('✅ Utilisateur enregistré via service');
  } catch (error: any) {
    console.error('Erreur Service:', error);
    this.errorMessage = error.message || 'Une erreur est survenue';
  } finally {
    this.loading = false;
  }
}



}
