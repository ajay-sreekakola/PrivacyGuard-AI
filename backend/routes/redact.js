const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const { performScan } = require('../services/privacyEngine');
const Scan = require('../models/Scan');

/**
 * Safe LLM Proxy - redacts text BEFORE sending to any LLM
 * This is the core innovation: privacy-preserving AI pipeline
 */
router.post('/safe-prompt', authMiddleware, async (req, res) => {
  try {
    const { prompt, systemPrompt = '', sector, model = 'claude-sonnet-4-20250514' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const effectiveSector = sector || req.user.sector || 'general';

    // Step 1: Scan and redact the user's prompt
    const scanResult = await performScan(prompt, effectiveSector, true);
    const safePrompt = scanResult.redactedText;

    // Step 2: Also scan the system prompt if provided
    let safeSystemPrompt = systemPrompt;
    if (systemPrompt) {
      const sysScan = await performScan(systemPrompt, effectiveSector, false);
      safeSystemPrompt = sysScan.redactedText;
    }

    // Step 3: Send REDACTED prompt to LLM
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let aiResponse = '';

    if (apiKey) {
      const messages = [{ role: 'user', content: safePrompt }];
      const body = { model, max_tokens: 2000, messages };
      if (safeSystemPrompt) body.system = safeSystemPrompt;

      const llmRes = await axios.post('https://api.anthropic.com/v1/messages', body, {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      });
      aiResponse = llmRes.data.content[0].text;
    } else {
      aiResponse = '[Demo Mode] AI response would appear here. Add ANTHROPIC_API_KEY to enable.';
    }

    // Step 4: Scan the AI response for any leaked sensitive info
    const responseScan = await performScan(aiResponse, effectiveSector, false);

    // Step 5: Save audit record
    await Scan.create({
      userId: req.user._id,
      inputText: prompt,
      redactedText: safePrompt,
      detections: scanResult.detections,
      riskScore: scanResult.riskScore,
      riskLevel: scanResult.riskLevel,
      sector: effectiveSector,
      complianceFlags: scanResult.complianceFlags,
      processingTime: scanResult.processingTime,
      aiResponse: responseScan.redactedText,
      status: 'completed'
    });

    res.json({
      originalPrompt: prompt,
      redactedPrompt: safePrompt,
      aiResponse: responseScan.redactedText,  // Return response with any leaked data redacted
      scanResult: {
        riskScore: scanResult.riskScore,
        riskLevel: scanResult.riskLevel,
        detectionCount: scanResult.detections.length,
        complianceFlags: scanResult.complianceFlags
      },
      responseRisk: {
        riskScore: responseScan.riskScore,
        detectionCount: responseScan.detections.length
      },
      privacyPreserved: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Batch redaction
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { texts, sector } = req.body;
    if (!Array.isArray(texts) || texts.length === 0) return res.status(400).json({ error: 'texts array required' });
    if (texts.length > 50) return res.status(400).json({ error: 'Maximum 50 texts per batch' });

    const effectiveSector = sector || req.user.sector || 'general';
    const results = await Promise.all(
      texts.map(text => performScan(text, effectiveSector, false))
    );

    res.json({ results, batchSize: texts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
