const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },   // SCAN, REDACT, LOGIN, POLICY_CHANGE
  resource: String,
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan' },
  ipAddress: String,
  userAgent: String,
  details: { type: Map, of: mongoose.Schema.Types.Mixed },
  success: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditSchema);
