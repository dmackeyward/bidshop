import { Router } from 'express';
import { store } from '../data/store';
import { requireAuth } from '../middleware/auth';
import { Cart } from '../types';

const router = Router();

router.use(requireAuth);

function serialiseCart(cart: Cart) {
  const items = cart.items.map((item) => {
    const product = store.findProduct(item.productId);
    const unitPrice = product ? product.price : 0;
    return {
      productId: item.productId,
      quantity: item.quantity,
      name: product?.name ?? 'Unknown product',
      unit: product?.unit ?? '',
      unitPrice,
      lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
      imageUrl: product?.imageUrl,
    };
  });
  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  const gst = Number((subtotal * 0.125).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));
  return {
    userId: cart.userId,
    items,
    subtotal,
    gst,
    total,
    updatedAt: cart.updatedAt,
  };
}

router.get('/', (req, res) => {
  const cart = store.getCart(req.user!.sub);
  return res.json(serialiseCart(cart));
});

router.post('/items', (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId is required' });
  }
  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }
  const product = store.findProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (qty > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} unit(s) available` });
  }

  const cart = store.getCart(req.user!.sub);
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    const newQty = existing.quantity + qty;
    if (newQty > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} unit(s) available` });
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }
  store.saveCart(cart);
  return res.status(201).json(serialiseCart(cart));
});

router.patch('/items/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body || {};
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }
  const product = store.findProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (qty > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} unit(s) available` });
  }
  const cart = store.getCart(req.user!.sub);
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  item.quantity = qty;
  store.saveCart(cart);
  return res.json(serialiseCart(cart));
});

router.delete('/items/:productId', (req, res) => {
  const cart = store.getCart(req.user!.sub);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
  if (cart.items.length === before) {
    return res.status(404).json({ error: 'Item not in cart' });
  }
  store.saveCart(cart);
  return res.json(serialiseCart(cart));
});

router.delete('/', (req, res) => {
  const cart = store.getCart(req.user!.sub);
  cart.items = [];
  store.saveCart(cart);
  return res.json(serialiseCart(cart));
});

export default router;
