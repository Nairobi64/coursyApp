import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ColisServiceService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  // Génère un trackingNumber de 14 caractères commençant par SN
  private generateTrackingNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'SN' + code;
  }

  // 🔸 Client crée un colis
  async creerColis(data: any) {
    const colisRef = collection(this.firestore, 'colis');
    const trackingNumber = this.generateTrackingNumber();
    
    return await addDoc(colisRef, {
      ...data,
      trackingNumber,
      client: { uid: this.auth.currentUser?.uid },
      statut: 'en_attente',
      createdAt: new Date(),
      historique: [
        {
          statut: 'en_attente',
          date: new Date(),
          updatedBy: this.auth.currentUser?.uid
        }
      ]
    });
  }

  // 🔸 Mise à jour du statut par livreur ou admin
  async updateStatut(colisId: string, newStatut: string) {
    const uid = this.auth.currentUser?.uid;
    const colisRef = doc(this.firestore, 'colis', colisId);

    // On ajoute le nouvel historique en conservant l'ancien
    await updateDoc(colisRef, {
      statut: newStatut,
      historique: [
        {
          statut: newStatut,
          date: new Date(),
          updatedBy: uid
        }
      ]
    });
  }
}
