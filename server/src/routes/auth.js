const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await db('users').where({ email }).first();
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // Check lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return res.status(423).json({ error: 'Account locked', lockedUntil: user.locked_until });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const updates = { failed_login_attempts: attempts };
    if (attempts >= 5) {
      updates.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    }
    await db('users').where({ id: user.id }).update(updates);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Reset failed attempts
  await db('users').where({ id: user.id }).update({
    failed_login_attempts: 0, locked_until: null, last_login: new Date()
  });

  // Get role
  const role = await db('roles').where({ id: user.role_id }).first();

  // Generate JWT (30 min expiry)
  const token = jwt.sign({ userId: user.id, role: role.name, email: user.email }, JWT_SECRET, { expiresIn: '30m' });

  // Create session
  await db('sessions').insert({ user_id: user.id, token_hash: token.slice(-20), expires_at: new Date(Date.now() + 30 * 60 * 1000) });

  // Log
  await db('login_attempts').insert({ user_id: user.id, ip_address: req.ip, success: true });

  res.json({ token, user: { id: user.id, email: user.email, role: role.name, name: user.full_name } });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await db('sessions').where({ user_id: req.user.userId }).del();
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await db('users').where({ id: req.user.userId }).first();
  const role = await db('roles').where({ id: user.role_id }).first();
  res.json({ id: user.id, email: user.email, role: role.name, name: user.full_name, lastLogin: user.last_login });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  // Always return 200 to prevent email enumeration
  const { email } = req.body;
  const user = await db('users').where({ email }).first();
  if (user) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db('password_reset_tokens').insert({
      user_id: user.id, token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 60 * 1000)
    });
    // TODO: send email with reset link
  }
  res.json({ message: 'If the email exists, a reset link has been sent' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // Validate password complexity
  if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
  }

  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await db('password_reset_tokens').where({ token_hash: tokenHash, used: false }).where('expires_at', '>', new Date()).first();

  if (!record) return res.status(410).json({ error: 'Reset link has expired or already been used' });

  const hash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: record.user_id }).update({ password_hash: hash });
  await db('password_reset_tokens').where({ id: record.id }).update({ used: true });
  await db('sessions').where({ user_id: record.user_id }).del(); // Invalidate old sessions

  // Audit log
  await db('audit_log').insert({ user_id: record.user_id, action: 'password_reset', entity_type: 'user', entity_id: record.user_id });

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
