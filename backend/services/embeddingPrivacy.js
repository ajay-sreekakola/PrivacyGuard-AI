/**
 * PrivacyGuard - Embedding Privacy Service
 * Protects sensitive data in vector embedding pipelines (RAG, semantic search, etc.)
 * Implements: anonymization, differential privacy noise, and token substitution
 */

const crypto = require('crypto');

// ─── PSEUDONYMIZATION VAULT ────────────────────────────────────────────────────
// Maps real values to consistent pseudonyms within a session
class PseudonymVault {
  constructor(secret) {
    this.secret = secret || crypto.randomBytes(32).toString('hex');
    this.vault = new Map();
    this.reverseVault = new Map();
  }

  pseudonymize(value, category) {
    const key = `${category}:${value}`;
    if (this.vault.has(key)) return this.vault.get(key);

    const hash = crypto.createHmac('sha256', this.secret)
      .update(key).digest('hex').substring(0, 8).toUpperCase();

    const prefixes = {
      PERSON: 'PERSON', EMAIL: 'USER', PHONE: 'PHONE',
      ORG: 'ORG', LOCATION: 'LOC', MEDICAL: 'PATIENT', FINANCIAL: 'ACCT'
    };
    const prefix = prefixes[category] || 'ENTITY';
    const pseudonym = `[${prefix}_${hash}]`;

    this.vault.set(key, pseudonym);
    this.reverseVault.set(pseudonym, { value, category });
    return pseudonym;
  }

  dePseudonymize(pseudonym) {
    return this.reverseVault.get(pseudonym) || null;
  }

  exportVault() {
    return {
      mappings: Object.fromEntries(this.vault),
      createdAt: new Date().toISOString()
    };
  }
}

// ─── DIFFERENTIAL PRIVACY ─────────────────────────────────────────────────────
// Adds calibrated noise to numerical values to prevent exact reconstruction
function addLaplaceNoise(value, sensitivity = 1.0, epsilon = 1.0) {
  const scale = sensitivity / epsilon;
  const u = Math.random() - 0.5;
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return value + noise;
}

function privatizeNumber(value, epsilon = 0.5) {
  if (typeof value !== 'number') return value;
  const noise = addLaplaceNoise(value, Math.abs(value) * 0.01 || 1, epsilon);
  return Math.round(noise * 100) / 100;
}

// ─── TEXT GENERALIZATION ──────────────────────────────────────────────────────
// Generalizes specific values to ranges/categories (k-anonymity style)
function generalizeAge(age) {
  if (age < 18) return 'minor';
  if (age < 30) return 'adult-young';
  if (age < 50) return 'adult-middle';
  if (age < 65) return 'adult-senior';
  return 'elderly';
}

function generalizeLocation(location) {
  // Reduce ZIP to 3-digit prefix (HIPAA Safe Harbor)
  const zipMatch = location.match(/\b(\d{5})\b/);
  if (zipMatch) return location.replace(zipMatch[0], zipMatch[1].substring(0, 3) + 'XX');
  return location;
}

function generalizeSalary(salary) {
  const ranges = [
    [0, 30000, 'under $30k'], [30000, 60000, '$30k-$60k'],
    [60000, 100000, '$60k-$100k'], [100000, 200000, '$100k-$200k'],
    [200000, Infinity, 'over $200k']
  ];
  for (const [min, max, label] of ranges) {
    if (salary >= min && salary < max) return label;
  }
  return 'undisclosed';
}

// ─── EMBEDDING SANITIZER ──────────────────────────────────────────────────────
// Removes/masks sensitive tokens before creating embeddings
function sanitizeForEmbedding(text, options = {}) {
  const {
    pseudonymize = true,
    generalize = true,
    vault = new PseudonymVault(),
    aggressiveness = 'medium' // low, medium, high
  } = options;

  let sanitized = text;
  const modifications = [];

  // Pattern-based replacement with pseudonymization
  const patterns = [
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, category: 'EMAIL' },
    { regex: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, category: 'PHONE' },
    { regex: /\b\d{3}-\d{2}-\d{4}\b/g, category: 'SSN' },
    { regex: /\b(?:\d[ -]?){13,16}\b/g, category: 'FINANCIAL' },
  ];

  if (aggressiveness === 'high') {
    // Also pseudonymize proper nouns (simplified)
    patterns.push({ regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, category: 'PERSON' });
  }

  for (const { regex, category } of patterns) {
    sanitized = sanitized.replace(regex, (match) => {
      const pseudo = pseudonymize ? vault.pseudonymize(match, category) : `[${category}]`;
      modifications.push({ original: match, replacement: pseudo, category });
      return pseudo;
    });
  }

  // Generalize age mentions
  if (generalize) {
    sanitized = sanitized.replace(/\b(\d{1,3})[- ]?(?:year[s]?[- ]?old|yr[s]?[- ]?old)\b/gi, (match, age) => {
      const generalized = generalizeAge(parseInt(age));
      modifications.push({ original: match, replacement: generalized, category: 'AGE' });
      return generalized;
    });

    // Generalize ZIP codes
    sanitized = sanitized.replace(/\b\d{5}(-\d{4})?\b/g, (match) => {
      const generalized = match.substring(0, 3) + 'XX';
      modifications.push({ original: match, replacement: generalized, category: 'ZIP' });
      return generalized;
    });
  }

  return { sanitized, modifications, vault };
}

// ─── CHUNK PRIVACY ANALYZER ───────────────────────────────────────────────────
// Analyzes text chunks for RAG pipelines before storing in vector DB
function analyzeChunkPrivacy(chunks) {
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,                    // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b(?:\d[ -]?){13,16}\b/,                    // Credit card
    /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,               // AWS keys
    /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/     // JWT
  ];

  return chunks.map((chunk, index) => {
    const hasSensitiveData = sensitivePatterns.some(p => p.test(chunk));
    const riskScore = sensitivePatterns.filter(p => p.test(chunk)).length * 20;

    return {
      index,
      chunk: chunk.substring(0, 50) + '...',
      hasSensitiveData,
      riskScore: Math.min(riskScore, 100),
      recommendation: hasSensitiveData ? 'sanitize_before_embedding' : 'safe_to_embed'
    };
  });
}

// ─── METADATA STRIPPER ────────────────────────────────────────────────────────
// Removes metadata that could re-identify anonymized data
function stripMetadata(document) {
  const sensitiveMetadataKeys = [
    'author', 'creator', 'email', 'phone', 'ssn', 'user_id',
    'patient_id', 'account_number', 'ip_address', 'location',
    'device_id', 'session_id', 'fingerprint'
  ];

  if (typeof document !== 'object' || !document) return document;

  const cleaned = { ...document };
  for (const key of Object.keys(cleaned)) {
    if (sensitiveMetadataKeys.some(sk => key.toLowerCase().includes(sk))) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

// ─── PRIVACY BUDGET TRACKER ───────────────────────────────────────────────────
// Tracks differential privacy budget consumption
class PrivacyBudgetTracker {
  constructor(totalBudget = 10.0) {
    this.totalBudget = totalBudget;
    this.consumed = 0;
    this.operations = [];
  }

  consume(epsilon, operation = 'query') {
    if (this.consumed + epsilon > this.totalBudget) {
      throw new Error(`Privacy budget exceeded. Consumed: ${this.consumed}, Budget: ${this.totalBudget}`);
    }
    this.consumed += epsilon;
    this.operations.push({ operation, epsilon, timestamp: new Date(), remaining: this.totalBudget - this.consumed });
    return { success: true, remaining: this.totalBudget - this.consumed };
  }

  getStatus() {
    return {
      totalBudget: this.totalBudget,
      consumed: this.consumed,
      remaining: this.totalBudget - this.consumed,
      percentUsed: (this.consumed / this.totalBudget) * 100,
      operations: this.operations
    };
  }

  reset() {
    this.consumed = 0;
    this.operations = [];
  }
}

// ─── PIPELINE PRIVACY WRAPPER ─────────────────────────────────────────────────
// High-level wrapper for protecting entire AI pipelines
async function protectPipeline(inputData, pipelineConfig = {}) {
  const {
    sector = 'general',
    enablePseudonymization = true,
    enableDifferentialPrivacy = false,
    enableChunkAnalysis = false,
    privacyLevel = 'medium'  // low, medium, high, maximum
  } = pipelineConfig;

  const startTime = Date.now();
  const vault = new PseudonymVault();
  const report = {
    inputSize: JSON.stringify(inputData).length,
    modifications: [],
    privacyScore: 100,
    processingTime: 0,
    warnings: []
  };

  let processed = inputData;

  // Handle string input
  if (typeof processed === 'string') {
    const { sanitized, modifications } = sanitizeForEmbedding(processed, {
      pseudonymize: enablePseudonymization,
      vault,
      aggressiveness: privacyLevel === 'maximum' ? 'high' : privacyLevel === 'high' ? 'medium' : 'low'
    });
    processed = sanitized;
    report.modifications = modifications;
    report.privacyScore = Math.max(0, 100 - modifications.length * 10);
  }

  // Handle array of chunks
  if (Array.isArray(processed) && enableChunkAnalysis) {
    const chunkAnalysis = analyzeChunkPrivacy(processed.map(c => typeof c === 'string' ? c : JSON.stringify(c)));
    report.chunkAnalysis = chunkAnalysis;
    report.warnings = chunkAnalysis.filter(c => c.hasSensitiveData).map(c => `Chunk ${c.index} contains sensitive data`);
  }

  // Strip metadata from objects
  if (typeof processed === 'object' && !Array.isArray(processed)) {
    processed = stripMetadata(processed);
  }

  report.processingTime = Date.now() - startTime;
  report.vaultSize = vault.vault.size;

  return {
    protectedData: processed,
    report,
    vault: enablePseudonymization ? vault.exportVault() : null
  };
}

module.exports = {
  PseudonymVault,
  PrivacyBudgetTracker,
  sanitizeForEmbedding,
  analyzeChunkPrivacy,
  stripMetadata,
  protectPipeline,
  addLaplaceNoise,
  privatizeNumber,
  generalizeAge,
  generalizeLocation
};
