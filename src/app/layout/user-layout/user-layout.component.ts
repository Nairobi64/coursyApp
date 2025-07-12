import { Component, inject, OnInit } from '@angular/core';
import { AuthServiceService } from 'src/app/services/auth.service.service';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  standalone: true,
  imports : [IonicModule, CommonModule, RouterModule]
})
export class UserLayoutComponent  implements OnInit {

  private authService = inject(AuthServiceService);
  private router = inject(Router);

  prenom = '';



  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.prenom = user?.prenom || '';
  }

  logout() {
    localStorage.clear();
    location.href = '/connexion-user';
  }

  openWhatsApp(){
    
  }

}
