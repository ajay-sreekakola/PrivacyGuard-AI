// audit.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const filter = { userId: req.user._id };
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(filter);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
