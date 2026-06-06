/**
 * PrivacyGuard AI Detection Engine
 * Multi-layer contextual privacy detection using regex + NLP + LLM
 */

const axios = require('axios');

// ─── PATTERN LIBRARY ──────────────────────────────────────────────────────────
const PATTERNS = {
  // PII Patterns
  EMAIL:        { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,           category: 'PII',       risk: 'high',    label: 'Email Address' },
  PHONE_US:     { regex: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,            category: 'PII',       risk: 'medium',  label: 'Phone Number' },
  SSN:          { regex: /\b\d{3}-\d{2}-\d{4}\b/g,                                           category: 'PII',       risk: 'critical', label: 'Social Security Number' },
  PASSPORT:     { regex: /\b[A-Z]{1,2}\d{6,9}\b/g,                                           category: 'PII',       risk: 'critical', label: 'Passport Number' },
  DOB:          { regex: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{4}|\d{2})\b/g, category: 'PII', risk: 'high',   label: 'Date of Birth' },
  IP_ADDRESS:   { regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,                                     category: 'PII',       risk: 'medium',  label: 'IP Address' },
  // Financial
  CREDIT_CARD:  { regex: /\b(?:\d[ -]?){13,16}\b/g,                                           category: 'FINANCIAL', risk: 'critical', label: 'Credit Card Number' },
  BANK_ACCOUNT: { regex: /\b[0-9]{8,17}\b(?=.*\b(account|acct|bank)\b)/gi,                   category: 'FINANCIAL', risk: 'critical', label: 'Bank Account' },
  IBAN:         { regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,             category: 'FINANCIAL', risk: 'critical', label: 'IBAN' },
  ROUTING:      { regex: /\b\d{9}\b(?=.*\b(routing|aba|transit)\b)/gi,                        category: 'FINANCIAL', risk: 'critical', label: 'Routing Number' },
  // Medical
  NPI:          { regex: /\bNPI[:\s#]*\d{10}\b/gi,                                            category: 'MEDICAL',   risk: 'critical', label: 'NPI Number' },
  ICD_CODE:     { regex: /\b[A-TV-Z][0-9][0-9AB]\.?[0-9A-TV-Z]{0,4}\b/g,                    category: 'MEDICAL',   risk: 'high',    label: 'ICD Medical Code' },
  MRN:          { regex: /\b(MRN|Medical Record)[:\s#]*[A-Z0-9]{6,12}\b/gi,                   category: 'MEDICAL',   risk: 'critical', label: 'Medical Record Number' },
  // Credentials
  API_KEY:      { regex: /\b(sk-|pk-|api_key|apikey)[A-Za-z0-9_\-]{20,}\b/gi,               category: 'CREDENTIAL',risk: 'critical', label: 'API Key' },
  AWS_KEY:      { regex: /\b(AKIA|ASIA|AROA)[A-Z0-9]{16}\b/g,                                category: 'CREDENTIAL',risk: 'critical', label: 'AWS Access Key' },
  JWT:          { regex: /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/g,      category: 'CREDENTIAL',risk: 'critical', label: 'JWT Token' },
  // Geographic
  ZIP_CODE:     { regex: /\b\d{5}(-\d{4})?\b/g,                                              category: 'PII',       risk: 'low',     label: 'ZIP Code' },
  ADDRESS:      { regex: /\b\d+\s+[A-Za-z\s]+(?:St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl)\b\.?/gi,   category: 'PII',       risk: 'medium',  label: 'Street Address' }
};

// ─── SECTOR-SPECIFIC KEYWORDS ─────────────────────────────────────────────────
const SECTOR_KEYWORDS = {
  healthcare: ['patient', 'diagnosis', 'prescription', 'medication', 'dosage', 'treatment', 'symptoms', 'prognosis', 'hipaa', 'phi', 'ehr', 'medical history', 'allergy', 'chronic', 'surgery'],
  finance: ['account balance', 'portfolio', 'trade secret', 'insider', 'quarterly earnings', 'revenue', 'merger', 'acquisition', 'confidential', 'proprietary', 'audit'],
  defense: ['classified', 'secret', 'top secret', 'clearance', 'mission', 'operation', 'tactical', 'intelligence', 'restricted', 'compartmented', 'noforn'],
  legal: ['privileged', 'attorney-client', 'confidential settlement', 'deposition', 'subpoena', 'injunction', 'trade secret', 'nda']
};

// ─── COMPLIANCE FRAMEWORK MAPPING ─────────────────────────────────────────────
const COMPLIANCE_MAP = {
  PII:        ['GDPR', 'CCPA'],
  MEDICAL:    ['HIPAA', 'HITECH', 'GDPR'],
  FINANCIAL:  ['PCI-DSS', 'SOX', 'GLBA', 'GDPR'],
  CREDENTIAL: ['SOC2', 'ISO27001', 'NIST'],
  defense:    ['ITAR', 'CMMC', 'FedRAMP']
};

// ─── REDACTION TOKENS ─────────────────────────────────────────────────────────
const REDACT_TOKENS = {
  EMAIL:        '[EMAIL_REDACTED]',
  PHONE_US:     '[PHONE_REDACTED]',
  SSN:          '[SSN_REDACTED]',
  PASSPORT:     '[PASSPORT_REDACTED]',
  DOB:          '[DOB_REDACTED]',
  IP_ADDRESS:   '[IP_REDACTED]',
  CREDIT_CARD:  '[CC_REDACTED]',
  BANK_ACCOUNT: '[BANK_ACCT_REDACTED]',
  IBAN:         '[IBAN_REDACTED]',
  ROUTING:      '[ROUTING_REDACTED]',
  NPI:          '[NPI_REDACTED]',
  ICD_CODE:     '[MEDICAL_CODE_REDACTED]',
  MRN:          '[MRN_REDACTED]',
  API_KEY:      '[API_KEY_REDACTED]',
  AWS_KEY:      '[AWS_KEY_REDACTED]',
  JWT:          '[JWT_REDACTED]',
  ZIP_CODE:     '[ZIP_REDACTED]',
  ADDRESS:      '[ADDRESS_REDACTED]',
  CONTEXTUAL:   '[SENSITIVE_REDACTED]'
};

// ─── RISK SCORING ─────────────────────────────────────────────────────────────
const RISK_WEIGHTS = { critical: 40, high: 20, medium: 10, low: 5 };

function calculateRiskScore(detections) {
  let score = 0;
  const seen = new Set();
  for (const d of detections) {
    const key = d.type;
    if (!seen.has(key)) { score += RISK_WEIGHTS[d.riskLevel] || 5; seen.add(key); }
    else score += 2;
  }
  return Math.min(score, 100);
}

function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

// ─── LAYER 1: REGEX PATTERN SCAN ─────────────────────────────────────────────
function regexScan(text) {
  const detections = [];
  for (const [type, config] of Object.entries(PATTERNS)) {
    const regex = new RegExp(config.regex.source, config.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      detections.push({
        type,
        category: config.category,
        value: match[0],
        redacted: REDACT_TOKENS[type] || '[REDACTED]',
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.95,
        riskLevel: config.risk,
        context: text.substring(Math.max(0, match.index - 30), match.index + match[0].length + 30),
        label: config.label
      });
    }
  }
  return detections;
}

// ─── LAYER 2: KEYWORD CONTEXTUAL SCAN ────────────────────────────────────────
function keywordScan(text, sector) {
  const flags = [];
  const keywords = SECTOR_KEYWORDS[sector] || [];
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) flags.push(kw);
  }
  return flags;
}

// ─── LAYER 3: AI CONTEXTUAL ANALYSIS ─────────────────────────────────────────
async function aiContextualAnalysis(text, sector) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { detections: [], summary: 'AI analysis unavailable - no API key' };

  const prompt = `You are a data privacy expert analyzing text for an enterprise ${sector} organization.

Analyze the following text for ANY sensitive information that could cause harm if exposed to an LLM. Look beyond obvious PII to find:
1. Contextual sensitive info (e.g., implied medical conditions, financial status, behavioral patterns)
2. Aggregation risks (combinations that reveal more than individual pieces)
3. Inference risks (information that could enable re-identification)
4. Sector-specific confidential data (${sector} industry secrets, proprietary processes)
5. Embedded sensitive data in seemingly innocent text

TEXT TO ANALYZE:
"""
${text.substring(0, 2000)}
"""

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "contextualRisks": [
    {
      "type": "CONTEXTUAL_<CATEGORY>",
      "description": "what was found",
      "riskLevel": "low|medium|high|critical",
      "snippet": "the sensitive text fragment",
      "reason": "why this is risky",
      "compliance": ["applicable frameworks"]
    }
  ],
  "aggregationRisk": "none|low|medium|high|critical",
  "aggregationReason": "explanation if risk exists",
  "overallContextualRisk": "low|medium|high|critical",
  "recommendation": "brief action recommendation"
}`;

  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });

    const raw = response.data.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('AI analysis error:', err.message);
    return { contextualRisks: [], aggregationRisk: 'unknown', overallContextualRisk: 'unknown' };
  }
}

// ─── REDACTION ENGINE ─────────────────────────────────────────────────────────
function redactText(text, detections) {
  // Sort by position descending to avoid offset issues
  const sorted = [...detections]
    .filter(d => d.position)
    .sort((a, b) => b.position.start - a.position.start);

  let redacted = text;
  for (const d of sorted) {
    redacted = redacted.substring(0, d.position.start) + d.redacted + redacted.substring(d.position.end);
  }
  return redacted;
}

// ─── COMPLIANCE FLAGS ─────────────────────────────────────────────────────────
function getComplianceFlags(detections, sector) {
  const flags = new Set();
  for (const d of detections) {
    const fw = COMPLIANCE_MAP[d.category] || [];
    fw.forEach(f => flags.add(f));
  }
  if (sector === 'defense') COMPLIANCE_MAP.defense.forEach(f => flags.add(f));
  return [...flags];
}

// ─── MAIN SCAN FUNCTION ───────────────────────────────────────────────────────
async function performScan(text, sector = 'general', useAI = true) {
  const start = Date.now();

  // Layer 1: Regex
  const regexDetections = regexScan(text);

  // Layer 2: Keywords
  const contextualKeywords = keywordScan(text, sector);

  // Layer 3: AI (if enabled)
  let aiAnalysis = { contextualRisks: [], aggregationRisk: 'none' };
  if (useAI && text.length > 20) {
    aiAnalysis = await aiContextualAnalysis(text, sector);
  }

  // Merge AI contextual detections
  const aiDetections = (aiAnalysis.contextualRisks || []).map(r => ({
    type: r.type || 'CONTEXTUAL',
    category: 'CONTEXTUAL',
    value: r.snippet || '',
    redacted: REDACT_TOKENS.CONTEXTUAL,
    position: null,
    confidence: 0.85,
    riskLevel: r.riskLevel || 'medium',
    context: r.description,
    label: r.description,
    reason: r.reason,
    compliance: r.compliance
  }));

  const allDetections = [...regexDetections, ...aiDetections];

  // Redact
  const redactedText = redactText(text, regexDetections); // Only regex has positions

  // Score
  const riskScore = calculateRiskScore(allDetections);
  const riskLevel = getRiskLevel(riskScore);
  const complianceFlags = getComplianceFlags(allDetections, sector);

  return {
    detections: allDetections,
    redactedText,
    riskScore,
    riskLevel,
    complianceFlags,
    contextualKeywords,
    aiAnalysis,
    processingTime: Date.now() - start,
    stats: {
      totalDetections: allDetections.length,
      byCategory: allDetections.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1; return acc;
      }, {}),
      bySeverity: allDetections.reduce((acc, d) => {
        acc[d.riskLevel] = (acc[d.riskLevel] || 0) + 1; return acc;
      }, {})
    }
  };
}

module.exports = { performScan, redactText, regexScan, aiContextualAnalysis };
