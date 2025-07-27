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

  ngOnInit() {

    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{8,15}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }


  async register() {
    this.errorMessage = '';
    this.loading = true;

    if (this.registerForm.invalid) return;

    const { nom, prenom,ville, telephone, email, password } = this.registerForm.value;

    try {
      await this.authService.register(email, password, {
        nom,
        prenom,
        ville,
        telephone,
        role: 'driver',
      }
    );
     this.router.navigate(['/driver/profile']);


      console.log('✅ Chauffeur inscrit');
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  }

}
