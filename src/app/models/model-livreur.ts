export interface Livreur {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photoURL?: string;
  role: 'courier';
  statut: 'disponible' | 'occupé';
  historiqueLivraisons?: string[]; // IDs des livraisons
  createdAt: Date;
}

