import { Cart, Order, Product, User } from '../types';
import { products as seedProducts } from './seed';

/**
 * Simple in-memory data store. Everything lives in RAM and is lost when the
 * process exits – that is exactly what we want for this sample API.
 */
class Store {
  products: Product[] = JSON.parse(JSON.stringify(seedProducts));
  users: User[] = [];
  carts: Cart[] = [];
  orders: Order[] = [];

  findProduct(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getCart(userId: string): Cart {
    let cart = this.carts.find((c) => c.userId === userId);
    if (!cart) {
      cart = { userId, items: [], updatedAt: new Date().toISOString() };
      this.carts.push(cart);
    }
    return cart;
  }

  saveCart(cart: Cart): Cart {
    cart.updatedAt = new Date().toISOString();
    return cart;
  }
}

export const store = new Store();
