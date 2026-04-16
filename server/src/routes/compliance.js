const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/audit-log
router.get('/audit-log', authenticate, authorize('compliance_officer', 'director'), async (req, res) => {
  const { entity, from, to, page = 1, limit = 50 } = req.query;
  let query = db('immutable_audit_log');

  if (entity) query = query.where({ entity_type: entity });
  if (from) query = query.where('timestamp', '>=', from);
  if (to) query = query.where('timestamp', '<=', to);

  const entries = await query.orderBy('timestamp', 'desc').limit(limit).offset((page - 1) * limit);
  res.json({ entries, page: parseInt(page) });
});

// GET /api/admin/compliance/anomalies
router.get('/anomalies', authenticate, authorize('director'), async (req, res) => {
  // Rule 1: Manual DAT entries
  const manualDAT = await db('session_records').where({ dat_source: 'manual_dat' }).count('id as cnt').first();

  // Rule 2: Records edited > 1x within 24h
  const repeatedEdits = await db('immutable_audit_log')
    .select('entity_id', 'entity_type')
    .count('id as edit_count')
    .whereRaw("timestamp > NOW() - INTERVAL '24 hours'")
    .groupBy('entity_id', 'entity_type')
    .havingRaw('COUNT(id) > 1');

  // Rule 3: Odometer discrepancies (expected ~15km/h)
  const discrepancies = await db('session_records')
    .whereRaw('dat_km < duration_minutes / 60.0 * 10'); // less than 10km/h is suspicious

  res.json({
    anomalies: [
      { type: 'manual_dat', count: parseInt(manualDAT.cnt), severity: 'medium' },
      { type: 'repeated_edit', count: repeatedEdits.length, severity: 'high' },
      { type: 'odometer_discrepancy', count: discrepancies.length, severity: 'high' },
    ],
    summary: {
      total: parseInt(manualDAT.cnt) + repeatedEdits.length + discrepancies.length,
      high: repeatedEdits.length + discrepancies.length,
      medium: parseInt(manualDAT.cnt),
    }
  });
});

// Utility: create audit log entry with hash chain
async function createAuditEntry(actorId, entityType, entityId, fieldName, oldValue, newValue, ip) {
  const lastEntry = await db('immutable_audit_log').orderBy('id', 'desc').first();
  const prevHash = lastEntry?.current_hash || '0'.repeat(64);

  const data = `${prevHash}|${actorId}|${Date.now()}|${entityType}|${entityId}|${fieldName}|${oldValue}|${newValue}`;
  const currentHash = crypto.createHash('sha256').update(data).digest('hex');

  await db('immutable_audit_log').insert({
    actor_id: actorId, entity_type: entityType, entity_id: entityId,
    field_name: fieldName, old_value: oldValue, new_value: newValue,
    ip_address: ip, prev_hash: prevHash, current_hash: currentHash
  });
}

module.exports = router;
module.exports.createAuditEntry = createAuditEntry;
