import { InscriptionPartenaireComponent } from './pagesConnexionInscription/inscription-partenaire/inscription-partenaire.component';
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';
import { roleGuard } from './guards/role.guards';

export const routes: Routes = [
 
  // Page d'accueil (sélection du service)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },


  // Authentification
  { path: 'connexion-partenaire', loadComponent: () => import('./pagesConnexionInscription/connecion-paternaire/connecion-paternaire.component').then(m => m.ConnecionPaternaireComponent) },
  { path: 'register-partenaire', loadComponent: () => import('./pagesConnexionInscription/inscription-partenaire/inscription-partenaire.component').then(m => m.InscriptionPartenaireComponent) },
  { path: 'login-user', loadComponent: () => import('./pagesUser/login-user/login-user.component').then(m => m.LoginUserComponent) },
  { path: 'register-user', loadComponent: () => import('./pagesUser/register-user/register-user.component').then(m => m.RegisterUserComponent) },


  

  // Espace utilisateur
  {
    path: 'user',
    
    loadComponent: () => import('./layout/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
    // canActivate: [authGuard, roleGuard('users')],
    children: [
      { path: '', redirectTo: 'commande', pathMatch: 'full' },
      { path: 'commande', loadComponent: () => import('./pagesUser/commande/commande.component').then(m => m.CommandeComponent) },
      { path: 'trajet', loadComponent: () => import('./pagesUser/carte-trajet/carte-trajet.component').then(m => m.CarteTrajetComponent) },
      { path: 'histoUser', loadComponent: () => import('./pagesUser/histo-user/histo-user.component').then(m => m.HistoUserComponent) },
      // { path: 'profil', loadComponent: () => import('./pagesUser/profil/profil.component').then(m => m.ProfilComponent) },
      {path: 'taxi',loadComponent:() => import ('./pagesUser/form-taxi/form-taxi.component').then(ma => ma.FormTaxiComponent)},
      {path: 'trajet-taxi',loadComponent:() => import ('./pagesUser/trajet-taxi/trajet-taxi.component').then(ma => ma.TrajetTaxiComponent)},
      {path: 'paiement',loadComponent:() => import ('./pagesUser/paiement/paiement.component').then(ma => ma.PaiementComponent)},


    ],
    
  },

  // Espace chauffeur
  {
    path: 'driver',
    // canActivate: [authGuard, roleGuard('drivers')],
    loadComponent: () => import('./layout/driver-menu/driver-menu.component').then(m => m.DriverMenuComponent),
    children: [
      { path: '', redirectTo: 'courses', pathMatch: 'full' },
      { path: 'courses', loadComponent: () => import('./pagesDriver/courses/courses.component').then(m => m.CoursesComponent) },
      { path: 'historique', loadComponent: () => import('./pagesDriver/historique/historique.component').then(m => m.HistoriqueComponent) },
      { path: 'profile', loadComponent: () => import('./pagesDriver/driver-profil/driver-profil.component').then(m => m.DriverProfilComponent) },
      { path: 'modif-driver', loadComponent: () => import('./pagesDriver/modif-infos-driver/modif-infos-driver.component').then(m => m.ModifInfosDriverComponent) },
      { path: 'courses-disponibles', loadComponent: () => import('./pagesDriver/liste-courses/liste-courses.component').then(m => m.ListeCoursesComponent) },

    ]
  },

  // Espace livreur
  {
    path: 'livreur',
    // canActivate: [authGuard, roleGuard('livreur')],
    // loadComponent: () => import('./layouts/courier-layout/courier-layout.component').then(m => m.CourierLayoutComponent),
    children: [
      { path: '', redirectTo: 'livraisons', pathMatch: 'full' },
      // { path: 'livraisons', loadComponent: () => import('./pagesCourier/livraisons/livraisons.component').then(m => m.LivraisonsComponent) },
      // { path: 'historique', loadComponent: () => import('./pagesCourier/historique/historique.component').then(m => m.HistoriqueComponent) },
      { path: 'profile', loadComponent: () => import('./pagesLivreur/profile-livreur/profile-livreur.component').then(m => m.ProfileLivreurComponent) },
      
    ]
  },


  // Page d’erreur ou indisponible
  { path: 'indisponible', loadComponent: () => import('./pagesDriver/indisponible/indisponible.component').then(m => m.IndisponibleComponent) }

];
