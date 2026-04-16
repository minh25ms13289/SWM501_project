const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/theory-tests/start
router.post('/start', authenticate, async (req, res) => {
  const { licenceCategory = 'B2' } = req.body;

  // Random 25 questions from bank
  const questions = await db('question_bank')
    .whereRaw("? = ANY(licence_categories)", [licenceCategory])
    .orderByRaw('RANDOM()').limit(25);

  if (questions.length < 25) {
    return res.status(400).json({ error: 'Not enough questions in bank' });
  }

  const [test] = await db('theory_tests').insert({
    learner_id: req.user.userId, licence_category: licenceCategory,
    time_limit_seconds: 1140
  }).returning('*');

  res.status(201).json({
    testId: test.id, timeLimit: 1140, totalQuestions: 25,
    questions: questions.map(q => ({
      id: q.id, text: q.text, options: q.options, isCritical: q.is_critical
    }))
  });
});

// POST /api/theory-tests/:id/submit
router.post('/:id/submit', authenticate, async (req, res) => {
  const { answers } = req.body;
  const test = await db('theory_tests').where({ id: req.params.id, learner_id: req.user.userId }).first();
  if (!test) return res.status(404).json({ error: 'Test not found' });

  let score = 0;
  let criticalPassed = true;
  const results = [];

  for (const ans of answers) {
    const question = await db('question_bank').where({ id: ans.questionId }).first();
    const correct = question.correct_answer === ans.selectedOption;
    if (correct) score++;
    if (question.is_critical && !correct) criticalPassed = false;
    results.push({
      questionId: ans.questionId, correct, correctAnswer: question.correct_answer,
      explanation: question.explanation
    });
  }

  const passed = score >= 23 && criticalPassed;
  await db('theory_tests').where({ id: test.id }).update({ score, passed, submitted_at: new Date() });

  res.json({ score, totalQuestions: 25, passed, criticalQuestionsPassed: criticalPassed, results });
});

module.exports = router;
