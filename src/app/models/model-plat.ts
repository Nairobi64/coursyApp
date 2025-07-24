export interface Plat {
  id: string;
  nom: string;
  description: string;
  prix: number;
  photoURL?: string;
  restaurantId: string;
  disponible: boolean;
}