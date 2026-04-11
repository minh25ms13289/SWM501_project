const express = require('express');
const db = require('../../config/database');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/registrations
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const { status, category, from, to, page = 1, limit = 20 } = req.query;
  let query = db('registrations');

  if (status) query = query.where({ status });
  if (category) query = query.where({ licence_category: category });
  if (from) query = query.where('created_at', '>=', from);
  if (to) query = query.where('created_at', '<=', to);

  const total = await query.clone().count('id as cnt').first();
  const data = await query.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);

  res.json({ data, total: parseInt(total.cnt), page: parseInt(page) });
});

// PUT /api/admin/registrations/:id/approve
router.put('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const reg = await db('registrations').where({ id: req.params.id }).first();
  if (!reg) return res.status(404).json({ error: 'Registration not found' });
  if (reg.status !== 'pending' && reg.status !== 'additional_docs_required') {
    return res.status(400).json({ error: 'Registration is not in pending status' });
  }

  // Generate student ID
  const year = new Date().getFullYear();
  const count = await db('registrations').whereNotNull('student_id').count('id as cnt').first();
  const studentId = `STU-${year}-${String(parseInt(count.cnt) + 1).padStart(4, '0')}`;

  await db('registrations').where({ id: req.params.id }).update({
    status: 'approved', student_id: studentId,
    reviewed_by: req.user.userId, reviewed_at: new Date()
  });

  res.json({ studentId, status: 'approved' });
});

// PUT /api/admin/registrations/:id/reject
router.put('/:id/reject', authenticate, authorize('admin'), async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

  await db('registrations').where({ id: req.params.id }).update({
    status: 'rejected', rejection_reason: reason,
    reviewed_by: req.user.userId, reviewed_at: new Date()
  });

  res.json({ status: 'rejected', reason });
});

module.exports = router;
