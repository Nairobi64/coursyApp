import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, doc, getDoc,updateDoc, QuerySnapshot, DocumentData, DocumentChange} from '@angular/fire/firestore';

import { Auth } from '@angular/fire/auth';
import { Observable,  } from 'rxjs';
import { onSnapshot } from '@angular/fire/firestore';
import { AlertController } from '@ionic/angular';
import { inject } from '@angular/core';
import { Commande } from '../models/commande.model';
import { Router } from '@angular/router';



@Injectable({ providedIn: 'root' })
export class CommandeService {
  
  errorMessage: string = '';


  private commandes: Commande[] = [];

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private alertController = inject(AlertController);
 

  constructor( private router : Router) {
  this.listenToTaxiCommandes();
  this.listenToLivraisonCommandes(); // 👉 ajout ici
}


  // 🔁 Récupérer les commandes créées par l'utilisateur connecté
  getCommandesByUser(): Observable<Commande[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(commandesRef, where('uid', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<Commande[]>;
  }


// annuler une commande
  async annulerCommande(commandeId: string, type: string) {
  try {
    const collectionName = type === 'livraison' ? 'livraison' : 'commandes';
    const commandeRef = doc(this.firestore, `${collectionName}/${commandeId}`);

    await updateDoc(commandeRef, { statut: 'annulée' });

    console.log("Commande annulée ✅");
    this.router.navigate(['/user/home']);
  } catch (err) {
    console.error("Erreur lors de l'annulation :", err);
    this.errorMessage = "Impossible d’annuler la commande.";
  }
}


  // commandes de type livraison avec statut "en attente"

  listenToLivraisonCommandes() {
  const user = this.auth.currentUser;
  if (!user) return;

  const commandesRef = collection(this.firestore, 'commandes');
  const q = query(
    commandesRef,
    where('statut', '==', 'en attente'),
    where('service', '==', 'livraison')
  );

  onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach(async (change: DocumentChange<DocumentData>) => {
      if (change.type === 'added') {
        const commande = change.doc.data() as Commande;
        const commandeId = change.doc.id;
        await this.promptCommandeLivreur(commande, commandeId);
      }
    });
  });
}

private async promptCommandeLivreur(commande: Commande, commandeId: string) {
  const alert = await this.alertController.create({
    header: 'Nouvelle livraison',
    message: `
      <strong>Départ:</strong> ${commande.depart}<br>
      <strong>Destination:</strong> ${commande.destination}<br>
      <strong>Prix:</strong> ${commande.prix} FCFA<br><br>
      Voulez-vous accepter cette livraison ?
    `,
    buttons: [
      {
        text: 'Refuser',
        role: 'cancel'
      },
      {
        text: 'Accepter',
        handler: async () => {
          const user = this.auth.currentUser;
          if (!user) return;

          const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
          const snap = await getDoc(commandeRef);

          if (!snap.exists() || snap.data()['statut'] !== 'en attente') {

            const info = await this.alertController.create({
              header: 'Commande déjà prise',
              message: `Cette livraison a déjà été acceptée.`,
              buttons: ['OK']
            });
            await info.present();
            return;

          }

          if (!snap.exists() || snap.data()['statut'] !== 'en attente') {
             // commande annulée ou déjà prise
                return;
          }



          const prenom = user.displayName || 'Livreur';
          const photoURL = user.photoURL || '';

          await updateDoc(commandeRef, {
            statut: 'prise en charge',
            livreur: {
              uid: user.uid,
              prenom: prenom,
              photoURL: photoURL
            }
          });
        }
      }
    ]
  });

  await alert.present();
}




  // 👂 Écouter les commandes de type taxi avec statut "en attente"
  listenToTaxiCommandes() {
    const user = this.auth.currentUser;
    if (!user) return;

    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(
        collection(this.firestore, 'commandes'),
        where('chauffeur.uid', '==', user.uid)
      );

      const c = query(
      collection(this.firestore, 'courses'),
      where('livreur.uid', '==', user.uid)
    );


    onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
  snapshot.docChanges().forEach(async (change: DocumentChange<DocumentData>) => {
    if (change.type === 'added') {
      const commande = change.doc.data() as Commande;
      const commandeId = change.doc.id;
      await this.promptCommande(commande, commandeId);
    }
  });
});
  }

  // ✅ Afficher un IonAlert pour accepter la commande
  private async promptCommande(commande: Commande, commandeId: string) {
  const alert = await this.alertController.create({
    header: 'Nouvelle commande',
    message: `
      <strong>Départ:</strong> ${commande.depart}<br>
      <strong>Destination:</strong> ${commande.destination}<br>
      <strong>Prix:</strong> ${commande.prix} FCFA<br><br>
      Voulez-vous accepter cette commande ?
    `,
    buttons: [
      {
        text: 'Refuser',
        role: 'cancel'
      },
      {
        text: 'Accepter',
        handler: async () => {
          const user = this.auth.currentUser;
          if (!user) return;

          const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
          const snap = await getDoc(commandeRef);

          if (!snap.exists() || snap.data()['statut'] !== 'en attente') {

            const info = await this.alertController.create({
              header: 'Commande déjà prise',
              message: `Désolé, cette commande a déjà été acceptée par un autre chauffeur.`,
              buttons: ['OK']
            });
            await info.present();
            return;
          }

          const prenom = user.displayName || 'Chauffeur';
          const photoURL = user.photoURL || '';

          await updateDoc(commandeRef, {
            statut: 'prise en charge',
            chauffeur: {
              uid: user.uid,
              prenom: prenom,
              photoURL: photoURL
            }
          });
        }
      } 
    ]
  });

  await alert.present();
}

}
