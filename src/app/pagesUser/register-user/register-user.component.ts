import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service.service';

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
  private authService = inject(AuthService);


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


  async registerUser() {
  this.errorMessage = '';
  this.loading = true;

  if (this.registerForm.invalid) {
    this.loading = false;
    return;
  }

  const { nom, prenom, telephone, email, password } = this.registerForm.value;
  const photoUrl = ''; // si tu as une photo sinon undefined ou null

  try {
    await this.authService.registerUser(email, password, prenom, 'users', photoUrl);
     this.router.navigate(['/user/commande']);
    // après inscription, redirige ou autre
  } catch (error: any) {
    this.errorMessage = error.message || 'Une erreur est survenue';
  } finally {
    this.loading = false;
  }}


}
