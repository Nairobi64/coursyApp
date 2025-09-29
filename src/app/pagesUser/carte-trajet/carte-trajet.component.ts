import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { CommandeService } from 'src/app/services/commande.service';
import { LivraisonService } from 'src/app/services/livraison-service.service';
import { AlertController } from '@ionic/angular/standalone';

declare var google: any;

@Component({
  selector: 'app-carte-trajet',
  templateUrl: './carte-trajet.component.html',
  styleUrls: ['./carte-trajet.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CarteTrajetComponent implements OnInit, AfterViewInit {
  trajet: any = {
    depart: '',
    destination: '',
    distance: 0,
    duree: 0,
    prix: 0,
    statut: 'en attente',
    motifAnnulation: '',
    annulePar: 'client'
  };

  commandeId: string | null = null;
  Livreur: any = null;
  loading: boolean = true;

  private map: any;
  private directionsRenderer: any;
  private livreurMarker: any;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private commandeService: CommandeService,
    private livraisonService: LivraisonService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.commandeId = params['commandeId'] || null;
      if (this.commandeId) this.listenCommandeRealtime(this.commandeId);
    });
  }

  ngAfterViewInit() {
    // Carte initialisée dans listenCommandeRealtime
  }

  // 🔥 Écoute en temps réel de la commande
  listenCommandeRealtime(commandeId: string) {
    const commandeRef = doc(this.firestore, `livraison/${commandeId}`);
    onSnapshot(commandeRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.data() as any;
      this.trajet.depart = data.depart;
      this.trajet.destination = data.destination;
      this.trajet.distance = data.distance;
      this.trajet.duree = data.duree;
      this.trajet.prix = data.prix;
      this.trajet.statut = data.statut || 'en attente';
      this.trajet.motifAnnulation = data.motifAnnulation || '';
      this.trajet.annulePar = data.annulePar || 'client';

      if (data.livreurId) {
        this.loading = false;
        this.subscribeLivreurPosition(data.livreurId);
      } else {
        this.Livreur = null;
        this.loading = true;
      }

      if (this.trajet.depart && this.trajet.destination && !this.map) {
        this.initMap();
      }
    });
  }

  // 🔵 Suivi temps réel du livreur
  subscribeLivreurPosition(livreurId: string) {
    const livreurRef = doc(this.firestore, `livreurs/${livreurId}`);
    onSnapshot(livreurRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      this.Livreur = data;

      if (!this.map || !data.position) return;

      const latLng = new google.maps.LatLng(data.position.lat, data.position.lng);

      if (!this.livreurMarker) {
        this.livreurMarker = new google.maps.Marker({
          position: latLng,
          map: this.map,
          title: `${data.nom} ${data.prenom}`,
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
      } else {
        this.livreurMarker.setPosition(latLng);
      }

      // Centrer la carte sur le livreur
      this.map.panTo(latLng);
    });
  }

  // 🌍 Initialisation de la carte avec markers départ/destination
  initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      zoom: 13,
      center: { lat: 14.6928, lng: -17.4467 } // Dakar par défaut
    });

    const directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
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
          this.directionsRenderer.setDirections(result);
          const route = result.routes[0].overview_path;

          // Markers départ/arrivée
          new google.maps.Marker({
            position: route[0],
            map: this.map,
            title: 'Départ',
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
          });

          new google.maps.Marker({
            position: route[route.length - 1],
            map: this.map,
            title: 'Destination',
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          });

          // Ajuste la vue
          const bounds = new google.maps.LatLngBounds();
          route.forEach((point: any) => bounds.extend(point));
          this.map.fitBounds(bounds);
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

  async annulerCommande() {
    if (!this.commandeId) return;

    const alert = await this.alertCtrl.create({
      header: 'Annuler la commande',
      inputs: [{ name: 'motif', type: 'text', placeholder: 'Indiquez le motif...' }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Confirmer',
          handler: async (data) => {
            if (!data.motif) return false;
            await this.livraisonService.annulerLivraisonAvecMotif(
              this.commandeId!,
              data.motif,
              'user'
            );
            this.router.navigate(['/user/commande']);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }
}
