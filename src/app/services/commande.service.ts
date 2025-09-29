import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  QuerySnapshot,
  DocumentData,
  DocumentChange,
  onSnapshot,
  query,
  where
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Commande } from '../models/commande.model';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private alertController = inject(AlertController);

  private currentUser: User | null = null;
  private activeCommandeId$ = new BehaviorSubject<string | null>(null);

  constructor(private router: Router) {
    // 🔄 Écoute le rôle du chauffeur connecté
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      if (!user) return;

      const driverRef = doc(this.firestore, 'drivers', user.uid);
      const snapshot = await getDoc(driverRef);
      if (!snapshot.exists()) return;

      const role = snapshot.data()['role'];
      if (role === 'chauffeur') {
        this.listenToTaxiCommandes(); // seul le chauffeur reçoit les popups
      }
    });

    const savedId = localStorage.getItem('activeCommandeId');
    if (savedId) this.setActiveCommande(savedId);
  }

  // 🔑 Commande active
  getActiveCommandeId() {
    return this.activeCommandeId$.asObservable();
  }

  async setActiveCommande(commandeId: string) {
    this.activeCommandeId$.next(commandeId);
    localStorage.setItem('activeCommandeId', commandeId);
  }

  clearCommande() {
    this.activeCommandeId$.next(null);
    localStorage.removeItem('activeCommandeId');
  }

  async isCommandeActive(commandeId: string): Promise<boolean> {
    const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
    const snap = await getDoc(commandeRef);
    if (!snap.exists()) return false;
    const data = snap.data() as any;
    return ['en attente', 'prise en charge'].includes(data.statut);
  }

  getCommandesByUser() {
    if (!this.currentUser) throw new Error('Utilisateur non connecté');
    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(commandesRef, where('chauffeurId', '==', this.currentUser.uid));
    return q;
  }

  // ❌ Annuler une commande
  async annulerCommande(commandeId: string) {
    if (!this.currentUser) return;

    const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
    const prenom = this.currentUser.displayName || 'Chauffeur';
    const photoURL = this.currentUser.photoURL || '';

    await updateDoc(commandeRef, {
      statut: 'annulée',
      annuléePar: { uid: this.currentUser.uid, prenom, photoURL }
    });

    this.clearCommande();
    this.router.navigate(['/driver/home']);
  }

  // 👂 Écoute des commandes Taxi
  private listenToTaxiCommandes() {
    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(commandesRef, where('statut', '==', 'en attente'), where('service', '==', 'taxi'));

    let notifiedIds: string[] = [];

    onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(async change => {
        const docId = change.doc.id;
        if (change.type === 'added' && !notifiedIds.includes(docId)) {
          const commande = change.doc.data() as Commande;
          await this.promptCommande(commande, docId);
          notifiedIds.push(docId);
        }
      });
    });
  }

  private async promptCommande(commande: Commande, commandeId: string) {
    const alert = await this.alertController.create({
      header: 'Nouvelle commande Taxi',
      message: `
        <strong>Départ:</strong> ${commande.depart}<br>
        <strong>Destination:</strong> ${commande.destination}<br>
        <strong>Prix:</strong> ${commande.prix} FCFA<br><br>
        Voulez-vous accepter cette commande ?
      `,
      buttons: [
        { text: 'Refuser', role: 'cancel' },
        {
          text: 'Accepter',
          handler: async () => {
            if (!this.currentUser) return;
            const commandeRef = doc(this.firestore, `commandes/${commandeId}`);
            const snap = await getDoc(commandeRef);

            if (!snap.exists() || snap.data()['statut'] !== 'en attente') {
              const info = await this.alertController.create({
                header: 'Commande déjà prise',
                message: `Désolé, cette commande a déjà été acceptée.`,
                buttons: ['OK']
              });
              await info.present();
              return;
            }

            const prenom = this.currentUser.displayName || 'Chauffeur';
            const photoURL = this.currentUser.photoURL || '';

            await updateDoc(commandeRef, {
              statut: 'prise en charge',
              chauffeurId: this.currentUser.uid,
              chauffeur: { uid: this.currentUser.uid, prenom, photoURL }
            });

            // ✅ Historique chauffeur
            const historiqueRef = doc(collection(this.firestore, `drivers/${this.currentUser.uid}/historique`));
            await setDoc(historiqueRef, {
              commandeId,
              depart: commande.depart,
              destination: commande.destination,
              prix: commande.prix,
              status: 'acceptée',
              date: new Date().toISOString()
            });

            this.setActiveCommande(commandeId);
          }
        }
      ]
    });

    await alert.present();
  }
}
