import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged} from '@angular/fire/auth';


export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  
  // Attendre que Firebase Auth recharge la session
  const user = await new Promise((resolve) => {
    onAuthStateChanged(auth, resolve);
  });

  if (user) return true;

  router.navigate(['/login-user']);
  return false;
};