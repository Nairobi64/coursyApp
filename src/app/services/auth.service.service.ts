import { Injectable } from '@angular/core';import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut ,onAuthStateChanged} from '@angular/fire/auth';
import { doc, Firestore, setDoc , getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

   constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
  ) {}


    listenUserProfile() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const uid = user.uid;
        let userDoc = doc(this.firestore, `users/${uid}`);
        let snap = await getDoc(userDoc);

        if (!snap.exists()) {
          userDoc = doc(this.firestore, `drivers/${uid}`);
          snap = await getDoc(userDoc);
        }

        if (snap.exists()) {
          const userData = snap.data() as any;
          localStorage.setItem('currentUser', JSON.stringify({
            uid,
            role: userData.role,
            prenom: userData.prenom,
            nom: userData.nom,
            email: userData.email
          }));
        }
      } else {
        localStorage.removeItem('currentUser');
      }
    });
  }
  


  async register(email: string, password: string, userData: any): Promise<void> {
  try {
    const credentials = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = credentials.user.uid;

      const role = userData.role || 'user';
      const collection = role === 'driver' ? 'drivers' : 'users';

    await setDoc(doc(this.firestore, collection, uid), {
        uid,
        email,
        ...userData,
        createdAt: new Date()
      });

      // 🔁 Redirection selon le rôle (optionnel ici)
      if (role === 'driver') {
        this.router.navigate(['/profile-partenaire']);
      } else {
        this.router.navigate(['/user/commande']);
      }

    } catch (error: any) {
      console.error('Erreur lors de l’enregistrement :', error);
      throw error;
    }
  }

redirectAfterLogin(role: string): void {
  if (role === 'user') {
    this.router.navigate(['/user/commande']);
  } else if (role === 'driver') {
    this.router.navigate(['/profile-partenaire']);
  } else {
    this.router.navigate(['/indisponible']);
  }
}




getCurrentUser() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}


getCurrentUserData() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

logout() {
  signOut(this.auth).then(() => {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login-user']);
  });
}



  async login(email: string, password: string) {
  try {
    const credentials = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = credentials.user.uid;

    // 🔍 Cherche dans 'users' puis dans 'drivers'
    let userDoc = doc(this.firestore, `users/${uid}`);
    let snap = await getDoc(userDoc);

    if (!snap.exists()) {
      userDoc = doc(this.firestore, `drivers/${uid}`);
      snap = await getDoc(userDoc);
    }

    if (!snap.exists()) {
      throw new Error("Aucun profil trouvé dans Firestore.");
    }

    const userData = snap.data() as any;

    // 🧠 Stocker l'utilisateur dans le localStorage
    localStorage.setItem('currentUser', JSON.stringify({
      uid,
      role: userData.role,
      prenom: userData.prenom,
      nom: userData.nom,
      email: userData.email
    }));

    // ✅ Redirection par rôle
    switch (userData.role) {
      case 'user':
        this.router.navigate(['/user/home']);
        break;
      case 'driver':
        this.router.navigate(['/driver-profil']);
        break;
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      default:
        throw new Error("Rôle non reconnu");
    }

  } catch (error: any) {
    console.error("Erreur de connexion :", error);
    throw error;
  }
}


}
