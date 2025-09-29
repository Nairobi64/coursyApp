import { Injectable } from '@angular/core';
import {Auth,GoogleAuthProvider, signInWithPopup,createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile,signOut,UserCredential} from '@angular/fire/auth';
import {Firestore, doc, setDoc, getDoc,docData} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  // =========================
  // INSCRIPTION UTILISATEUR
  // =========================
  async registerUser(email: string, password: string, prenom: string, role: string, photoUrl?: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const userRef = doc(this.firestore, `users/${cred.user.uid}`);

    await setDoc(userRef, {
      uid: cred.user.uid,
      email,
      prenom,
      role: role.trim().toLowerCase(),
      photoUrl: photoUrl || null,
      createdAt: new Date()
    });

    return cred;
  }

  // =========================
  // CONNEXION UTILISATEUR
  // =========================
  async loginUser(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const userRef = doc(this.firestore, `users/${cred.user.uid}`);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      const role = (data.role || 'users').trim().toLowerCase();

      localStorage.setItem('currentUser', JSON.stringify(data));
      this.redirectAfterLogin(role);
    } else {
      console.warn('Utilisateur non trouvé dans Firestore');
    }

    return cred;
  }

  // =========================
  // INSCRIPTION CHAUFFEUR / LIVREUR
  // =========================

  async register(email: string, password: string, userData: any): Promise<UserCredential> {
    const credentials = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = credentials.user.uid;

    await updateProfile(credentials.user, { displayName: userData.prenom });

    const role = (userData.role || '').trim().toLowerCase();
    if (role !== 'drivers' && role !== 'livreurs') {
      throw new Error('Rôle invalide');
    }

    const collectionName = role === 'drivers' ? 'drivers' : 'livreurs';

    await setDoc(doc(this.firestore, `${collectionName}/${uid}`), {
      uid,
      email,
      role,
      disponible: false,
      ...userData,
      createdAt: new Date()
    }, { merge: true });

    localStorage.setItem('currentUser', JSON.stringify({
      uid,
      email,
      role,
      prenom: userData.prenom,
      nom: userData.nom
    }));

    this.redirectAfterLogin(role);
    return credentials;
  }

  // =========================
  // CONNEXION CHAUFFEUR / LIVREUR
  // =========================
  async login(email: string, password: string): Promise<UserCredential> {
    const credentials = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = credentials.user.uid;

    // Recherche dans les deux collections
    const driverRef = doc(this.firestore, `drivers/${uid}`);
    const livreurRef = doc(this.firestore, `livreurs/${uid}`);

    let snap = await getDoc(driverRef);
    let role = 'drivers';

    if (!snap.exists()) {
      snap = await getDoc(livreurRef);
      role = 'livreurs';
    }

    if (snap.exists()) {
      const data = snap.data() as any;
      localStorage.setItem('currentUser', JSON.stringify(data));
      this.redirectAfterLogin(role);
    } else {
      console.warn('Profile non trouvé dans Firestore');
    }

    return credentials;
  }

  // =========================
  // PROFIL UTILISATEUR
  // =========================
  getCurrentUser() {
    const data = localStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
  }

  getUserProfile(uid: string, collectionName: 'drivers' | 'livreurs'): Observable<any> {
    return docData(doc(this.firestore, `${collectionName}/${uid}`));
  }

  async getUserProfileOnce(uid: string, collectionName: 'drivers' | 'livreurs'): Promise<any> {
    return firstValueFrom(this.getUserProfile(uid, collectionName));
  }

  // =========================
  // REDIRECTION SELON RÔLE
  // =========================
  redirectAfterLogin(role: string) {
  role = (role || '').trim().toLowerCase();

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  switch (role) {
    case 'drivers':
      this.router.navigate(['/drivers/profile']);
      break;
    case 'livreurs':
      this.router.navigate(['/livreurs/profile']);
      break;
    case 'users':
      this.router.navigate(['/user/commande']);
      break;
    case 'admin':
      this.router.navigate(['/admin/dashboard']);
      break;
    default:
      this.router.navigate(['/indisponible']);
  }
  console.log('Redirection avec rôle :', role);
}


  // =========================
  // DÉCONNEXION
  // =========================
  async logout() {
    await signOut(this.auth);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }


  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      // L’utilisateur connecté
      console.log(result.user);
      return result.user;
    } catch (error) {
      console.error('Erreur login Google', error);
      throw error;
    }
  }
}
