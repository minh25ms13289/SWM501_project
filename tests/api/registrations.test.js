const request = require('supertest');
const app = require('../../server/src/app');

describe('Registration API', () => {
  test('POST /api/registrations with valid data returns 201', async () => {
    const res = await request(app).post('/api/registrations').send({
      fullName: 'Nguyen Van Test', dob: '2000-01-15', cccd: '012345678901',
      phone: '0901234567', email: 'test@sds.vn', address: '123 HCM',
      licenceCategory: 'B2'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('referenceNumber');
  });

  test('POST /api/registrations with invalid CCCD returns 400', async () => {
    const res = await request(app).post('/api/registrations')
      .send({ cccd: '12345', fullName: 'Test', dob: '2000-01-01', phone: '0901111111', email: 'a@b.com', licenceCategory: 'B2' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('12 digits');
  });

  test('POST /api/registrations with duplicate CCCD returns 409', async () => {
    // First registration
    await request(app).post('/api/registrations').send({
      fullName: 'First', dob: '2000-01-01', cccd: '999888777666',
      phone: '0901111111', email: 'first@sds.vn', licenceCategory: 'B2'
    });
    // Duplicate
    const res = await request(app).post('/api/registrations').send({
      fullName: 'Second', dob: '2000-01-01', cccd: '999888777666',
      phone: '0902222222', email: 'second@sds.vn', licenceCategory: 'B2'
    });
    expect(res.status).toBe(409);
  });
});
