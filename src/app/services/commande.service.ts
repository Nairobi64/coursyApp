import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { CommandeUser } from '../models/commande.model';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class CommandeService {
    
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getCommandesByUser(): Observable<CommandeUser[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Utilisateur non connecté');

    const commandesRef = collection(this.firestore, 'commandes');
    const q = query(commandesRef, where('uid', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<CommandeUser[]>;
  }
}
