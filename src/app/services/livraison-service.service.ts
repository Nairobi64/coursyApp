import { Injectable } from '@angular/core';
import { Firestore, query, where, doc, getDoc,orderBy, updateDoc, collection,addDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { serverTimestamp } from 'firebase/firestore';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private currentUser: User | null = null;
  

  constructor(
    private firestore: Firestore,
    private alertController: AlertController,
    private auth: Auth,
    private router: Router,
    private notifService: NotificationsService
  ) {}

  setUser(user: User | null) {
    this.currentUser = user;
  }

  
  // ✅ Vérifie si le livreur est disponible
async isLivreurDisponible(uid: string): Promise<boolean> {
  const livreurRef = doc(this.firestore, `livreurs/${uid}`);
  const snap = await getDoc(livreurRef);
  if (!snap.exists()) return false;

  const data = snap.data();
  // 🔥 On force toujours le champ disponible à être un boolean
  return data?.['disponible'] === true;
}




  // ✅ Écoute les commandes en attente
  listenToCommandes(callback: (commande: any, id: string) => void) {
    if (!this.currentUser) return;

    const commandesRef = collection(this.firestore, 'livraison');
    const q = query(commandesRef, where('statut', '==', 'en attente'));

    collectionData(q, { idField: 'id' }).subscribe(async commandes => {
      const isDispo = await this.isLivreurDisponible(this.currentUser!.uid);
      if (!isDispo) return;

      for (const commande of commandes) {
        callback(commande, commande['id']);
      }
    });
  }

  
// ✅ Accepter une livraison
async acceptLivraison(commandeId: string): Promise<boolean> {
  if (!this.currentUser) return false;

  const commandeRef = doc(this.firestore, `livraison/${commandeId}`);
  const snap = await getDoc(commandeRef);

  if (!snap.exists() || snap.data()?.['statut'] !== 'en attente') {
    return false;
  }

  const livreurRef = doc(this.firestore, `livreurs/${this.currentUser.uid}`);
  const livreurSnap = await getDoc(livreurRef);
  if (!livreurSnap.exists()) return false;

  const dataLivreur: any = livreurSnap.data();
  const dataCommande: any = snap.data();

  // ✅ Met à jour la commande
  await updateDoc(commandeRef, {
    statut: 'acceptée',
    livreurId: this.currentUser.uid,
    livreur: {
      uid: this.currentUser.uid,
      nom: dataLivreur.nom ?? '',
      prenom: dataLivreur.prenom ?? '',
      telephone: dataLivreur.telephone ?? '',
      photoURL: dataLivreur.photoUrl ?? '',
      role: 'livreur'
    }
  });

  // ✅ Met à jour la dispo du livreur
  await updateDoc(livreurRef, { disponible: false });

  // ✅ Ajoute directement dans l’historique du livreur
  const historiqueRef = collection(this.firestore, 'commandes_livreur');
  await addDoc(historiqueRef, {
    uid: this.currentUser.uid,
    commandeId,
    depart: dataCommande.depart,
    destination: dataCommande.destination,
    statut: 'acceptée',
    updatedAt: new Date()
  });

  return true;
}


  // ✅ Annuler une livraison
  async annulerLivraison(commandeId: string): Promise<boolean> {
    const livraisonRef = doc(this.firestore, `livraison/${commandeId}`);
    const snap = await getDoc(livraisonRef);

    if (!snap.exists()) {
      console.error("Erreur : livraison introuvable !");
      return false;
    }

    await updateDoc(livraisonRef, {
      statut: 'annulée'
    });

    return true;
    
  }

  async presentLivraisonAlert(commandeId: string) {
    const alert = await this.alertController.create({
      header: 'Nouvelle Livraison',
      message: 'Voulez-vous accepter cette livraison ?',
      buttons: [
        {
          text: 'Refuser',
          role: 'cancel',
          handler: async () => {
            await this.annulerLivraison(commandeId);
            return true; // 👈 ferme l’alerte au premier clic
          }
        },
        {
          text: 'Accepter',
          handler: async () => {
            await this.acceptLivraison(commandeId);
            return true; // 👈 ferme l’alerte au premier clic
          }
        }
      ]
    });

    await alert.present();
  }


  // annuler une commande au motif ''prise en charge''
async annulerLivraisonAvecMotif(commandeId: string, motif: string, role: 'user' | 'livreur') {
  const livraisonRef = doc(this.firestore, `livraison/${commandeId}`);
  const snap = await getDoc(livraisonRef);

  if (!snap.exists()) {
    console.error("Erreur : livraison introuvable !");
    return false;
  }

  const data = snap.data() as any;

  await updateDoc(livraisonRef, {
    statut: 'annulée',
    motifAnnulation: motif,
    annulePar: role,
    dateAnnulation: new Date()
  });

  // 🔔 Création de notification selon qui annule
  if (role === 'user' && data.livreurId) {
    await this.notifService.createNotification(
      data.livreurId,
      `La commande ${commandeId} a été annulée par le client. Motif : ${motif}`,
      'annulation',
      commandeId
    );
  }

  if (role === 'livreur' && data.clientId) {
    await this.notifService.createNotification(
      data.clientId,
      `Votre commande ${commandeId} a été annulée par le livreur. Motif : ${motif}`,
      'annulation',
      commandeId
    );
  }

  return true;
}



async presentCancelAlert(commandeId: string, role: 'user' | 'livreur') {
  const alert = await this.alertController.create({
    header: 'Annuler la commande',
    message: 'Indiquez le motif de l’annulation',
    inputs: [
      {
        name: 'motif',
        type: 'text',
        placeholder: 'Ex: Client absent / Problème technique'
      }
    ],
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Confirmer',
        handler: async (data) => {
          if (data.motif && data.motif.trim().length > 0) {
            await this.annulerLivraisonAvecMotif(commandeId, data.motif, role);
          } else {
            console.warn("Motif obligatoire !");
            return false; // ⚡ reste ouvert si vide
          }
          return true; // ⚡ ferme si motif rempli
        }
      }
    ]
  });

  await alert.present();
}



// pour l'ordre des livraisons

async getHistoriqueLivreur(livreurId: string) {
  const livraisonRef = collection(this.firestore, 'livraison');
  const q = query(
    livraisonRef,
    where('livreurId', '==', livreurId),
    orderBy('createdAt', 'desc') // ordre décroissant : la dernière commande en haut
  );

  const querySnapshot = await getDocs(q);
  const commandes: any[] = [];
  querySnapshot.forEach(docSnap => {
    commandes.push({ id: docSnap.id, ...docSnap.data() });
  });

  return commandes;
}

// historique des commandes de livraison pour le client
private async updateHistoriqueLivraisonUser(clientId: string, commandeId: string, statut: string) {
  const commandesRef = collection(this.firestore, 'commandes_livreur');

  await addDoc(commandesRef, {
    uid: clientId,
    commandeId,
    statut,
    updatedAt: new Date()
  });
}


// 🔔 Notifier le client (push + redirection)
async notifierClientCommande(commandeId: string, message: string) {
  const commandeRef = doc(this.firestore, `livraison/${commandeId}`);
  const snap = await getDoc(commandeRef);
  if (!snap.exists()) return;

  const data = snap.data() as any;
  if (!data.clientId) return;

  // 🔔 Crée une notif Firestore
  await this.notifService.createNotification(
    data.clientId,
    message,
    'commande',
    commandeId, // 👈 on ajoute le lien ici
    '/user/commande'
  );
  


  // 📩 Champ utilisé par Cloud Functions pour push
  await updateDoc(commandeRef, {
    notifClientPending: {
      message,
      to: data.clientId,
      redirectTo: '/user/commande'
    }
  });
}


async updatePosition(lat: number, lng: number) {
  if (!this.currentUser) return;
  const livreurRef = doc(this.firestore, `livreurs/${this.currentUser.uid}`);
  await updateDoc(livreurRef, {
    position: { lat, lng },
    updatedAt: new Date()
  });
}




}
