const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { nlpScan } = require('../services/nlpService');

// Run NLP entity detection on text
router.post('/entities', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    if (text.length > 50000) return res.status(400).json({ error: 'Text exceeds 50,000 character limit' });

    const result = nlpScan(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
