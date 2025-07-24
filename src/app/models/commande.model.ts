export interface CommandeUser {
  id: string; // identifiant de l’utilisateur connecté
  depart: string;
  destination: string;
  distance: number;
  duree: number;
  prix: number;
  createdAt: Date;
  statut: 'en attente' | 'en cours' | 'terminée' | 'annulée';
  service: 'taxi' | 'livraison' ;
  driver?: {
    nom: string;
    photoURL: string;
  };
}
