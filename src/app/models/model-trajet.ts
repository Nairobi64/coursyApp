export interface Trajet {
  uid: string;
  depart: string;
  destination: string;
  distance: number;
  duree: number;
  prix?: number;
  createdAt: Date;
}