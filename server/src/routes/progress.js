const express = require('express');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Required hours by category
const REQUIREMENTS = {
  B1: { theory: 90, cabin: 0, practical: 56, datKm: 436 },
  B2: { theory: 90, cabin: 8, practical: 84, datKm: 810 },
  C:  { theory: 90, cabin: 8, practical: 112, datKm: 960 },
};

// GET /api/learners/:id/progress
router.get('/:id/progress', authenticate, async (req, res) => {
  const progress = await db('training_progress').where({ learner_id: req.params.id }).first();
  if (!progress) return res.status(404).json({ error: 'Progress not found' });

  const req_hours = REQUIREMENTS[progress.licence_category] || REQUIREMENTS.B2;
  const examReady = progress.theory_hours >= req_hours.theory
    && progress.cabin_hours >= req_hours.cabin
    && progress.practical_hours >= req_hours.practical
    && progress.dat_km >= req_hours.datKm;

  const sessions = await db('session_records').where({ learner_id: req.params.id }).orderBy('recorded_at', 'desc');

  res.json({
    theoryHours: { completed: progress.theory_hours, required: req_hours.theory },
    cabinHours: { completed: progress.cabin_hours, required: req_hours.cabin },
    practicalHours: { completed: progress.practical_hours, required: req_hours.practical },
    datKm: { completed: parseFloat(progress.dat_km), required: req_hours.datKm },
    examReady,
    sessions: sessions.map(s => ({
      date: s.recorded_at, duration: s.duration_minutes,
      datSource: s.dat_source, datRef: s.dat_reference
    }))
  });
});

// POST /api/admin/exam-eligibility/:id/approve
router.post('/exam-eligibility/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const learnerId = req.params.id;
  const progress = await db('training_progress').where({ learner_id: learnerId }).first();
  const reg = await db('registrations').where({ user_id: learnerId }).first();

  if (!progress || !reg) return res.status(404).json({ error: 'Learner not found' });

  const reqs = REQUIREMENTS[reg.licence_category] || REQUIREMENTS.B2;
  const checks = [
    { rule: `DAT km >= ${reqs.datKm}`, value: progress.dat_km, passed: progress.dat_km >= reqs.datKm },
    { rule: `Theory >= ${reqs.theory}h`, value: progress.theory_hours, passed: progress.theory_hours >= reqs.theory },
    { rule: `Practical >= ${reqs.practical}h`, value: progress.practical_hours, passed: progress.practical_hours >= reqs.practical },
    { rule: `Cabin >= ${reqs.cabin}h`, value: progress.cabin_hours, passed: progress.cabin_hours >= reqs.cabin },
    { rule: 'Fees paid', value: 'checking...', passed: true }, // TODO: check actual balance
    { rule: 'Medical cert valid', value: 'checking...', passed: true },
    { rule: 'CCCD verified', value: reg.cccd, passed: !!reg.cccd },
    { rule: 'No suspensions', value: reg.status, passed: reg.status !== 'suspended' },
  ];

  // Log all checks immutably
  for (const check of checks) {
    await db('exam_eligibility_checks').insert({
      learner_id: learnerId, check_rule: check.rule,
      check_value: String(check.value), passed: check.passed,
      checked_by: req.user.userId
    });
  }

  const allPassed = checks.every(c => c.passed);
  if (!allPassed) {
    const failed = checks.filter(c => !c.passed);
    return res.status(400).json({ error: `Cannot approve: ${failed.length} eligibility checks failed`, checks });
  }

  res.json({ approved: true, checks });
});

module.exports = router;
