import { Injectable } from '@angular/core';
import { Firestore, query, where, doc, getDoc, updateDoc, collection, collectionData } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private currentUser: User | null = null;

  constructor(
    private firestore: Firestore,
    private alertController: AlertController,
    private auth: Auth
  ) {}

  setUser(user: User | null) {
    this.currentUser = user;
  }

  // Vérifie si le livreur est disponible
  async isLivreurDisponible(uid: string): Promise<boolean> {
    const livreurRef = doc(this.firestore, `livreurs/${uid}`);
    const snap = await getDoc(livreurRef);
    if (!snap.exists()) return false;
    return snap.data()?.['statut'] === 'disponible';
  }

  // Écoute les livraisons en attente pour le livreur courant
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

  // Accepte une livraison
  async acceptLivraison(commandeId: string): Promise<boolean> {
    if (!this.currentUser) return false;

    const commandeRef = doc(this.firestore, `livraison/${commandeId}`);
    const snap = await getDoc(commandeRef);

    if (!snap.exists() || snap.data()?.['statut'] !== 'en attente') {
      return false;
    }

    await updateDoc(commandeRef, {
      statut: 'prise en charge',
      livreurId: this.currentUser.uid,
      livreur: {
        uid: this.currentUser.uid,
        nom: this.currentUser.displayName || '',
        prenom: this.currentUser.displayName || '',
        telephone: this.currentUser.phoneNumber || '',
        photoURL: this.currentUser.photoURL || '',
        role: 'courier',
        statut: 'occupé'
      }
    });

    return true;
  }

  // Annule une livraison
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
}
