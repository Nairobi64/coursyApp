import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';
import { roleGuard } from './guards/role.guards';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { HomePage } from './home/home.page';

export const routes: Routes = [
 
  {
    path: '',
    redirectTo: 'connexion-user',
    pathMatch: 'full',
  },

  // 🔒 Routes protégées utilisateur avec layout
  {
    path: 'user',
    canActivate: [authGuard, roleGuard('user')],
    loadComponent: () =>
      import('./layout/user-layout/user-layout.component').then((m) => m.UserLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'historique',
        loadComponent: () => import('./pages/historique/historique.component').then((m) => m.HistoriqueComponent),
      },
      // D'autres pages user ici : abonnement, profil, etc.
    ],
  },

  // 📝 Pages publiques
  {
    path: 'inscription-user',
    loadComponent: () =>
      import('./pages/register-user/register-user.component').then((m) => m.RegisterUserComponent),
  },
  {
    path: 'connexion-user',
    loadComponent: () =>
      import('./pages/login-user/login-user.component').then((m) => m.LoginUserComponent),
  },
  {
    path: 'inscription-driver',
    loadComponent: () =>
      import('./pages/register-driver/register-driver.component').then((m) => m.RegisterDriverComponent),
  },
  {
    path: 'connexion-driver',
    loadComponent: () =>
      import('./pages/login-driver/login-driver.component').then((m) => m.LoginDriverComponent),
  },

  // 🚗 Espace driver
  {
    path: 'profile-partenaire',
    canActivate: [authGuard, roleGuard('driver')],
    loadComponent: () =>
      import('./pages/driver-profil/driver-profil.component').then((m) => m.DriverProfilComponent),
  },

  {
    path: 'indisponible',
    loadComponent: () =>
      import('./pages/indisponible/indisponible.component').then((m) => m.IndisponibleComponent),
  },
];
