export interface Restaurant {
  uid: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  photoURL?: string;
  role: 'restaurant';
  menu: string[]; // IDs des plats
  historiqueCommandes?: string[]; // IDs des commandes
  createdAt: Date;
}