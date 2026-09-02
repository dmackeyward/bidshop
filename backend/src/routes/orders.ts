import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { store } from '../data/store';
import { requireAuth } from '../middleware/auth';
import { Order } from '../types';

const router = Router();

router.use(requireAuth);

const POSTCODE_REGEX = /^\d{4}$/;

router.post('/', (req, res) => {
  const { customer } = req.body || {};
  if (!customer || typeof customer !== 'object') {
    return res.status(400).json({ error: 'customer details are required' });
  }
  const { name, email, address, city, postcode } = customer;
  if (!name || !email || !address || !city || !postcode) {
    return res.status(400).json({ error: 'customer.name, email, address, city and postcode are all required' });
  }
  if (!POSTCODE_REGEX.test(String(postcode))) {
    return res.status(400).json({ error: 'postcode must be a 4-digit NZ postcode' });
  }

  const cart = store.getCart(req.user!.sub);
  if (cart.items.length === 0) {
    return res.status(400).json({ error: 'Cannot place an order with an empty cart' });
  }

  // Validate stock and build order items
  const orderItems: Order['items'] = [];
  for (const item of cart.items) {
    const product = store.findProduct(item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} no longer exists` });
    }
    if (item.quantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} unit(s) of ${product.name} available` });
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal: Number((product.price * item.quantity).toFixed(2)),
    });
  }

  // Deduct stock
  for (const item of orderItems) {
    const product = store.findProduct(item.productId)!;
    product.stock -= item.quantity;
  }

  const subtotal = Number(orderItems.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  const gst = Number((subtotal * 0.15).toFixed(2));
  const total = Number((subtotal + gst).toFixed(2));

  const order: Order = {
    id: uuid(),
    userId: req.user!.sub,
    items: orderItems,
    subtotal,
    gst,
    total,
    customer: { name, email, address, city, postcode: String(postcode) },
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };
  store.orders.push(order);

  // Clear the cart after a successful checkout
  cart.items = [];
  store.saveCart(cart);

  return res.status(201).json(order);
});

router.get('/', (req, res) => {
  const orders = store.orders.filter((o) => o.userId === req.user!.sub);
  return res.json({ count: orders.length, items: orders });
});

router.get('/:id', (req, res) => {
  const order = store.orders.find((o) => o.id === req.params.id && o.userId === req.user!.sub);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json(order);
});

export default router;
