const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  sector: String,
  rules: [{
    type: { type: String },         // regex, keyword, ai-contextual
    pattern: String,
    action: String,                 // redact, flag, block
    riskLevel: String,
    enabled: { type: Boolean, default: true }
  }],
  complianceFrameworks: [String],   // HIPAA, GDPR, PCI-DSS
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Policy', policySchema);
