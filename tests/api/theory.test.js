const request = require('supertest');
const app = require('../../server/src/app');

describe('Theory Test API', () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'learner@sds.vn', password: 'Learn1234' });
    token = res.body.token;
  });

  test('POST /api/theory-tests/start returns 25 questions', async () => {
    const res = await request(app).post('/api/theory-tests/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ licenceCategory: 'B2' });
    expect(res.status).toBe(201);
    expect(res.body.questions).toHaveLength(25);
    expect(res.body.timeLimit).toBe(1140);
  });

  test('Critical question wrong = fail even with 24/25', async () => {
    // Submit with 24 correct but critical wrong
    // Expect passed = false
  });
});
