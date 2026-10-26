export type Product = {
  version?: number;
  id: string;
  name: string;
  priceCents: number;
  unit: 'kg' | 'un';
  stock: number;
  photoUrl: string;
  available: boolean;
};
export type Stall = {
  id: string;
  name: string;
  description: string;
  published: boolean;
  whatsapp?: string;
};
