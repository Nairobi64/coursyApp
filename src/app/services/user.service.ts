// user.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Database, ref, onValue } from '@angular/fire/database';
import { Observable, combineLatest, map } from 'rxjs';
import { Utilisateur } from '../models/model-user';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private firestore: Firestore, private db: Database) {}

  // Firestore → liste des utilisateurs inscrits
  getUtilisateurs(): Observable<Utilisateur[]> {
    const utilisateursRef = collection(this.firestore, 'utilisateurs');
    return collectionData(utilisateursRef, { idField: 'id' }) as Observable<Utilisateur[]>;
  }

  // RTDB → statuts des utilisateurs
  getStatuses(): Observable<Record<string, any>> {
    const statusRef = ref(this.db, 'status');
    return new Observable<Record<string, any>>(subscriber => {
      const unsub = onValue(statusRef, snap => {
        subscriber.next(snap.val() || {});
      }, err => subscriber.error(err));

      return () => unsub();
    });
  }

  // Fusion → utilisateurs enrichis avec leur statut
  getUtilisateursAvecStatut(): Observable<Utilisateur[]> {
    return combineLatest([this.getUtilisateurs(), this.getStatuses()]).pipe(
      map(([utilisateurs, statuses]) => {
        return utilisateurs.map(u => ({
          ...u,
          online: statuses?.[u.uid]?.state === 'online'
        }));
      })
    );
  }

  // Nombre de connectés
  getUtilisateursConnectes(): Observable<number> {
    return this.getUtilisateursAvecStatut().pipe(
      map(utilisateurs => utilisateurs.filter(u => u.online).length)
    );
  }
}
