export interface Colis {
  id?: string;              // généré par Firestore
  trackingNumber: string;   // numéro de suivi
  clientId: string;         // uid du client
  livreurId?: string;       // uid du livreur
  statut: 'en_attente' | 'receptionne' | 'entrepot' | 'en_livraison' | 'livre';
  adresseDestinataire: string;
  createdAt: any;           // Firestore Timestamp
  updatedAt: any;
}
