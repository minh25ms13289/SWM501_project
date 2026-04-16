const request = require('supertest');
const app = require('../../server/src/app');

describe('Payment API', () => {
  let adminToken;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@sds.vn', password: 'Admin1234' });
    adminToken = res.body.token;
  });

  test('POST /api/admin/payments records payment', async () => {
    const res = await request(app).post('/api/admin/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ learnerId: 3, amount: 5000000, paymentDate: '2026-04-10', method: 'bank_transfer', referenceNumber: 'TF-001' });
    expect(res.status).toBe(201);
  });

  test('Duplicate reference number rejected', async () => {
    const res = await request(app).post('/api/admin/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ learnerId: 3, amount: 3000000, paymentDate: '2026-04-11', method: 'cash', referenceNumber: 'TF-001' });
    expect(res.status).toBe(409);
  });
});
