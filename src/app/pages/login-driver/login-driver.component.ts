import { Component, OnInit, inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from 'src/app/services/auth.service.service';



@Component({
  selector: 'app-login-driver',
  templateUrl: './login-driver.component.html',
  styleUrls: ['./login-driver.component.scss'],
  standalone: true,
   imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
})
export class LoginDriverComponent  implements OnInit {
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

      const driverRef = doc(this.db, `drivers/${uid}`);
      const docSnap = await getDoc(driverRef);

      if (docSnap.exists()) {
        const driverData = docSnap.data();
        localStorage.setItem('user', JSON.stringify(driverData));

        // ✅ Redirection selon le rôle
        this.authService.redirectAfterLogin(driverData['role']);
      } else {
        this.errorMessage = 'Aucun profil chauffeur trouvé.';
      }
    } catch (err: any) {
      console.error('Erreur de connexion chauffeur :', err);
      this.errorMessage = err.message;
    } finally {
      this.loading = false;
    }
  }

}
