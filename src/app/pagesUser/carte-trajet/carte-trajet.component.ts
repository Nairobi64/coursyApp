import { Livreur } from '../../models/model-livreur';
import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Trajet } from 'src/app/models/model-trajet';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CommandeService } from 'src/app/services/commande.service';
import { LivraisonService } from 'src/app/services/livraison-service.service';

declare var google: any;

@Component({
  selector: 'app-carte-trajet',
  templateUrl: './carte-trajet.component.html',
  styleUrls: ['./carte-trajet.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CarteTrajetComponent implements OnInit, AfterViewInit {

  trajet: Trajet = {
    uid: '',
    createdAt: new Date(),
    depart: '',
    destination: '',
    distance: 0,
    duree: 0,
    prix: 0 
  };

  commandeId: string | null = null;
  Livreur: any = null;
  loading: boolean = true; // Loader pendant l'attente
  private map: any;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(private route: ActivatedRoute, 
              private loadingCtrl: LoadingController,
              private commandeService: CommandeService,
              private livraisonService: LivraisonService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.commandeId = params['commandeId'] || null;
      if (this.commandeId) {
        this.listenCommandeRealtime(this.commandeId);
      } else {
        console.warn('⚠️ ID de livraison manquant');
      }
    });
  }

  ngAfterViewInit() {
    // La carte sera initialisée après récupération du trajet
  }

  async listenCommandeRealtime(commandeId: string) {
    const commandeRef = doc(this.firestore, `livraison/${commandeId}`);

    onSnapshot(commandeRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn('⚠️ Livraison introuvable');
        return;
      }

      const data = snapshot.data() as any;

      // Charger les infos du trajet
      this.trajet.depart = data.depart;
      this.trajet.destination = data.destination;
      this.trajet.distance = data.distance;
      this.trajet.duree = data.duree;
      this.trajet.prix = data.prix;

      // Vérifier si un livreur a accepté
      if (data.livreur) {
        this.Livreur = data.livreur;
        this.loading = false; // Stop le spinner dès qu'un livreur est affecté
      } else {
        this.Livreur = null;
        this.loading = true;
      }

      // Initialiser la carte uniquement si depart et destination sont valides
      if (this.trajet.depart && this.trajet.destination && !this.map) {
        this.initMap();
      } else if (!this.trajet.depart || !this.trajet.destination) {
        console.warn('⚠️ Départ ou destination manquant pour Google Maps');
      }
    });
  }

  initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      zoom: 13,
      center: { lat: 14.6928, lng: -17.4467 } // Dakar par défaut
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true
    });

    directionsService.route(
      {
        origin: this.trajet.depart,
        destination: this.trajet.destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);

          const bounds = new google.maps.LatLngBounds();
          const route = result.routes[0].overview_path;
          route.forEach((point: any) => bounds.extend(point));
          this.map.fitBounds(bounds);

          // Marqueurs départ et arrivée
          const start = route[0];
          const end = route[route.length - 1];

          new google.maps.Marker({
            position: start,
            map: this.map,
            title: 'Départ',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          });

          new google.maps.Marker({
            position: end,
            map: this.map,
            title: 'Destination',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });
        } else {
          console.error('Erreur DirectionsService', status);
        }
      }
    );
  }

  async callLivreur() {
    if (this.Livreur?.telephone) {
      window.open(`tel:${this.Livreur.telephone}`);
    }
  }

  async messageLivreur() {
    if (this.Livreur?.telephone) {
      const phone = this.Livreur.telephone.replace('+', '').replace(/\s+/g, '');
      const message = encodeURIComponent(`Bonjour ${this.Livreur.nom}, je suis votre client sur Call-coursy.`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  }

  annulerCommande() {
  if (!this.commandeId) return;
  this.livraisonService.annulerLivraison(this.commandeId)
    .then(res => {
      if(res) console.log('Livraison annulée');
    })
    .catch(err => console.error('Erreur lors de l\'annulation :', err));
}

}
