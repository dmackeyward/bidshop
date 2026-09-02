import { test, expect } from '@playwright/test';
import { registerUser } from '../helpers/api';

test.describe('Auth endpoints', () => {
  test('register creates a user and returns a token', async ({ request }) => {
    const email = `fresh-${Date.now()}@example.com`;
    const res = await request.post('/auth/register', {
      data: { email, password: 'secret123', name: 'A New Buyer' },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user).toMatchObject({ email, name: 'A New Buyer' });
    expect(body.user.id).toBeTruthy();
    expect(body.user).not.toHaveProperty('passwordHash'); // never leak secrets
  });

  test('register rejects a duplicate email with 409', async ({ request }) => {
    const user = await registerUser(request, 'dup');
    const res = await request.post('/auth/register', {
      data: { email: user.email, password: 'secret123', name: 'Clone' },
    });
    expect(res.status()).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'A user with that email already exists' });
  });

  test('register validates email format and password length', async ({ request }) => {
    const badEmail = await request.post('/auth/register', {
      data: { email: 'not-an-email', password: 'secret123', name: 'X' },
    });
    expect(badEmail.status()).toBe(400);

    const shortPassword = await request.post('/auth/register', {
      data: { email: `short-${Date.now()}@example.com`, password: 'abc', name: 'X' },
    });
    expect(shortPassword.status()).toBe(400);
    expect(await shortPassword.json()).toMatchObject({
      error: 'Password must be at least 6 characters',
    });
  });

  test('login succeeds with correct credentials', async ({ request }) => {
    const user = await registerUser(request, 'login');
    const res = await request.post('/auth/login', {
      data: { email: user.email, password: user.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(user.email);
  });

  test('login rejects wrong password with 401', async ({ request }) => {
    const user = await registerUser(request, 'wrongpw');
    const res = await request.post('/auth/login', {
      data: { email: user.email, password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({ error: 'Invalid email or password' });
  });

  test('GET /auth/me returns the caller with a valid token', async ({ request }) => {
    const user = await registerUser(request, 'me');
    const res = await request.get('/auth/me', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({
      id: user.userId,
      email: user.email,
      name: user.name,
    });
  });

  test('GET /auth/me rejects requests without a token', async ({ request }) => {
    const res = await request.get('/auth/me');
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({
      error: 'Missing or invalid Authorization header',
    });
  });

  test('GET /auth/me rejects a garbage token', async ({ request }) => {
    const res = await request.get('/auth/me', {
      headers: { Authorization: 'Bearer not.a.real.token' },
    });
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({ error: 'Invalid or expired token' });
  });
});