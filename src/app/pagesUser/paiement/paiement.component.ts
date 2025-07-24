import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paiement',
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PaiementComponent  implements OnInit {

  trajet = {
    depart: '',
    destination: '',
    distance: 0,
    prix: 0
  };

    modePaiement: string = 'mobilemoney';


  constructor(private route: ActivatedRoute, 
              private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.trajet.depart = params['depart'] || '';
      this.trajet.destination = params['destination'] || '';
      this.trajet.distance = Number(params['distance']) || 0;
      this.trajet.prix = Number(params['prix']) || 0;
    });
  }

  validerPaiement() {
    if (this.modePaiement === 'mobilemoney') {
      // Intégration API Mobile Money ici
      alert('Redirection vers Mobile Money...');
    } else {
      // Paiement à la livraison
      alert('Commande validée, paiement à la livraison.');
    }
    // Redirection ou confirmation
    this.router.navigate(['/user/histoUser']);
  }

}
