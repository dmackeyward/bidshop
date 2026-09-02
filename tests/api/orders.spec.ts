import { test, expect } from '@playwright/test';
import { registerUser } from '../helpers/api';

const customer = {
  name: 'Mike Builder',
  email: 'mike@example.com',
  address: '1 Queen St',
  city: 'Auckland',
  postcode: '1010',
};

test.describe('Orders (authenticated)', () => {
  test('rejects unauthenticated order requests', async ({ request }) => {
    const res = await request.post('/orders', { data: { customer } });
    expect(res.status()).toBe(401);
  });

  test('rejects an order with an empty cart', async ({ request }) => {
    const user = await registerUser(request, 'order');
    const res = await request.post('/orders', {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { customer },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Cannot place an order with an empty cart',
    });
  });

  test('validates customer details and NZ postcode format', async ({ request }) => {
    const user = await registerUser(request, 'order');
    const headers = { Authorization: `Bearer ${user.token}` };
    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 1 } });

    // Missing customer block
    expect((await request.post('/orders', { headers, data: {} })).status()).toBe(400);

    // Incomplete customer
    const incomplete = await request.post('/orders', {
      headers,
      data: { customer: { name: 'X' } },
    });
    expect(incomplete.status()).toBe(400);

    // Bad postcode
    const badPostcode = await request.post('/orders', {
      headers,
      data: { customer: { ...customer, postcode: '101' } },
    });
    expect(badPostcode.status()).toBe(400);
    expect(await badPostcode.json()).toMatchObject({
      error: 'postcode must be a 4-digit NZ postcode',
    });
  });

  test('places an order: confirms it, decrements stock, and empties the cart', async ({
    request,
  }) => {
    const user = await registerUser(request, 'order');
    const headers = { Authorization: `Bearer ${user.token}` };

    // Beef mince $14.50 × 2 = $29.00 subtotal
    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 2 } });

    const res = await request.post('/orders', { headers, data: { customer } });
    expect(res.status()).toBe(201);

    const order = await res.json();
    expect(order.status).toBe('CONFIRMED');
    expect(order.subtotal).toBe(29.0);
    expect(order.gst).toBeCloseTo(4.35, 2); // 15% of 29.00
    expect(order.total).toBeCloseTo(33.35, 2);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productId: 'p-001',
      quantity: 2,
      unitPrice: 14.5,
      lineTotal: 29.0,
    });
    expect(order.customer).toMatchObject(customer);

    // 1. Stock was decremented: 40 - 2 = 38
    const product = await (await request.get('/products/p-001')).json();
    expect(product.stock).toBe(38);

    // 2. The cart was emptied
    const cart = await (await request.get('/cart', { headers })).json();
    expect(cart.items).toHaveLength(0);

    // 3. The order is listed and fetchable by id
    const list = await (await request.get('/orders', { headers })).json();
    expect(list.count).toBe(1);
    expect(list.items[0].id).toBe(order.id);

    const byId = await request.get(`/orders/${order.id}`, { headers });
    expect(byId.status()).toBe(200);
    expect((await byId.json()).id).toBe(order.id);
  });

  test('a user cannot read another user\'s order', async ({ request }) => {
    const buyer = await registerUser(request, 'order');
    const stranger = await registerUser(request, 'order');

    const buyerHeaders = { Authorization: `Bearer ${buyer.token}` };
    await request.post('/cart/items', { headers: buyerHeaders, data: { productId: 'p-001', quantity: 1 } });
    const order = await (await request.post('/orders', { headers: buyerHeaders, data: { customer } })).json();

    const res = await request.get(`/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${stranger.token}` },
    });
    expect(res.status()).toBe(404);
  });

test.fixme('cart and order apply the same GST rate to identical items (BUG-005)', async ({
    request,
  }) => {
    const user = await registerUser(request, 'order');
    const headers = { Authorization: `Bearer ${user.token}` };

    await request.post('/cart/items', { headers, data: { productId: 'p-001', quantity: 2 } });
    const cart = await (await request.get('/cart', { headers })).json();

    const order = await (await request.post('/orders', { headers, data: { customer } })).json();

    // The price the customer saw in the cart must equal the price charged on the order.
    expect(order.gst).toBeCloseTo(cart.gst, 2);
    expect(order.total).toBeCloseTo(cart.total, 2);
  });
});