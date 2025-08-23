import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
import { QuerySnapshot, DocumentData } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class LivraisonServiceService {
  private currentUser: User | null = null;

  constructor(
    private firestore: Firestore,
    private alertController: AlertController,
    private auth: Auth
  ) {
    // On attend que Firebase donne l'utilisateur avant de commencer l'écoute
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.listenToLivraisonCommandes();
      }
    });
  }

  async isLivreurDisponible(uid: string): Promise<boolean> {
    const livreurRef = doc(this.firestore, `livreurs/${uid}`);
    const snap = await getDoc(livreurRef);
    if (!snap.exists()) return false;
    return snap.data()?.['disponible'] === true;
  }

  private listenToLivraisonCommandes() {
  if (!this.currentUser) return;

  const commandesRef = collection(this.firestore, 'livraison');
  const q = query(
    commandesRef,
    where('statut', '==', 'en attente')
  );

  onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const commande = change.doc.data();
        const commandeId = change.doc.id;

        const isDispo = await this.isLivreurDisponible(this.currentUser!.uid);
        if (isDispo) {
          this.promptCommandeLivreur(commande, commandeId);
        }
      }
    }
  });
}


  private async promptCommandeLivreur(commande: any, commandeId: string) {
    const alert = await this.alertController.create({
      header: 'Nouvelle livraison',
      message: `
        <strong>Départ:</strong> ${commande.depart}<br>
        <strong>Destination:</strong> ${commande.destination}<br>
        <strong>Prix:</strong> ${commande.prix} FCFA<br><br>
        Voulez-vous accepter cette livraison ?
      `,
      buttons: [
        { text: 'Refuser', role: 'cancel' },
        {
          text: 'Accepter',
          handler: async () => {
            if (!this.currentUser) return;

            const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
            const snap = await getDoc(commandeRef);

            if (!snap.exists() || snap.data()?.['statut'] !== 'en attente') {
              const info = await this.alertController.create({
                header: 'Commande déjà prise',
                message: `Cette livraison a déjà été acceptée.`,
                buttons: ['OK']
              });
              await info.present();
              return;
            }

            await updateDoc(commandeRef, {
              statut: 'prise en charge',
              livreur: {
                uid: this.currentUser.uid,
                prenom: this.currentUser.displayName || 'Livreur',
                photoURL: this.currentUser.photoURL || ''
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }
}
