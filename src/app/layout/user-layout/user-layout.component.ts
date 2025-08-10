import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class UserLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  prenom = '';
  photoUrl = '';

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      console.warn('Aucun utilisateur connecté, redirection vers login');
      this.router.navigate(['/login-user']);
      return;
    }

    this.prenom = user.prenom || '';
    this.photoUrl = user.photoUrl || '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login-user')
  }

  openWhatsApp(): void {
    const phoneNumber = '+221771234567'; // Exemple : numéro du support
    const message = encodeURIComponent('Bonjour, j’ai besoin d’aide avec mon compte.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }
}
