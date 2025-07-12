import { Component, OnInit , inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { AuthServiceService } from 'src/app/services/auth.service.service';

import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-login-user',
  templateUrl: './login-user.component.html',
  styleUrls: ['./login-user.component.scss'],
  standalone: true,
   imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class LoginUserComponent  implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private db = inject(Firestore);
  private router = inject(Router);
  private authService = inject(AuthServiceService);

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
      const credentials = await signInWithEmailAndPassword(this.auth, email, password);
      const uid = credentials.user.uid;

      const userRef = doc(this.db, `users/${uid}`);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        localStorage.setItem('user', JSON.stringify(userData));

        // ✅ Redirection selon le rôle
        this.authService.redirectAfterLogin(userData['role']);
      } else {
        this.errorMessage = 'Aucun compte utilisateur trouvé.';
      }
    } catch (err: any) {
      console.error('Erreur de connexion :', err);
      this.errorMessage = err.message;
    } finally {
      this.loading = false;
    }
  }
}
