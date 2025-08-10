import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc, DocumentChange, DocumentData, QuerySnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';



@Injectable({
  providedIn: 'root'
})
export class LivraisonServiceService {
 constructor(

  private Firestore :Firestore,
  private AlertController : AlertController,
  private auth: Auth
 ) {
    this.listenToLivraisonCommandes();
  }

  async isLivreurDisponible(uid: string): Promise<boolean> {
    const livreurRef = doc(this.Firestore, `livreurs/${uid}`);
    const snap = await getDoc(livreurRef);
    if (!snap.exists()) return false;
    const data = snap.data();
return data?.['disponible'] === true;  }

  listenToLivraisonCommandes() {
    const user = this.auth.currentUser;
    if (!user) return;

    const commandesRef = collection(this.Firestore, 'commandes');
    const q = query(
      commandesRef,
      where('statut', '==', 'en attente'),
      where('service', '==', 'livraison')
    );

    onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const commande = change.doc.data();
          const commandeId = change.doc.id;

          const isDispo = await this.isLivreurDisponible(user.uid);
          if (isDispo) {
            this.promptCommandeLivreur(commande, commandeId);
          }
        }
      }
    });
  }

  private async promptCommandeLivreur(commande: any, commandeId: string) {
    const alert = await this.AlertController.create({
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
            const user = this.auth.currentUser;
            if (!user) return;

            const commandeRef = doc(this.Firestore, `commandes/${commandeId}`);
            const snap = await getDoc(commandeRef);

            if (!snap.exists() || snap.data()?.['statut'] !== 'en attente') {
              const info = await this.AlertController.create({
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
                uid: user.uid,
                prenom: user.displayName || 'Livreur',
                photoURL: user.photoURL || ''
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }



  


  
}
