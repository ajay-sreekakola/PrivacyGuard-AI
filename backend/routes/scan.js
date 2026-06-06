const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { performScan } = require('../services/privacyEngine');
const Scan = require('../models/Scan');
const AuditLog = require('../models/AuditLog');

// Analyze text for privacy risks
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { text, sector, useAI = true, saveResult = true } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Text is required' });
    if (text.length > 50000) return res.status(400).json({ error: 'Text exceeds 50,000 character limit' });

    const effectiveSector = sector || req.user.sector || 'general';
    const result = await performScan(text, effectiveSector, useAI);

    let scan = null;
    if (saveResult) {
      scan = await Scan.create({
        userId: req.user._id,
        inputText: text,
        redactedText: result.redactedText,
        detections: result.detections,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        sector: effectiveSector,
        complianceFlags: result.complianceFlags,
        processingTime: result.processingTime,
        status: 'completed'
      });
      await AuditLog.create({ userId: req.user._id, action: 'SCAN', scanId: scan._id, ipAddress: req.ip, details: new Map([['riskScore', result.riskScore], ['detectionCount', result.detections.length]]) });
    }

    res.json({ ...result, scanId: scan?._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get scan history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, riskLevel, sector } = req.query;
    const filter = { userId: req.user._id };
    if (riskLevel) filter.riskLevel = riskLevel;
    if (sector) filter.sector = sector;

    const scans = await Scan.find(filter)
      .select('-inputText -redactedText -detections')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Scan.countDocuments(filter);
    res.json({ scans, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single scan
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ scan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete scan
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Scan.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Scan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
