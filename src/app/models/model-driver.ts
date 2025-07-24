export interface Chauffeur {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photoURL?: string;
  role: 'driver';
  vehicule: string;
  statut: 'disponible' | 'occupé';
  historiqueCourses?: string[]; // IDs des courses
  createdAt: Date;
}