const request = require('supertest');
const app = require('../../server/src/app');

describe('Auth API', () => {
  test('POST /api/auth/login with valid credentials returns token', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@sds.vn', password: 'Admin1234' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@sds.vn', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/forgot-password always returns 200', async () => {
    const res = await request(app).post('/api/auth/forgot-password')
      .send({ email: 'nobody@sds.vn' });
    expect(res.status).toBe(200);
  });
});
