const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  type: String,         // PII_EMAIL, PII_SSN, MEDICAL, FINANCIAL, etc.
  category: String,     // PII, MEDICAL, FINANCIAL, CONFIDENTIAL, CONTEXTUAL
  value: String,        // original matched text
  redacted: String,     // replacement token
  position: { start: Number, end: Number },
  confidence: Number,   // 0-1
  riskLevel: String,    // low, medium, high, critical
  context: String       // surrounding text snippet
});

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputText: { type: String, required: true },
  redactedText: { type: String },
  model: { type: String, default: 'claude-sonnet-4-20250514' },
  detections: [detectionSchema],
  riskScore: { type: Number, default: 0 },       // 0-100
  riskLevel: { type: String, default: 'low' },
  sector: { type: String, default: 'general' },
  complianceFlags: [String],                      // HIPAA, PCI-DSS, GDPR, etc.
  processingTime: Number,
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  aiResponse: String,                             // LLM response on redacted text
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scan', scanSchema);
