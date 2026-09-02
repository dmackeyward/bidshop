import { test, expect } from '@playwright/test';
import { registerUser } from '../helpers/api';

test.describe('Cart (authenticated)', () => {
  test('rejects unauthenticated requests', async ({ request }) => {
    expect((await request.get('/cart')).status()).toBe(401);
    expect(
      (await request.post('/cart/items', { data: { productId: 'p-001', quantity: 1 } })).status(),
    ).toBe(401);
  });

  test('adds an item and prices it correctly', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const headers = { Authorization: `Bearer ${user.token}` };

    const res = await request.post('/cart/items', {
      headers,
      data: { productId: 'p-001', quantity: 2 }, // $14.50 × 2
    });
    expect(res.status()).toBe(201);

    const cart = await res.json();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({
      productId: 'p-001',
      name: 'NZ Grass-Fed Beef Mince',
      unitPrice: 14.5,
      quantity: 2,
      lineTotal: 29.0,
    });
    expect(cart.subtotal).toBe(29.0);
    // internal consistency: subtotal + gst must equal total (whatever the GST rate)
    expect(cart.total).toBeCloseTo(cart.subtotal + cart.gst, 2);
  });

  test('rejects a quantity above available stock', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const res = await request.post('/cart/items', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { productId: 'p-003', quantity: 11 }, // Bluff oysters: stock 10
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'Only 10 unit(s) available' });
  });

  test('rejects invalid quantities', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const headers = { Authorization: `Bearer ${user.token}` };

    for (const quantity of [0, 1.5]) {
      const res = await request.post('/cart/items', {
        headers,
        data: { productId: 'p-001', quantity },
      });
      expect(res.status()).toBe(400);
      expect(await res.json()).toMatchObject({
        error: 'quantity must be a positive integer',
      });
    }
  });

  test('returns 404 when adding an unknown product', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const res = await request.post('/cart/items', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { productId: 'p-999', quantity: 1 },
    });
    expect(res.status()).toBe(404);
  });

  test('updates an item quantity with PATCH', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const headers = { Authorization: `Bearer ${user.token}` };

    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 1 } });
    const res = await request.patch('/cart/items/p-001', {
      headers,
      data: { quantity: 3 },
    });
    expect(res.status()).toBe(200);

    const cart = await res.json();
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.items[0].lineTotal).toBeCloseTo(43.5, 2); // 14.50 × 3
  });

  test('PATCH on an item not in the cart returns 404', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const res = await request.patch('/cart/items/p-008', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { quantity: 2 },
    });
    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'Item not in cart' });
  });

  test('removes an item, and a second delete returns 404', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const headers = { Authorization: `Bearer ${user.token}` };

    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 1 } });
    const del = await request.delete('/cart/items/p-001', { headers });
    expect(del.status()).toBe(200);
    expect((await del.json()).items).toHaveLength(0);

    const again = await request.delete('/cart/items/p-001', { headers });
    expect(again.status()).toBe(404);
  });

  test('clears the whole cart', async ({ request }) => {
    const user = await registerUser(request, 'cart');
    const headers = { Authorization: `Bearer ${user.token}` };

    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 1 } });
    await request.post('/cart/items', { headers, data: { productId: 'p-005', quantity: 1 } });

    const res = await request.delete('/cart', { headers });
    expect(res.status()).toBe(200);
    expect((await res.json()).items).toHaveLength(0);
  });
});