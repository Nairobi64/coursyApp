import { Injectable } from '@angular/core';
import { Database, ref,set, onValue } from '@angular/fire/database';
import { map, Observable } from 'rxjs';
import { doc, getDoc, updateDoc, Firestore } from '@angular/fire/firestore';


interface PresenceRow {
  state: 'online' | 'offline';
  role: 'admin' | 'utilisateur' | 'chauffeur' | 'livreur';
  last_changed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatutDirectService {

constructor(private db: Database,
              private firestore: Firestore,
) {}

  // Retourne { users, drivers, couriers, totalOnline }
  counts$(): Observable<{ users: number; drivers: number; couriers: number; totalOnline: number }> {
    
    const statusRef = ref(this.db, 'status');
    return new Observable((subscriber) => {
      const unsub = onValue(statusRef, (snap) => {
        let users = 0, drivers = 0, couriers = 0;

        snap.forEach(child => {
          const val = child.val() as PresenceRow;
          if (val?.state === 'online') {
            if (val.role === 'utilisateur') users++;
            if (val.role === 'chauffeur')   drivers++;
            if (val.role === 'livreur')     couriers++;
          }
        });

        subscriber.next({
          users,
          drivers,
          couriers,
          totalOnline: users + drivers + couriers
        });
      }, (err) => subscriber.error(err));

      return () => unsub();
    });
  }

  async setUserOnlineStatus(uid: string, status: boolean) {
    const userRef = doc(this.firestore, 'utilisateurs', uid);
    await updateDoc(userRef, { isOnline: status });
  }

  async setPresence(uid: string, role: string, online: boolean) {
  const userStatusRef = ref(this.db, 'status/' + uid);
  await set(userStatusRef, {
    state: online ? 'online' : 'offline',
    role,
    last_changed: Date.now()
  });
}

  
}
