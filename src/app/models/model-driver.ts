export interface drivers {
  uid: string;
  nom: string;
  prenom: string;
  ville: string;
  photoUrl: string;
  role: 'chauffeur' | 'livreur';
  matricule: string;
  marque: string;
  couleur: string;
  disponible: boolean;
}