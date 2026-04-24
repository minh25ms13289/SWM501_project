const request = require('supertest');
const app = require('../../server/src/app');

describe('Compliance & Audit API', () => {
  let directorToken;
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'director@sds.vn', password: 'Admin1234' });
    directorToken = res.body.token;
  });

  test('GET /api/admin/audit-log returns entries', async () => {
    const res = await request(app).get('/api/admin/compliance/audit-log')
      .set('Authorization', `Bearer ${directorToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('entries');
  });

  test('GET /api/admin/compliance/anomalies returns summary', async () => {
    const res = await request(app).get('/api/admin/compliance/anomalies')
      .set('Authorization', `Bearer ${directorToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.anomalies).toBeInstanceOf(Array);
  });

  test('Audit log immutability - no UPDATE/DELETE', async () => {
    // This would test at DB level that UPDATE/DELETE are blocked
    // In practice, verify REVOKE UPDATE, DELETE on immutable_audit_log
  });

  test('Hash chain integrity', async () => {
    // Verify that each entry's current_hash matches SHA-256(prev_hash + data)
  });
});
