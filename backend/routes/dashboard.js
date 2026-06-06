const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Scan = require('../models/Scan');

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalScans, recentScans, riskBreakdown, categoryBreakdown, timelineData] = await Promise.all([
      Scan.countDocuments({ userId }),
      Scan.countDocuments({ userId, createdAt: { $gte: thirtyDaysAgo } }),
      Scan.aggregate([{ $match: { userId } }, { $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Scan.aggregate([
        { $match: { userId } },
        { $unwind: '$detections' },
        { $group: { _id: '$detections.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Scan.aggregate([
        { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgRisk: { $avg: '$riskScore' } } },
        { $sort: { '_id': 1 } }
      ])
    ]);

    const avgRiskScore = await Scan.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avg: { $avg: '$riskScore' } } }
    ]);

    const totalDetections = await Scan.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: { $size: '$detections' } } } }
    ]);

    res.json({
      totalScans,
      recentScans,
      avgRiskScore: avgRiskScore[0]?.avg?.toFixed(1) || 0,
      totalDetections: totalDetections[0]?.total || 0,
      riskBreakdown: Object.fromEntries(riskBreakdown.map(r => [r._id, r.count])),
      categoryBreakdown,
      timelineData,
      complianceStats: {
        hipaaScans: await Scan.countDocuments({ userId, complianceFlags: 'HIPAA' }),
        pciScans: await Scan.countDocuments({ userId, complianceFlags: 'PCI-DSS' }),
        gdprScans: await Scan.countDocuments({ userId, complianceFlags: 'GDPR' })
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
