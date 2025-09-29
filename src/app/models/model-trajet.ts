export interface Trajet {
  uid: string;
  depart: string;
  destination: string;
  distance: number;
  duree: number;
  prix?: number;
  createdAt: Date;
  statut?: 'en attente' | 'acceptée' | 'en cours' | 'livrée' | 'annulée';
  motifAnnulation?: string;
  annulePar?: 'client' | 'livreur' }