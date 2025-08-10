import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from 'src/app/services/auth.service.service';

@Component({
  selector: 'app-login-user',
  templateUrl: './login-user.component.html',
  styleUrls: ['./login-user.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class LoginUserComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async login() {
    this.errorMessage = '';
    this.loading = true;

    const { email, password } = this.loginForm.value;

    try {
      // ✅ Utilisation du service pour gérer la connexion et la redirection
      await this.authService.loginUser(email, password);
    } catch (err: any) {
      console.error('Erreur de connexion :', err);
      this.errorMessage = err.message || 'Échec de la connexion';
    } finally {
      this.loading = false;
    }
  }
}
