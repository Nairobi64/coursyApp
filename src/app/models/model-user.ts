export interface Utilisateur {
  uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  photoURL?: string;
  role: 'user';
  historiqueCommandes?: string[]; // IDs des commandes
  createdAt: Date;
  online?: boolean;
}