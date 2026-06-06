/**
 * PrivacyGuard - NLP Entity Recognition Service
 * Rule-based NER for detecting named entities without external dependencies
 * Augments regex detection with linguistic pattern matching
 */

// ─── PERSON NAME DETECTION ────────────────────────────────────────────────────
const NAME_PREFIXES = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'rev', 'gen', 'col', 'capt', 'sgt', 'cpl', 'pvt', 'sir', 'lady', 'lord']);
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'esq', 'dds', 'rn', 'cpa']);
const COMMON_WORDS = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'via', 'per', 're', 'in', 'on', 'at', 'to', 'of', 'by', 'as', 'an', 'be', 'do', 'go', 'he', 'if', 'is', 'it', 'me', 'my', 'no', 'or', 'so', 'up', 'us', 'we', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december']);

// Detect person names using prefix + capitalized word patterns
function detectPersonNames(text) {
  const entities = [];
  const words = text.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z'-]/g, '');
    const lower = word.toLowerCase();

    if (NAME_PREFIXES.has(lower) && i + 1 < words.length) {
      // "Dr. John Smith" pattern
      const nextWords = [];
      let j = i + 1;
      while (j < words.length && j <= i + 3) {
        const next = words[j].replace(/[^a-zA-Z'-]/g, '');
        if (next && /^[A-Z]/.test(next) && !COMMON_WORDS.has(next.toLowerCase())) {
          nextWords.push(next);
          j++;
        } else break;
      }
      if (nextWords.length > 0) {
        const fullName = `${words[i]} ${nextWords.join(' ')}`;
        entities.push({ text: fullName, type: 'PERSON_NAME', confidence: 0.85, start: text.indexOf(fullName) });
      }
    }

    // Detect "FirstName LastName" patterns (two consecutive capitalized non-common words)
    if (/^[A-Z][a-z]{1,}$/.test(word) && !COMMON_WORDS.has(lower) && i + 1 < words.length) {
      const nextWord = words[i + 1].replace(/[^a-zA-Z'-]/g, '');
      if (/^[A-Z][a-z]{1,}$/.test(nextWord) && !COMMON_WORDS.has(nextWord.toLowerCase())) {
        const fullName = `${word} ${nextWord}`;
        const idx = text.indexOf(fullName);
        if (idx >= 0 && !entities.some(e => e.start === idx)) {
          entities.push({ text: fullName, type: 'PERSON_NAME', confidence: 0.65, start: idx });
        }
      }
    }
  }
  return entities;
}

// ─── ORGANIZATION DETECTION ───────────────────────────────────────────────────
const ORG_SUFFIXES = new Set(['inc', 'llc', 'ltd', 'corp', 'co', 'company', 'corporation', 'limited', 'associates', 'group', 'holdings', 'partners', 'services', 'solutions', 'technologies', 'systems', 'industries', 'enterprises', 'foundation', 'institute', 'authority', 'agency', 'department', 'ministry', 'bureau', 'commission', 'council', 'hospital', 'clinic', 'medical center', 'university', 'college', 'school', 'bank', 'trust', 'insurance', 'health']);

function detectOrganizations(text) {
  const entities = [];
  const orgPattern = /\b([A-Z][A-Za-z\s&]+(?:Inc|LLC|Ltd|Corp|Co|Company|Corporation|Limited|Associates|Group|Holdings|Partners|Services|Solutions|Technologies|Systems|Industries|Enterprises|Foundation|Institute|Authority|Agency|Department|Hospital|Clinic|University|College|Bank|Trust)\.?)\b/g;

  let match;
  while ((match = orgPattern.exec(text)) !== null) {
    entities.push({
      text: match[1],
      type: 'ORGANIZATION',
      confidence: 0.80,
      start: match.index,
      end: match.index + match[1].length
    });
  }
  return entities;
}

// ─── MEDICAL ENTITY DETECTION ─────────────────────────────────────────────────
const MEDICAL_TERMS = new Set([
  'diagnosis', 'prognosis', 'prescription', 'medication', 'treatment', 'therapy',
  'surgery', 'procedure', 'symptom', 'condition', 'disease', 'disorder', 'syndrome',
  'allergy', 'chronic', 'acute', 'malignant', 'benign', 'positive', 'negative',
  'dosage', 'dose', 'mg', 'ml', 'tablet', 'capsule', 'injection', 'infusion',
  'hiv', 'aids', 'cancer', 'tumor', 'diabetes', 'hypertension', 'depression',
  'anxiety', 'schizophrenia', 'bipolar', 'adhd', 'autism', 'dementia', 'alzheimer',
  'hepatitis', 'tuberculosis', 'covid', 'sepsis', 'stroke', 'heart attack', 'mi'
]);

function detectMedicalEntities(text) {
  const lower = text.toLowerCase();
  const entities = [];

  for (const term of MEDICAL_TERMS) {
    let idx = lower.indexOf(term);
    while (idx !== -1) {
      // Check it's not part of a larger word
      const before = idx === 0 || /\W/.test(lower[idx - 1]);
      const after = idx + term.length >= lower.length || /\W/.test(lower[idx + term.length]);
      if (before && after) {
        entities.push({
          text: text.substring(idx, idx + term.length),
          type: 'MEDICAL_TERM',
          confidence: 0.90,
          start: idx,
          end: idx + term.length,
          sensitive: ['hiv', 'aids', 'cancer', 'depression', 'bipolar', 'schizophrenia', 'hepatitis'].includes(term)
        });
      }
      idx = lower.indexOf(term, idx + 1);
    }
  }
  return entities;
}

// ─── FINANCIAL ENTITY DETECTION ──────────────────────────────────────────────
function detectFinancialEntities(text) {
  const entities = [];

  // Currency amounts
  const currencyPattern = /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|M|B|K))?\b|\b[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY)\b/gi;
  let match;
  while ((match = currencyPattern.exec(text)) !== null) {
    entities.push({ text: match[0], type: 'FINANCIAL_AMOUNT', confidence: 0.85, start: match.index });
  }

  // Account references
  const accountPattern = /\b(?:account|acct|acc)\s*(?:number|no|#)?\s*:?\s*[\d\-]{6,20}\b/gi;
  while ((match = accountPattern.exec(text)) !== null) {
    entities.push({ text: match[0], type: 'ACCOUNT_REFERENCE', confidence: 0.90, start: match.index });
  }

  return entities;
}

// ─── SENSITIVE CONTEXT DETECTOR ───────────────────────────────────────────────
// Detects when sensitive information is implied by context even if not explicit
function detectSensitiveContext(text) {
  const lower = text.toLowerCase();
  const contextualRisks = [];

  const contextPatterns = [
    {
      pattern: /\b(?:patient|client|customer|employee)\s+(?:number|id|#)\s*:?\s*[A-Z0-9\-]{4,}/gi,
      type: 'IMPLICIT_ID', risk: 'high', description: 'Implicit identifier linking real person to data'
    },
    {
      pattern: /\b(?:tested positive|diagnosed with|suffers from|living with|prescribed)\b/gi,
      type: 'HEALTH_DISCLOSURE', risk: 'critical', description: 'Medical condition disclosure'
    },
    {
      pattern: /\b(?:fired|terminated|laid off|dismissed)\s+(?:from|by)\b/gi,
      type: 'EMPLOYMENT_STATUS', risk: 'medium', description: 'Employment status disclosure'
    },
    {
      pattern: /\b(?:arrested|convicted|charged with|pleaded guilty|on probation)\b/gi,
      type: 'CRIMINAL_RECORD', risk: 'critical', description: 'Criminal record information'
    },
    {
      pattern: /\b(?:bankruptcy|insolvent|foreclosure|debt collection|creditor)\b/gi,
      type: 'FINANCIAL_DISTRESS', risk: 'high', description: 'Financial distress indicator'
    },
    {
      pattern: /\b(?:immigration status|undocumented|visa|deportation|asylum)\b/gi,
      type: 'IMMIGRATION_STATUS', risk: 'critical', description: 'Immigration status disclosure'
    },
    {
      pattern: /\b(?:religion|religious|faith|worship|mosque|church|synagogue|temple)\b/gi,
      type: 'RELIGIOUS_AFFILIATION', risk: 'medium', description: 'Religious affiliation disclosure'
    },
    {
      pattern: /\b(?:union member|strike|collective bargaining|labor dispute)\b/gi,
      type: 'UNION_MEMBERSHIP', risk: 'medium', description: 'Union membership indicator'
    }
  ];

  for (const { pattern, type, risk, description } of contextPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      contextualRisks.push({
        text: match[0],
        type,
        riskLevel: risk,
        description,
        start: match.index,
        confidence: 0.80
      });
    }
  }

  return contextualRisks;
}

// ─── MAIN NLP SCAN ────────────────────────────────────────────────────────────
function nlpScan(text) {
  const persons = detectPersonNames(text);
  const orgs = detectOrganizations(text);
  const medical = detectMedicalEntities(text);
  const financial = detectFinancialEntities(text);
  const contextual = detectSensitiveContext(text);

  const allEntities = [
    ...persons.map(e => ({ ...e, category: 'PII', riskLevel: 'medium', redacted: '[PERSON_NAME_REDACTED]' })),
    ...orgs.map(e => ({ ...e, category: 'ORGANIZATIONAL', riskLevel: 'low', redacted: '[ORG_REDACTED]' })),
    ...medical.filter(e => e.sensitive).map(e => ({ ...e, category: 'MEDICAL', riskLevel: 'critical', redacted: '[MEDICAL_INFO_REDACTED]' })),
    ...medical.filter(e => !e.sensitive).map(e => ({ ...e, category: 'MEDICAL', riskLevel: 'medium', redacted: '[MEDICAL_TERM_REDACTED]' })),
    ...financial.map(e => ({ ...e, category: 'FINANCIAL', riskLevel: 'high', redacted: '[FINANCIAL_REDACTED]' })),
    ...contextual.map(e => ({ ...e, category: 'CONTEXTUAL', redacted: '[CONTEXTUAL_INFO_REDACTED]' }))
  ];

  // Deduplicate overlapping detections
  const deduplicated = allEntities.filter((entity, idx) => {
    return !allEntities.some((other, otherIdx) =>
      otherIdx !== idx &&
      other.start <= entity.start &&
      (other.start + other.text.length) >= (entity.start + entity.text.length) &&
      otherIdx < idx
    );
  });

  return {
    entities: deduplicated,
    summary: {
      persons: persons.length,
      organizations: orgs.length,
      medicalTerms: medical.length,
      financialEntities: financial.length,
      contextualRisks: contextual.length,
      total: deduplicated.length
    }
  };
}

module.exports = { nlpScan, detectPersonNames, detectOrganizations, detectMedicalEntities, detectFinancialEntities, detectSensitiveContext };
