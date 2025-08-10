export interface Commande {
  uid: string;
  createdAt: any;
  depart: string;
  destination: string;
  distance: number;
  duree: number;
  prix: number;
  statut: 'en attente' | 'prise en charge' | 'terminée';
  chauffeur?: {
    uid: string;
    prenom: string;
    photoURL: string;
    telephone: string;
  };
}
