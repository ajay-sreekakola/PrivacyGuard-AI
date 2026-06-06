/**
 * PrivacyGuard - Database Seed Script
 * Creates demo user + sample scans for quick evaluation
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Scan = require('./models/Scan');
const Policy = require('./models/Policy');
const AuditLog = require('./models/AuditLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/privacyguard';

const DEMO_USER = {
  name: 'Demo Admin',
  email: 'demo@privacyguard.ai',
  password: 'Demo@1234',
  organization: 'PrivacyGuard Demo Org',
  sector: 'healthcare',
  role: 'admin',
  settings: { sensitivityLevel: 'high', autoRedact: true, notifications: true }
};

const SAMPLE_SCANS = [
  {
    inputText: 'Patient John Doe (SSN: 123-45-6789) diagnosed with Type 2 Diabetes. Email: john@example.com',
    redactedText: 'Patient John Doe (SSN: [SSN_REDACTED]) diagnosed with Type 2 Diabetes. Email: [EMAIL_REDACTED]',
    riskScore: 75,
    riskLevel: 'critical',
    sector: 'healthcare',
    complianceFlags: ['HIPAA', 'GDPR'],
    processingTime: 312,
    status: 'completed',
    detections: [
      { type: 'SSN', category: 'PII', value: '123-45-6789', redacted: '[SSN_REDACTED]', confidence: 0.95, riskLevel: 'critical', label: 'Social Security Number' },
      { type: 'EMAIL', category: 'PII', value: 'john@example.com', redacted: '[EMAIL_REDACTED]', confidence: 0.95, riskLevel: 'high', label: 'Email Address' }
    ]
  },
  {
    inputText: 'Credit card: 4532-1234-5678-9012, billing to alice@corp.com, phone 555-867-5309',
    redactedText: 'Credit card: [CC_REDACTED], billing to [EMAIL_REDACTED], phone [PHONE_REDACTED]',
    riskScore: 90,
    riskLevel: 'critical',
    sector: 'finance',
    complianceFlags: ['PCI-DSS', 'GDPR'],
    processingTime: 289,
    status: 'completed',
    detections: [
      { type: 'CREDIT_CARD', category: 'FINANCIAL', value: '4532-1234-5678-9012', redacted: '[CC_REDACTED]', confidence: 0.98, riskLevel: 'critical', label: 'Credit Card Number' },
      { type: 'EMAIL', category: 'PII', value: 'alice@corp.com', redacted: '[EMAIL_REDACTED]', confidence: 0.95, riskLevel: 'high', label: 'Email Address' },
      { type: 'PHONE_US', category: 'PII', value: '555-867-5309', redacted: '[PHONE_REDACTED]', confidence: 0.92, riskLevel: 'medium', label: 'Phone Number' }
    ]
  },
  {
    inputText: 'API access key: sk-abc123def456ghi789. AWS key: AKIAIOSFODNN7EXAMPLE',
    redactedText: 'API access key: [API_KEY_REDACTED]. AWS key: [AWS_KEY_REDACTED]',
    riskScore: 100,
    riskLevel: 'critical',
    sector: 'general',
    complianceFlags: ['SOC2', 'ISO27001'],
    processingTime: 198,
    status: 'completed',
    detections: [
      { type: 'API_KEY', category: 'CREDENTIAL', value: 'sk-abc123def456ghi789', redacted: '[API_KEY_REDACTED]', confidence: 0.99, riskLevel: 'critical', label: 'API Key' },
      { type: 'AWS_KEY', category: 'CREDENTIAL', value: 'AKIAIOSFODNN7EXAMPLE', redacted: '[AWS_KEY_REDACTED]', confidence: 0.99, riskLevel: 'critical', label: 'AWS Access Key' }
    ]
  },
  {
    inputText: 'Meeting tomorrow with Bob at 192.168.1.1. His ZIP is 90210.',
    redactedText: 'Meeting tomorrow with Bob at [IP_REDACTED]. His ZIP is [ZIP_REDACTED].',
    riskScore: 20,
    riskLevel: 'low',
    sector: 'general',
    complianceFlags: ['GDPR'],
    processingTime: 145,
    status: 'completed',
    detections: [
      { type: 'IP_ADDRESS', category: 'PII', value: '192.168.1.1', redacted: '[IP_REDACTED]', confidence: 0.90, riskLevel: 'medium', label: 'IP Address' },
      { type: 'ZIP_CODE', category: 'PII', value: '90210', redacted: '[ZIP_REDACTED]', confidence: 0.75, riskLevel: 'low', label: 'ZIP Code' }
    ]
  },
  {
    inputText: 'Quarterly earnings report is confidential. Revenue: $4.2M. Do not share externally.',
    redactedText: 'Quarterly earnings report is confidential. Revenue: $4.2M. Do not share externally.',
    riskScore: 35,
    riskLevel: 'medium',
    sector: 'finance',
    complianceFlags: ['SOX'],
    processingTime: 420,
    status: 'completed',
    detections: [
      { type: 'CONTEXTUAL_FINANCIAL', category: 'CONTEXTUAL', value: 'confidential earnings', redacted: '[SENSITIVE_REDACTED]', confidence: 0.80, riskLevel: 'high', label: 'Confidential Financial Data' }
    ]
  }
];

const SAMPLE_POLICIES = [
  {
    name: 'HIPAA Safe Harbor Policy',
    description: 'Enforces removal of all 18 PHI identifiers per HIPAA Safe Harbor standard',
    sector: 'healthcare',
    complianceFrameworks: ['HIPAA', 'HITECH'],
    isActive: true,
    rules: [
      { type: 'regex', pattern: 'SSN|Social Security', action: 'redact', riskLevel: 'critical', enabled: true },
      { type: 'keyword', pattern: 'diagnosis|prescription|medication|patient', action: 'flag', riskLevel: 'high', enabled: true },
      { type: 'ai-contextual', pattern: 'medical conditions and PHI', action: 'redact', riskLevel: 'critical', enabled: true }
    ]
  },
  {
    name: 'PCI-DSS Cardholder Data Policy',
    description: 'Prevents payment card data from entering LLM prompts',
    sector: 'finance',
    complianceFrameworks: ['PCI-DSS', 'SOX'],
    isActive: true,
    rules: [
      { type: 'regex', pattern: 'credit card|card number|CVV|expiry', action: 'redact', riskLevel: 'critical', enabled: true },
      { type: 'regex', pattern: 'bank account|routing number|IBAN', action: 'redact', riskLevel: 'critical', enabled: true }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing demo data
    const existing = await User.findOne({ email: DEMO_USER.email });
    if (existing) {
      await Scan.deleteMany({ userId: existing._id });
      await Policy.deleteMany({ userId: existing._id });
      await AuditLog.deleteMany({ userId: existing._id });
      await User.deleteOne({ _id: existing._id });
      console.log('🗑️  Cleared existing demo data');
    }

    // Create demo user
    const user = await User.create(DEMO_USER);
    console.log(`👤 Created demo user: ${DEMO_USER.email} / ${DEMO_USER.password}`);

    // Create sample scans
    const scans = await Scan.insertMany(SAMPLE_SCANS.map(s => ({ ...s, userId: user._id })));
    console.log(`📊 Created ${scans.length} sample scans`);

    // Create policies
    const policies = await Policy.insertMany(SAMPLE_POLICIES.map(p => ({ ...p, userId: user._id })));
    console.log(`📋 Created ${policies.length} sample policies`);

    // Create audit logs
    await AuditLog.insertMany([
      { userId: user._id, action: 'LOGIN', ipAddress: '127.0.0.1', success: true },
      { userId: user._id, action: 'SCAN', scanId: scans[0]._id, ipAddress: '127.0.0.1', success: true },
      { userId: user._id, action: 'SCAN', scanId: scans[1]._id, ipAddress: '127.0.0.1', success: true },
      { userId: user._id, action: 'POLICY_CHANGE', ipAddress: '127.0.0.1', success: true }
    ]);
    console.log('📝 Created audit logs');

    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${DEMO_USER.email}`);
    console.log(`🔑 Password: ${DEMO_USER.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
