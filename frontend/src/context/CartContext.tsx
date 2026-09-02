import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { CartResponse } from '../types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const EMPTY_CART: CartResponse = {
  userId: '',
  items: [],
  subtotal: 0,
  gst: 0,
  total: 0,
  updatedAt: new Date().toISOString(),
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const c = await api.getCart();
      setCart(c);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else setCart(null);
  }, [user, refresh]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const c = await api.addToCart(productId, quantity);
    setCart(c);
  }, []);

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    const c = await api.updateCartItem(productId, quantity);
    setCart(c);
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const c = await api.removeCartItem(productId);
    setCart(c);
  }, []);

  const clear = useCallback(async () => {
    const c = await api.clearCart();
    setCart(c);
  }, []);

  const effectiveCart = cart ?? (user ? null : EMPTY_CART);
  const itemCount = effectiveCart ? effectiveCart.items.reduce((n, i) => n + i.quantity, 0) : 0;

  return (
    <CartContext.Provider
      value={{ cart: effectiveCart, loading, refresh, addItem, updateItem, removeItem, clear, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
