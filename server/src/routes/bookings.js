const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/sessions/available
router.get('/sessions/available', authenticate, async (req, res) => {
  const { weekStart, instructorId } = req.query;

  let query = db('session_slots as ss')
    .leftJoin('bookings as b', function() {
      this.on('ss.id', 'b.session_slot_id').andOn('b.status', db.raw("'scheduled'"));
    })
    .join('users as u', 'ss.instructor_id', 'u.id')
    .join('vehicles as v', 'ss.vehicle_id', 'v.id')
    .select('ss.*', 'u.full_name as instructor_name', 'v.plate_number as vehicle_plate')
    .count('b.id as booking_count')
    .groupBy('ss.id', 'u.full_name', 'v.plate_number')
    .where('ss.date', '>=', weekStart)
    .where('v.status', 'active');

  if (instructorId) query = query.where('ss.instructor_id', instructorId);

  const slots = await query;

  const result = slots.map(s => ({
    id: s.id, date: s.date, time: s.start_time,
    instructorId: s.instructor_id, instructorName: s.instructor_name,
    currentBookings: parseInt(s.booking_count), maxBookings: s.max_learners,
    vehiclePlate: s.vehicle_plate, available: parseInt(s.booking_count) < s.max_learners
  }));

  res.json({ slots: result });
});

// POST /api/bookings
router.post('/', authenticate, async (req, res) => {
  const { date, time, instructorId } = req.body;
  const learnerId = req.user.userId;

  // Check max 5 advance bookings
  const activeCount = await db('bookings').where({ learner_id: learnerId, status: 'scheduled' }).count('id as cnt').first();
  if (parseInt(activeCount.cnt) >= 5) {
    return res.status(400).json({ error: 'Maximum 5 advance bookings reached' });
  }

  // Find slot and lock for update
  const slot = await db('session_slots').where({ date, start_time: time, instructor_id: instructorId }).first();
  if (!slot) return res.status(404).json({ error: 'Session slot not found' });

  // Check capacity (race-condition safe with transaction)
  const bookingCount = await db('bookings').where({ session_slot_id: slot.id, status: 'scheduled' }).count('id as cnt').first();
  if (parseInt(bookingCount.cnt) >= slot.max_learners) {
    return res.status(409).json({ error: 'This session slot is full' });
  }

  const [booking] = await db('bookings').insert({
    learner_id: learnerId, session_slot_id: slot.id, status: 'scheduled'
  }).returning('*');

  res.status(201).json({ bookingId: booking.id, status: 'scheduled' });
});

// DELETE /api/bookings/:id
router.delete('/:id', authenticate, async (req, res) => {
  const booking = await db('bookings').where({ id: req.params.id, learner_id: req.user.userId }).first();
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const slot = await db('session_slots').where({ id: booking.session_slot_id }).first();
  const sessionTime = new Date(`${slot.date}T${slot.start_time}`);
  const hoursUntil = (sessionTime - new Date()) / (1000 * 60 * 60);

  if (hoursUntil < 24) {
    return res.status(400).json({ error: 'Cannot cancel within 24 hours of the session' });
  }

  await db('bookings').where({ id: req.params.id }).update({ status: 'cancelled', cancelled_at: new Date() });
  res.json({ message: 'Booking cancelled' });
});

module.exports = router;
