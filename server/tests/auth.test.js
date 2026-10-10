import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('basic API behaviour', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/habits');
    expect(res.status).toBe(401);
  });

  it('rejects invalid input before touching the database', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });
});