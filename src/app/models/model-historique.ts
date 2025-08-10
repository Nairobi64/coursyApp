interface Historique {
  depart: string;
  destination: string;
  statut: 'en attente' | 'acceptée' | 'refusée' | 'prise en charge' | 'terminée';
  date: string;
  prix: number;
}