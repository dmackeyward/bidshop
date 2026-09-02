export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Fresh Produce' | 'Meat & Poultry' | 'Dairy' | 'Seafood' | 'Pantry' | 'Frozen' | 'Beverages' | 'Bakery';
  price: number; // price per unit in NZD
  unit: string; // e.g. 'kg', '500g', 'each', '6-pack'
  stock: number;
  imageUrl: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface Order {
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

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
