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
      router.navigate(['/login-user']);
      return false;
    }

    // 🔥 Déterminer la bonne collection selon le rôle
    let collection = 'users';
    if (expectedRole === 'drivers') {
      collection = 'drivers';
    } else if (expectedRole === 'admins') {
      collection = 'admins';
    } else if (expectedRole === 'livreurs') {
      collection = 'livreurs';
    }

    const userDocRef = doc(db, `${collection}/${user.uid}`);
    const snap = await getDoc(userDocRef);

    const data = snap.data();
    if (snap.exists() && data && data['role'] === expectedRole) {
      return true;
    }

    // 🚨 Corrigé : enlever l’espace à la fin
    router.navigate(['/indisponible']);
    return false;
  };
};
