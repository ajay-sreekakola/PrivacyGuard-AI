const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { protectPipeline, sanitizeForEmbedding, analyzeChunkPrivacy, PseudonymVault } = require('../services/embeddingPrivacy');

// Protect text before embedding (RAG / vector DB pipelines)
router.post('/protect', authMiddleware, async (req, res) => {
  try {
    const { data, pipelineConfig = {} } = req.body;
    if (!data) return res.status(400).json({ error: 'data is required' });

    const result = await protectPipeline(data, {
      sector: req.user.sector || 'general',
      ...pipelineConfig
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze text chunks for RAG pipelines
router.post('/analyze-chunks', authMiddleware, async (req, res) => {
  try {
    const { chunks } = req.body;
    if (!Array.isArray(chunks) || !chunks.length) return res.status(400).json({ error: 'chunks array required' });

    const analysis = analyzeChunkPrivacy(chunks.map(c => (typeof c === 'string' ? c : JSON.stringify(c))));
    const safeToembed = analysis.filter(c => !c.hasSensitiveData).length;

    res.json({
      analysis,
      summary: {
        total: chunks.length,
        safeToEmbed: safeToembed,
        requiresSanitization: chunks.length - safeToembed
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pseudonymize text with reversible vault
router.post('/pseudonymize', authMiddleware, async (req, res) => {
  try {
    const { text, aggressiveness = 'medium' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const vault = new PseudonymVault();
    const { sanitized, modifications } = sanitizeForEmbedding(text, { vault, aggressiveness });

    res.json({
      original: text,
      pseudonymized: sanitized,
      modifications,
      vault: vault.exportVault(),
      modificationCount: modifications.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
