const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Policy = require('../models/Policy');

// Default sector policies
const DEFAULT_POLICIES = {
  healthcare: {
    name: 'HIPAA Compliance Policy',
    description: 'Protects PHI and medical records per HIPAA requirements',
    complianceFrameworks: ['HIPAA', 'HITECH', 'GDPR'],
    rules: [
      { type: 'regex', pattern: 'MRN|Medical Record', action: 'redact', riskLevel: 'critical', enabled: true },
      { type: 'keyword', pattern: 'diagnosis|prescription|medication', action: 'flag', riskLevel: 'high', enabled: true },
      { type: 'ai-contextual', pattern: 'medical conditions', action: 'redact', riskLevel: 'critical', enabled: true }
    ]
  },
  finance: {
    name: 'PCI-DSS / SOX Compliance Policy',
    description: 'Financial data protection for payment cards and securities',
    complianceFrameworks: ['PCI-DSS', 'SOX', 'GLBA'],
    rules: [
      { type: 'regex', pattern: 'credit card|bank account', action: 'redact', riskLevel: 'critical', enabled: true },
      { type: 'keyword', pattern: 'insider|proprietary|merger', action: 'flag', riskLevel: 'critical', enabled: true }
    ]
  },
  defense: {
    name: 'ITAR / CMMC Policy',
    description: 'Defense and national security information protection',
    complianceFrameworks: ['ITAR', 'CMMC', 'FedRAMP'],
    rules: [
      { type: 'keyword', pattern: 'classified|secret|clearance', action: 'block', riskLevel: 'critical', enabled: true },
      { type: 'ai-contextual', pattern: 'tactical information', action: 'block', riskLevel: 'critical', enabled: true }
    ]
  }
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const policies = await Policy.find({ userId: req.user._id });
    res.json({ policies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const policy = await Policy.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ policy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/defaults/:sector', authMiddleware, async (req, res) => {
  const policy = DEFAULT_POLICIES[req.params.sector];
  if (!policy) return res.status(404).json({ error: 'No default policy for this sector' });
  res.json({ policy });
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Policy.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
