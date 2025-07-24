import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from 'src/app/services/auth.service.service';

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
  photoUrl = '';



  ngOnInit(): void {
    const user = this.authService.getCurrentUser(); // doit retourner { prenom, photoUrl? }
    this.prenom = user?.prenom || '';
    this.photoUrl = user?.photoUrl || '';
  }

   logout() {
    localStorage.clear();
    this.authService.logout();
    location.href = '/login-user';
  }


  openWhatsApp(){
    
  }

}
