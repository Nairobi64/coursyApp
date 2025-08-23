import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async canActivate() {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/admin-login']);
      return false;
    }

    const docRef = doc(this.firestore, 'admins', user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data()['role'] === 'admin') {
      return true;
    } else {
      this.router.navigate(['/admin-login']);
      return false;
    }
  }
}
