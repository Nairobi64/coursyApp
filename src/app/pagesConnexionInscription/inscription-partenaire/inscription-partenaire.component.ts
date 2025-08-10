import { Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service.service';
@Component({
  selector: 'app-inscription-partenaire',
  templateUrl: './inscription-partenaire.component.html',
  styleUrls: ['./inscription-partenaire.component.scss'],
  standalone: true,
  imports : [IonicModule,FormsModule, ReactiveFormsModule, CommonModule, RouterModule]
})
export class InscriptionPartenaireComponent  implements OnInit {

  activeTab: 'drivers' | 'livreurs' = 'drivers';
  loading = false;
  errorMessage = '';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);


  ngOnInit(): void {
    
  }

  chauffeurForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    ville: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{8,15}$')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    matricule: ['', Validators.required],
    marque: ['', Validators.required],
    couleur: ['', Validators.required]
  });

  livreurForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    ville: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern('^\\+?[0-9]{8,15}$')]],
    email: ['', [Validators.required, Validators.email]],
    Matricule: ['', Validators.required],
    Couleur: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async register(role: 'drivers' | 'livreurs') {
    this.errorMessage = 'Vous n avez pas pu vous enregistrer.';
    this.loading = true;

    const form = role === 'drivers' ? this.chauffeurForm : this.livreurForm;
    if (form.invalid) { this.loading = false; return; }

    try {
      await this.authService.register(
        form.value.email!,
        form.value.password!,
        { ...form.value, role, disponible: false }
      );
      this.router.navigate([role === 'drivers' ? '/driver/profile' : '/livreur/profile']);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  }

}
