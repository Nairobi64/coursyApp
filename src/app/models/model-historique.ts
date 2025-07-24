export interface Historique {
  id: string;
  type: 'commande' | 'course' | 'livraison';
  entiteId: string; // utilisateur, chauffeur, livreur, restaurant
  date: Date;
  details: any;
}