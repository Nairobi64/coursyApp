import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export const roleGuard = (expectedRole: string): CanActivateFn => {
  return async () => {
    const auth = inject(Auth);
    const db = inject(Firestore);
    const router = inject(Router);

    const user = auth.currentUser;
    if (!user) {
      router.navigate(['/connexion-user']);
      return false;
    }

    const collection = expectedRole === 'driver' ? 'drivers' : expectedRole === 'admin' ? 'admins' : 'users';
    const userDocRef = doc(db, `${collection}/${user.uid}`);
    const snap = await getDoc(userDocRef);

    const data = snap.data();
    if (snap.exists() && data && data['role'] === expectedRole) {
      return true;
    }

    router.navigate(['/indisponible ']);
    return false;
  };
};
