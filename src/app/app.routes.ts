import { InscriptionPartenaireComponent } from './pagesConnexionInscription/inscription-partenaire/inscription-partenaire.component';
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';
import { roleGuard } from './guards/role.guards';

export const routes: Routes = [
 
  // Page d'accueil (sélection du service)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },


  // Authentification
  { path: 'login-driver', loadComponent: () => import('./pagesConnexionInscription/connecion-paternaire/connecion-paternaire.component').then(m => m.ConnecionPaternaireComponent) },
  { path: 'register-driver', loadComponent: () => import('./pagesConnexionInscription/inscription-partenaire/inscription-partenaire.component').then(m => m.InscriptionPartenaireComponent) },
  { path: 'login-user', loadComponent: () => import('./pagesUser/login-user/login-user.component').then(m => m.LoginUserComponent) },
  { path: 'register-user', loadComponent: () => import('./pagesUser/register-user/register-user.component').then(m => m.RegisterUserComponent) },
  { path: 'register-admin', loadComponent: () => import('./pagesAdmin/register-admin/register-admin.component').then(m => m.RegisterAdminComponent) },
  { path: 'login-admin', loadComponent: () => import('./pagesAdmin/login-admin/login-admin.component').then(m => m.LoginAdminComponent) },


  

  // Espace utilisateur
  {
    path: 'user',
    
    loadComponent: () => import('./layout/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
    canActivate: [authGuard, roleGuard('users')],
    children: [
      { path: '', redirectTo: 'commande', pathMatch: 'full' },
      { path: 'commande', loadComponent: () => import('./pagesUser/commande/commande.component').then(m => m.CommandeComponent) },
      { path: 'trajet', loadComponent: () => import('./pagesUser/carte-trajet/carte-trajet.component').then(m => m.CarteTrajetComponent) },
      { path: 'histoUser', loadComponent: () => import('./pagesUser/histo-user/histo-user.component').then(m => m.HistoUserComponent) },
      // { path: 'profil', loadComponent: () => import('./pagesUser/profil/profil.component').then(m => m.ProfilComponent) },
      {path: 'taxi',loadComponent:() => import ('./pagesUser/form-taxi/form-taxi.component').then(ma => ma.FormTaxiComponent)},
      {path: 'trajet-taxi',loadComponent:() => import ('./pagesUser/trajet-taxi/trajet-taxi.component').then(ma => ma.TrajetTaxiComponent)},
      {path: 'paiement',loadComponent:() => import ('./pagesUser/paiement/paiement.component').then(ma => ma.PaiementComponent)},
      {path: 'noscolis',loadComponent:() => import ('./noscolis/noscolis-forms/noscolis-forms.component').then(ma => ma.NoscolisFormsComponent)},
      {path: 'suivi',loadComponent:() => import ('./noscolis/suivi-colis/suivi-colis.component').then(ma => ma.SuiviColisComponent)},
      {path: 'commande-livraison',loadComponent:() => import ('./pagesUser/histo-user-livraison/histo-user-livraison.component').then(ma => ma.HistoUserLivraisonComponent)},


    ],
    
  },

  // Espace chauffeur
  {
    path: 'drivers',
    canActivate: [authGuard, roleGuard('drivers')],
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
    path: 'livreurs',
    canActivate: [authGuard, roleGuard('livreurs')],
    loadComponent: () => import('./layout/layout-livreur/layout-livreur.component').then(m => m.LayoutLivreurComponent),
    children: [
      { path: '', redirectTo: 'livraisons', pathMatch: 'full' },
      { path: 'historique', loadComponent: () => import('./pagesLivreur/historique-livreur/historique-livreur.component').then(m => m.HistoriqueLivreurComponent) },
      { path: 'profile', loadComponent: () => import('./pagesLivreur/profile-livreur/profile-livreur.component').then(m => m.ProfileLivreurComponent) },
      { path: 'modif-livreur', loadComponent: () => import('./pagesLivreur/modif-livreur/modif-livreur.component').then(m => m.ModifLivreurComponent) },

    ]
  },


  // pages admin

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./layout/layout-admin/layout-admin.component').then(m => m.LayoutAdminComponent),
    children: [
      { path: '', redirectTo: 'administration', pathMatch: 'full' },
      { path: 'utilisateurs', loadComponent: () => import('./pagesAdmin/utilisateurs-liste/utilisateurs-liste.component').then(m => m.UtilisateursListeComponent) },
      { path: 'chauffeurs', loadComponent: () => import('./pagesAdmin/chauffeurs-liste/chauffeurs-liste.component').then(m => m.ChauffeursListeComponent) },
      { path: 'dashboard', loadComponent: () => import('./pagesAdmin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'livreurs', loadComponent: () => import('./pagesAdmin/livreurs-liste/livreurs-liste.component').then(m => m.LivreursListeComponent) },

    ]
  },


  // Page d’erreur ou indisponible
  { path: 'indisponible', loadComponent: () => import('./indisponible/indisponible.component').then(m => m.IndisponibleComponent) }

];
