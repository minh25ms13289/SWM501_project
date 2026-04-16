const express = require('express');
const multer = require('multer');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// POST /api/registrations
router.post('/', async (req, res) => {
  const { fullName, dob, cccd, address, phone, email, licenceCategory } = req.body;

  // Validate CCCD
  if (!cccd || !/^\d{12}$/.test(cccd)) {
    return res.status(400).json({ error: 'CCCD must be exactly 12 digits' });
  }

  // Check duplicate
  const existing = await db('registrations').where({ cccd }).first();
  if (existing) return res.status(409).json({ error: 'This CCCD is already registered' });

  // Validate licence category
  if (!['B1', 'B2', 'C'].includes(licenceCategory)) {
    return res.status(400).json({ error: 'Licence category must be B1, B2, or C' });
  }

  // Generate reference number
  const year = new Date().getFullYear();
  const count = await db('registrations').whereRaw("reference_number LIKE ?", [`REG-${year}-%`]).count('id as cnt').first();
  const seq = String(parseInt(count.cnt) + 1).padStart(4, '0');
  const referenceNumber = `REG-${year}-${seq}`;

  const [registration] = await db('registrations').insert({
    reference_number: referenceNumber, full_name: fullName, dob, cccd,
    address, phone, email, licence_category: licenceCategory, status: 'pending'
  }).returning('*');

  // TODO: Send confirmation email/SMS
  // TODO: Create admin notification

  res.status(201).json({ id: registration.id, referenceNumber, status: 'pending' });
});

// POST /api/registrations/:id/documents
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'id_card' or 'medical_cert'

  if (!req.file) return res.status(400).json({ error: 'File is required' });
  if (!['application/pdf', 'image/jpeg'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Only PDF and JPG files are accepted' });
  }

  const [doc] = await db('registration_documents').insert({
    registration_id: id, document_type: type,
    file_path: req.file.path, file_name: req.file.originalname,
    file_size: req.file.size, mime_type: req.file.mimetype
  }).returning('*');

  res.status(201).json({ documentId: doc.id, filename: doc.file_name });
});

// GET /api/registrations/:id
router.get('/:id', authenticate, async (req, res) => {
  const registration = await db('registrations').where({ id: req.params.id }).first();
  if (!registration) return res.status(404).json({ error: 'Registration not found' });

  const documents = await db('registration_documents').where({ registration_id: req.params.id });
  res.json({ ...registration, documents });
});

module.exports = router;
