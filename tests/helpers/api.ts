import { APIRequestContext } from '@playwright/test';

export interface RegisteredUser {
  email: string;
  password: string;
  name: string;
  token: string;
  userId: string;
}

/** Register a brand-new user with a unique email. Never reuses state. */
export async function registerUser(
  request: APIRequestContext,
  prefix = 'buyer',
): Promise<RegisteredUser> {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = 'secret123';
  const name = `Test ${prefix}`;

  const res = await request.post('/auth/register', {
    data: { email, password, name },
  });
  if (res.status() !== 201) {
    throw new Error(`registerUser failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return { email, password, name, token: body.token, userId: body.user.id };
}