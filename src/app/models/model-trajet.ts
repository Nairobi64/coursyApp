export interface Trajet {
  uid: string;
  Depart: string;
  Destination: string;
  Distance: Number;
  Duree: Number;
  Prix?: Number;
  createdAt: Date;
}