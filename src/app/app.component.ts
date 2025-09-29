import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { PushNotifications } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { NotificationsService } from './services/notifications.service';
import { CommandeService } from 'src/app/services/commande.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, RouterModule],
})
export class AppComponent {
  constructor(
    private notifService: NotificationsService,
    private commandeService: CommandeService, // ✅ ajout
    private router: Router // ✅ ajout
  ) {}

  async ngOnInit() {
    // 🔔 Notifications Push
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // ✅ S’enregistre pour recevoir les notifications
      await PushNotifications.register();
    }

    // 📌 Récupérer le token FCM
    const token = await FirebaseMessaging.getToken();
    console.log('🔥 FCM Token:', token.token);

    // 📩 Ecouter les notifications reçues
    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.log('📩 Notification reçue:', notif);
    });

    this.notifService.initPush();

    // 🚀 Vérifier si une commande est active au lancement
    this.commandeService.getActiveCommandeId().subscribe(async (commandeId) => {
      if (commandeId) {
        console.log('👉 Commande active détectée : ', commandeId);

        const active = await this.commandeService.isCommandeActive(commandeId);

        if (active) {
          // Redirige automatiquement vers la page de suivi
          this.router.navigate(['/carte-trajet', commandeId]);
        } else {
          // Nettoie si commande terminée/annulée
          this.commandeService.clearCommande();
          this.router.navigate(['/user/home']);
        }
      }
    });
  }
}
