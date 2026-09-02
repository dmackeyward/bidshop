import { test, expect } from '@playwright/test';

test('health endpoint reports ok', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.service).toBe('bidshop-api');
});

test('product catalogue is seeded with 18 products', async ({ request }) => {
  const res = await request.get('/products');
  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body.count).toBe(18);
  expect(body.items).toHaveLength(18);
});