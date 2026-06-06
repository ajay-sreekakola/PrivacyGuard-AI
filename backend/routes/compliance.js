const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Scan = require('../models/Scan');
const { generateComplianceReport, formatReportAsText } = require('../services/complianceReporter');

// Generate compliance report for a specific scan
router.get('/scan/:scanId', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const report = generateComplianceReport(scan.toObject(), req.user);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate aggregate compliance report for date range
router.post('/aggregate', authMiddleware, async (req, res) => {
  try {
    const { from, to, sector } = req.body;
    const filter = { userId: req.user._id };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (sector) filter.sector = sector;

    const scans = await Scan.find(filter).limit(500);
    if (!scans.length) return res.status(404).json({ error: 'No scans found for the given criteria' });

    // Aggregate detections across all scans
    const allDetections = scans.flatMap(s => s.detections || []);
    const allFlags = [...new Set(scans.flatMap(s => s.complianceFlags || []))];
    const avgRisk = scans.reduce((a, s) => a + s.riskScore, 0) / scans.length;
    const maxRisk = Math.max(...scans.map(s => s.riskScore));

    const aggregated = {
      detections: allDetections,
      riskScore: Math.round(avgRisk),
      riskLevel: maxRisk >= 70 ? 'critical' : maxRisk >= 40 ? 'high' : maxRisk >= 20 ? 'medium' : 'low',
      complianceFlags: allFlags,
      sector: sector || req.user.sector,
      scanCount: scans.length,
      period: { from, to }
    };

    const report = generateComplianceReport(aggregated, req.user);
    res.json({ report, scanCount: scans.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download report as plain text
router.get('/scan/:scanId/text', authMiddleware, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.user._id });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const report = generateComplianceReport(scan.toObject(), req.user);
    const text = formatReportAsText(report);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${req.params.scanId}.txt"`);
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
