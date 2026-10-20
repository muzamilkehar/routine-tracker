import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Habit } from '../src/models/Habit.js';
import { HabitLog } from '../src/models/HabitLog.js';
import { User } from '../src/models/User.js';
import { addDays } from '../src/utils/dateUtils.js';

let mongod;
const today = new Date().toISOString().slice(0, 10); // test users use the UTC timezone

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Habit.init(), HabitLog.init()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Habit.deleteMany({}), HabitLog.deleteMany({})]);
});

async function signup(email = 'a@example.com') {
  const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test User', email, password: 'Password123' });
  return { Authorization: `Bearer ${res.body.accessToken}` };
}

const createHabit = (headers, body = { title: 'Workout' }) =>
  request(app).post('/api/v1/habits').set(headers).send(body);

describe('habits and logs', () => {
  it('creates and lists habits', async () => {
    const headers = await signup();
    const created = await createHabit(headers);
    expect(created.status).toBe(201);
    expect(created.body.habit.title).toBe('Workout');

    const list = await request(app).get('/api/v1/habits').set(headers);
    expect(list.body.habits).toHaveLength(1);
  });

  it('requires days for a custom schedule', async () => {
    const headers = await signup();
    const res = await createHabit(headers, { title: 'Gym', frequency: 'custom' });
    expect(res.status).toBe(400);
  });

  it('logs a habit and reports 100% for the month', async () => {
    const headers = await signup();
    const { body } = await createHabit(headers);

    const log = await request(app)
      .put('/api/v1/logs')
      .set(headers)
      .send({ habitId: body.habit.id, date: today, status: 'done' });
    expect(log.status).toBe(200);

    const stats = await request(app).get('/api/v1/stats/monthly').set(headers);
    expect(stats.status).toBe(200);
    expect(stats.body.overall.done).toBe(1);
    expect(stats.body.overall.percentage).toBe(100);
  });

  it('refuses to log a future date', async () => {
    const headers = await signup();
    const { body } = await createHabit(headers);
    const res = await request(app)
      .put('/api/v1/logs')
      .set(headers)
      .send({ habitId: body.habit.id, date: addDays(today, 1), status: 'done' });
    expect(res.status).toBe(400);
  });

  it("hides one user's habit from another user", async () => {
    const alice = await signup('alice@example.com');
    const bob = await signup('bob@example.com');
    const { body } = await createHabit(alice);

    const res = await request(app).get(`/api/v1/habits/${body.habit.id}`).set(bob);
    expect(res.status).toBe(404);
  });
});

  it('lets the same habit be logged on different days, and re-saving a day does not duplicate it', async () => {
    const headers = await signup();
    const { body } = await createHabit(headers, { title: 'Workout', startDate: addDays(today, -3) });
    const put = (date, status) =>
      request(app).put('/api/v1/logs').set(headers).send({ habitId: body.habit.id, date, status });

    for (const date of [addDays(today, -2), addDays(today, -1), today]) {
      expect((await put(date, 'done')).status).toBe(200);
    }
    expect((await put(today, 'missed')).status).toBe(200); // same day again: updates, no duplicate

    const logs = await request(app)
      .get(`/api/v1/logs?from=${addDays(today, -3)}&to=${today}`)
      .set(headers);
    expect(logs.body.logs).toHaveLength(3);
  });