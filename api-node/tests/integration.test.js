'use strict';

const request = require('supertest');
const app = require('../src/index');

let authToken;

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  test('returns JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    authToken = res.body.token;
  });

  test('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when body is empty', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Stats (protected) ───────────────────────────────────────────────────────

describe('POST /api/stats', () => {
  beforeAll(async () => {
    if (!authToken) {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password123' });
      authToken = res.body.token;
    }
  });

  test('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/stats')
      .send({ Q: [[1, 0], [0, 1]], R: [[2, 3], [0, 4]] });

    expect(res.status).toBe(401);
  });

  test('returns statistics for valid Q and R matrices', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        Q: [[1, 0], [0, 1]],
        R: [[2, 3], [0, 4]],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('q_stats');
    expect(res.body).toHaveProperty('r_stats');
    expect(res.body).toHaveProperty('combined_stats');
    expect(res.body.q_stats.max).toBe(1);
    expect(res.body.q_stats.min).toBe(0);
    expect(res.body.q_stats.is_diagonal).toBe(true);
    expect(res.body.r_stats.is_diagonal).toBe(false);
  });

  test('returns 400 when matrices are missing', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('returns 400 when Q is empty array', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ Q: [], R: [[1]] });

    expect(res.status).toBe(400);
  });

  test('health endpoint is public', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
