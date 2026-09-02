export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
}

export interface CartResponse {
  userId: string;
  items: CartLine[];
  subtotal: number;
  gst: number;
  total: number;
  updatedAt: string;
}

export interface OrderResponse {
  id: string;
  userId: string;
  items: Array<{ productId: string; name: string; unitPrice: number; quantity: number; lineTotal: number; }>;
  subtotal: number;
  gst: number;
  total: number;
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
  };
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
}
