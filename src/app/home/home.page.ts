import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [  RouterModule,IonicModule, CommonModule],
})
export class HomePage implements OnInit {

 constructor(private router: Router) {}


  ngOnInit() {

    setTimeout(() => {
      this.router.navigate(['/login-user']);
    }, 2000); // Redirection après 2 secondes

  }
}
