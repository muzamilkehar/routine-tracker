import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Catch the emails instead of sending them, so the tests can read the tokens inside
const sent = vi.hoisted(() => ({ verification: [], reset: [] }));
vi.mock('../src/services/email.service.js', () => ({
  sendVerificationEmail: vi.fn(async (user, token) => {
    sent.verification.push({ to: user.email, token });
  }),
  sendPasswordResetEmail: vi.fn(async (user, token) => {
    sent.reset.push({ to: user.email, token });
  }),
}));

import app from '../src/app.js';
import { User } from '../src/models/User.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await User.init();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  sent.verification.length = 0;
  sent.reset.length = 0;
});

const EMAIL = 'a@example.com';
const OLD_PASSWORD = 'Password123';
const NEW_PASSWORD = 'NewPass456';

const signup = () =>
  request(app).post('/api/v1/auth/register').send({ name: 'Test User', email: EMAIL, password: OLD_PASSWORD });
const authHeader = (res) => ({ Authorization: `Bearer ${res.body.accessToken}` });
const cookieOf = (res) => res.headers['set-cookie'].map((c) => c.split(';')[0]);

describe('email verification', () => {
  it('sends a link on register and verifies the email with it', async () => {
    await signup();
    expect(sent.verification).toHaveLength(1);
    expect((await User.findOne({ email: EMAIL })).isEmailVerified).toBe(false);

    const res = await request(app).post('/api/v1/auth/verify-email').send({ token: sent.verification[0].token });
    expect(res.status).toBe(200);
    expect((await User.findOne({ email: EMAIL })).isEmailVerified).toBe(true);
  });

  it('rejects a wrong token and a token that was already used', async () => {
    await signup();
    const { token } = sent.verification[0];

    const wrong = await request(app).post('/api/v1/auth/verify-email').send({ token: 'x'.repeat(64) });
    expect(wrong.status).toBe(400);

    await request(app).post('/api/v1/auth/verify-email').send({ token });
    const again = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(again.status).toBe(400);
  });

  it('resends a new link that replaces the old one', async () => {
    const reg = await signup();
    const oldToken = sent.verification[0].token;

    const res = await request(app).post('/api/v1/auth/resend-verification').set(authHeader(reg));
    expect(res.status).toBe(200);
    expect(sent.verification).toHaveLength(2);

    const stale = await request(app).post('/api/v1/auth/verify-email').send({ token: oldToken });
    expect(stale.status).toBe(400);
    const fresh = await request(app).post('/api/v1/auth/verify-email').send({ token: sent.verification[1].token });
    expect(fresh.status).toBe(200);
  });

  it('requires a login to resend, and refuses once verified', async () => {
    const anonymous = await request(app).post('/api/v1/auth/resend-verification');
    expect(anonymous.status).toBe(401);

    const reg = await signup();
    await request(app).post('/api/v1/auth/verify-email').send({ token: sent.verification[0].token });
    const res = await request(app).post('/api/v1/auth/resend-verification').set(authHeader(reg));
    expect(res.status).toBe(400);
  });
});

describe('forgot and reset password', () => {
  const login = (password) => request(app).post('/api/v1/auth/login').send({ email: EMAIL, password });

  it('answers the same way for unknown emails and sends nothing', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(sent.reset).toHaveLength(0);

    await signup();
    const known = await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    expect(known.status).toBe(200);
    expect(known.body.message).toBe(res.body.message);
    expect(sent.reset).toHaveLength(1);
  });

  it('does not send a reset email to a suspended account', async () => {
    await signup();
    await User.updateOne({ email: EMAIL }, { status: 'suspended' });
    await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    expect(sent.reset).toHaveLength(0);
  });

  it('resets the password, and the link only works once', async () => {
    await signup();
    await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    const { token } = sent.reset[0];

    const res = await request(app).post('/api/v1/auth/reset-password').send({ token, password: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect((await login(NEW_PASSWORD)).status).toBe(200);
    expect((await login(OLD_PASSWORD)).status).toBe(401);

    const again = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'Another789' });
    expect(again.status).toBe(400);
  });

  it('rejects an expired link and a weak password', async () => {
    await signup();
    await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    const { token } = sent.reset[0];

    const weak = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'short' });
    expect(weak.status).toBe(400);

    await User.updateOne({ email: EMAIL }, { passwordResetExpires: new Date(Date.now() - 1000) });
    const expired = await request(app).post('/api/v1/auth/reset-password').send({ token, password: NEW_PASSWORD });
    expect(expired.status).toBe(400);
  });

  it('signs every device out after a reset', async () => {
    const reg = await signup();

    // Control: before the reset, the session cookie works (and rotates to a new one)
    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieOf(reg));
    expect(refreshed.status).toBe(200);

    await request(app).post('/api/v1/auth/forgot-password').send({ email: EMAIL });
    await request(app).post('/api/v1/auth/reset-password').send({ token: sent.reset[0].token, password: NEW_PASSWORD });

    const after = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookieOf(refreshed));
    expect(after.status).toBe(401);
  });
});