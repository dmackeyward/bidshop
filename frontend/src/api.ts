import { AuthUser, CartResponse, OrderResponse, Product } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

type Json = Record<string, unknown> | unknown[];

function getToken(): string | null {
  return localStorage.getItem('bidshop.token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Json) : null;
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  // Auth
  register(payload: { email: string; password: string; name: string }) {
    return request<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  me() {
    return request<AuthUser>('/auth/me');
  },

  // Products
  listProducts(params: { search?: string; category?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    const query = qs.toString();
    return request<{ count: number; items: Product[] }>(`/products${query ? `?${query}` : ''}`);
  },
  listCategories() {
    return request<{ categories: string[] }>('/products/categories');
  },

  // Cart
  getCart() {
    return request<CartResponse>('/cart');
  },
  addToCart(productId: string, quantity: number = 1) {
    return request<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },
  updateCartItem(productId: string, quantity: number) {
    return request<CartResponse>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem(productId: string) {
    return request<CartResponse>(`/cart/items/${productId}`, { method: 'DELETE' });
  },
  clearCart() {
    return request<CartResponse>('/cart', { method: 'DELETE' });
  },

  // Orders
  placeOrder(customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
  }) {
    return request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify({ customer }),
    });
  },
  listOrders() {
    return request<{ count: number; items: OrderResponse[] }>('/orders');
  },
};
