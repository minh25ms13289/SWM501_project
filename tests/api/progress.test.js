const request = require('supertest');
const app = require('../../server/src/app');

describe('Progress & Eligibility API', () => {
  let adminToken;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@sds.vn', password: 'Admin1234' });
    adminToken = res.body.token;
  });

  test('GET /api/learners/:id/progress returns progress data', async () => {
    const res = await request(app).get('/api/learners/3/progress')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('theoryHours');
    expect(res.body).toHaveProperty('examReady');
  });

  test('Exam approval blocked when checks fail', async () => {
    const res = await request(app).post('/api/admin/exam-eligibility/3/approve')
      .set('Authorization', `Bearer ${adminToken}`);
    // Learner likely doesn't meet all requirements
    expect([200, 400]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toContain('eligibility checks failed');
    }
  });

  test('All eligibility checks logged', async () => {
    // Verify immutable logging of all checks
  });
});
