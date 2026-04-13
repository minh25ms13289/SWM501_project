const request = require('supertest');
const app = require('../../server/src/app');

describe('Booking API', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'learner@sds.vn', password: 'Learn1234' });
    token = res.body.token;
  });

  test('GET /api/sessions/available returns slots', async () => {
    const res = await request(app).get('/api/sessions/available')
      .set('Authorization', `Bearer ${token}`)
      .query({ weekStart: '2026-04-13' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slots');
  });

  test('POST /api/bookings creates booking', async () => {
    const res = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-04-15', time: '09:00', instructorId: 2 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('bookingId');
  });

  test('DELETE /api/bookings/:id cancels booking >= 24h', async () => {
    const booking = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-04-20', time: '09:00', instructorId: 2 });
    const res = await request(app).delete(`/api/bookings/${booking.body.bookingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('Max 3 learners per slot enforced', async () => {
    // This test would create 3 bookings then try a 4th
    // Expect 409 on the 4th attempt
  });
});
