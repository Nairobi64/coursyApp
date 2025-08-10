// user.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);

  async getUserRole(uid: string): Promise<string | null> {
    const docRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data()['role'];
    }
    return null;
  }
}
