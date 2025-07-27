interface Course {
  depart: string;
  destination: string;
  status: 'en_attente' |'acceptée' | 'refusée';
  date: string;
  prix: number;
  chauffeurId?: string;
}