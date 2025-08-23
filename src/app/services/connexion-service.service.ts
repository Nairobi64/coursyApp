import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Database, ref, set, onDisconnect, serverTimestamp } from '@angular/fire/database';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

type UserRole = 'admin' | 'utilisateur' | 'chauffeur' | 'livreur';

@Injectable({
  providedIn: 'root'
})
export class ConnexionServiceService {

constructor(
    private auth: Auth,
    private db: Database,
    private firestore: Firestore,
  ) {
    this.init();
  }

  private async resolveRole(uid: string): Promise<UserRole> {
    // On teste les collections dans l’ordre : admins, drivers, livreurs, users
    const tryDoc = async (path: string, role: UserRole) => {
      const snap = await getDoc(doc(this.firestore, path));
      return snap.exists() ? role : null;
    };

    return (await tryDoc(`admins/${uid}`, 'admin')) ??
           (await tryDoc(`drivers/${uid}`, 'chauffeur')) ??
           (await tryDoc(`livreurs/${uid}`, 'livreur')) ??
           (await tryDoc(`users/${uid}`, 'utilisateur')) ??
           'utilisateur';
  }

  private init() {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) return;

      const role = await this.resolveRole(user.uid);
      const userStatusRef = ref(this.db, `status/${user.uid}`);

      // En ligne
      await set(userStatusRef, {
        state: 'online',
        last_changed: serverTimestamp(),
        role,
        email: user.email ?? null,
        displayName: user.displayName ?? null
      });

      // Déconnexion / fermeture app
      onDisconnect(userStatusRef).set({
        state: 'offline',
        last_changed: serverTimestamp(),
        role
      });
    });
  }

  async setUserOnlineStatus(uid: string, status: boolean) {
  const userRef = doc(this.firestore, 'utilisateurs', uid);
  await updateDoc(userRef, { isOnline: status });
}

}
