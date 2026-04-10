const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/learners/:id/profile
router.get('/:id/profile', authenticate, async (req, res) => {
  if (req.user.role === 'learner' && req.user.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = await db('users').where({ id: req.params.id }).first();
  const registration = await db('registrations').where({ user_id: req.params.id }).first();

  if (!user) return res.status(404).json({ error: 'Learner not found' });

  res.json({
    id: user.id, fullName: user.full_name, email: user.email, phone: user.phone,
    studentId: registration?.student_id, licenceCategory: registration?.licence_category,
    status: registration?.status, enrolledCourse: registration?.licence_category,
    registrationDate: registration?.created_at
  });
});

// PUT /api/learners/:id/profile
router.put('/:id/profile', authenticate, async (req, res) => {
  if (req.user.role === 'learner' && req.user.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { phone, email, cccd, dob } = req.body;

  // Direct update for phone/email
  if (phone || email) {
    const updates = {};
    if (phone) updates.phone = phone;
    if (email) updates.email = email;
    await db('users').where({ id: req.params.id }).update(updates);

    // Audit log
    await db('audit_log').insert({
      user_id: req.user.userId, action: 'profile_update',
      entity_type: 'user', entity_id: req.params.id,
      new_value: JSON.stringify(updates)
    });

    return res.json({ message: 'Updated' });
  }

  // Approval-required fields
  if (cccd || dob) {
    const [request] = await db('profile_change_requests').insert({
      learner_id: req.params.id,
      field_name: cccd ? 'cccd' : 'dob',
      old_value: '', new_value: cccd || dob,
      status: 'pending'
    }).returning('*');

    return res.status(202).json({ message: 'Change request submitted for admin review', requestId: request.id });
  }

  res.status(400).json({ error: 'No fields to update' });
});

// GET /api/admin/learners (search + filter)
router.get('/', authenticate, authorize('admin', 'director'), async (req, res) => {
  const { search, category, status, from, to, page = 1, limit = 20, sortBy = 'full_name', order = 'asc' } = req.query;

  let query = db('registrations').select('*');

  if (search) query = query.where(function() {
    this.whereILike('full_name', `%${search}%`)
      .orWhereILike('student_id', `%${search}%`)
      .orWhereILike('cccd', `%${search}%`);
  });
  if (category) query = query.where({ licence_category: category });
  if (status) query = query.where({ status });
  if (from) query = query.where('created_at', '>=', from);
  if (to) query = query.where('created_at', '<=', to);

  const total = await query.clone().count('id as cnt').first();
  const data = await query.orderBy(sortBy, order).limit(limit).offset((page - 1) * limit);

  res.json({ data, total: parseInt(total.cnt), page: parseInt(page), totalPages: Math.ceil(total.cnt / limit) });
});

module.exports = router;
