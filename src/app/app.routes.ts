import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guards';
import { roleGuard } from './guards/role.guards';
import { HomePage } from './home/home.page';

export const routes: Routes = [
 
  // Page d'accueil (sélection du service)
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },


  // Authentification
  { path: 'login-user', loadComponent: () => import('./pagesUser/login-user/login-user.component').then(m => m.LoginUserComponent) },
  { path: 'register-user', loadComponent: () => import('./pagesUser/register-user/register-user.component').then(m => m.RegisterUserComponent) },
  { path: 'login-driver', loadComponent: () => import('./pagesDriver/login-driver/login-driver.component').then(m => m.LoginDriverComponent) },
  { path: 'register-driver', loadComponent: () => import('./pagesDriver/register-driver/register-driver.component').then(m => m.RegisterDriverComponent) },
  // { path: 'login-courier', loadComponent: () => import('./pages/login-courier/login-courier.component').then(m => m.LoginCourierComponent) },
  // { path: 'register-courier', loadComponent: () => import('./pages/register-courier/register-courier.component').then(m => m.RegisterCourierComponent) },
  // { path: 'login-restaurant', loadComponent: () => import('./pages/login-restaurant/login-restaurant.component').then(m => m.LoginRestaurantComponent) },
  // { path: 'register-restaurant', loadComponent: () => import('./pages/register-restaurant/register-restaurant.component').then(m => m.RegisterRestaurantComponent) },

  

  // Espace utilisateur
  {
    path: 'user',
    
    loadComponent: () => import('./layout/user-layout/user-layout.component').then(m => m.UserLayoutComponent),
    canActivate: [authGuard, roleGuard('user')],
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
  // {
  //   path: 'driver',
  //   canActivate: [authGuard, roleGuard('driver')],
  //   loadComponent: () => import('./layout/').then(m => m.DriverLayoutComponent),
  //   children: [
  //     { path: '', redirectTo: 'courses', pathMatch: 'full' },
  //     { path: 'courses', loadComponent: () => import('./pagesDriver/courses/courses.component').then(m => m.CoursesComponent) },
  //     { path: 'historique', loadComponent: () => import('./pagesDriver/historique/historique.component').then(m => m.HistoriqueComponent) },
  //     { path: 'profil', loadComponent: () => import('./pagesDriver/profil/profil.component').then(m => m.ProfilComponent) },
      
  //   ]
  // },

  // Espace livreur
  // {
  //   path: 'courier',
  //   canActivate: [authGuard, roleGuard('courier')],
  //   loadComponent: () => import('./layouts/courier-layout/courier-layout.component').then(m => m.CourierLayoutComponent),
  //   children: [
  //     { path: '', redirectTo: 'livraisons', pathMatch: 'full' },
  //     { path: 'livraisons', loadComponent: () => import('./pagesCourier/livraisons/livraisons.component').then(m => m.LivraisonsComponent) },
  //     { path: 'historique', loadComponent: () => import('./pagesCourier/historique/historique.component').then(m => m.HistoriqueComponent) },
  //     { path: 'profil', loadComponent: () => import('./pagesCourier/profil/profil.component').then(m => m.ProfilComponent) },
      
  //   ]
  // },


  // Espace restaurant
  // {
  //   path: 'restaurant',
  //   canActivate: [authGuard, roleGuard('restaurant')],
  //   loadComponent: () => import('./layouts/restaurant-layout/restaurant-layout.component').then(m => m.RestaurantLayoutComponent),
  //   children: [
  //     { path: '', redirectTo: 'menu', pathMatch: 'full' },
  //     { path: 'menu', loadComponent: () => import('./pagesRestaurant/menu/menu.component').then(m => m.MenuComponent) },
  //     { path: 'commandes', loadComponent: () => import('./pagesRestaurant/commandes/commandes.component').then(m => m.CommandesComponent) },
  //     { path: 'historique', loadComponent: () => import('./pagesRestaurant/historique/historique.component').then(m => m.HistoriqueComponent) },
  //     { path: 'profil', loadComponent: () => import('./pagesRestaurant/profil/profil.component').then(m => m.ProfilComponent) },
      
  //   ]
  // },

  // Page d’erreur ou indisponible
  { path: 'indisponible', loadComponent: () => import('./pagesDriver/indisponible/indisponible.component').then(m => m.IndisponibleComponent) }

];
