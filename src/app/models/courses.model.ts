export interface Course {
  depart: string;
  destination: string;
  date: string;
  prix: number;
  status: 'en_attente' | 'acceptée' | 'refusée';
  livreur?: {
    uid: string;
    prenom: string;
    photoURL: string;
    telephone: string;
  };
}
