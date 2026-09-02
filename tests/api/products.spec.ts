import { test, expect } from '@playwright/test';

test.describe('Products (public endpoints)', () => {
  test('lists the seeded catalogue with well-formed products', async ({ request }) => {
    const res = await request.get('/products');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.count).toBe(18);
    expect(body.items).toHaveLength(18);
    for (const p of body.items) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(typeof p.imageUrl).toBe('string');
    }
  });

  test('filters by category', async ({ request }) => {
    const res = await request.get('/products?category=Dairy');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.count).toBe(3); // milk, cheese, yoghurt
    expect(body.items.every((p: any) => p.category === 'Dairy')).toBe(true);
  });

  test('search matches names case-insensitively', async ({ request }) => {
    const res = await request.get('/products?search=AVOCADO');
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.items[0].id).toBe('p-005');
  });

  test('price bounds are inclusive and respected', async ({ request }) => {
    const res = await request.get('/products?minPrice=10&maxPrice=15');
    const body = await res.json();

    expect(body.count).toBeGreaterThan(0);
    for (const p of body.items) {
      expect(p.price).toBeGreaterThanOrEqual(10);
      expect(p.price).toBeLessThanOrEqual(15);
    }
  });

  test('categories endpoint lists all 8 categories', async ({ request }) => {
    const res = await request.get('/products/categories');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.categories).toHaveLength(8);
    expect(body.categories).toContain('Seafood');
    expect(body.categories).toContain('Beverages');
  });

  test('returns a single product by id', async ({ request }) => {
    const res = await request.get('/products/p-001');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      id: 'p-001',
      name: 'NZ Grass-Fed Beef Mince',
      price: 14.5,
      stock: 40,
    });
  });

  test('returns 404 for an unknown product id', async ({ request }) => {
    const res = await request.get('/products/p-999');
    expect(res.status()).toBe(404);
  });
});