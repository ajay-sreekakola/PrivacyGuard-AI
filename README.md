# 🛡️ PrivacyGuard AI

**Contextual Data Privacy for LLM Pipelines**

PrivacyGuard AI is a full-stack MERN application that protects sensitive data throughout AI-driven systems — from prompt injection to RAG pipelines — using a multi-layer detection engine combining regex, NLP, and LLM-based contextual analysis.

---

## 🚀 Features

### Core Privacy Engine (3 Layers)
| Layer | Method | What It Catches |
|-------|--------|-----------------|
| **Layer 1** | Regex patterns | SSN, emails, credit cards, API keys, IBANs, NPI, MRN, JWTs, IPs, DOBs |
| **Layer 2** | NLP keyword matching | Medical terms, financial disclosures, sector-specific confidential data |
| **Layer 3** | AI contextual analysis | Aggregation risks, inference risks, re-identification, implied disclosures |

### Application Features
- 🔍 **Privacy Scanner** — Paste any text; get instant multi-layer risk assessment + auto-redacted output
- 🤖 **Safe LLM Proxy** — Send prompts through PrivacyGuard BEFORE they reach Claude/ChatGPT; response is also scanned
- 🗄️ **Embedding Privacy** — Protect data in RAG/vector DB pipelines (pseudonymization, chunk analysis, differential privacy)
- 📊 **Compliance Reports** — Auto-generate HIPAA, GDPR, PCI-DSS, ITAR, SOC2 reports per scan or date range
- 📋 **Policy Engine** — Custom detection rules per sector with compliance framework tagging
- 📝 **Audit Logs** — Tamper-evident activity trail for compliance officers
- 📈 **Analytics Dashboard** — Risk trends, detection breakdown, compliance coverage
- 🔑 **API Key Access** — Integrate PrivacyGuard into any pipeline via REST API

### Supported Compliance Frameworks
`HIPAA` `GDPR` `CCPA` `PCI-DSS` `SOX` `GLBA` `ITAR` `CMMC` `FedRAMP` `SOC2` `ISO27001` `NIST`

### Supported Sectors
`Healthcare` `Finance` `Defense` `Legal` `General`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Dashboard · Scanner · Safe Proxy · Embedding · Reports │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────────────┐
│                  Express Backend                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Privacy Engine (3-Layer)                │    │
│  │  Layer 1: Regex Patterns (20+ types)            │    │
│  │  Layer 2: NLP Entity Recognition                │    │
│  │  Layer 3: Claude AI Contextual Analysis         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Embedding Service · Compliance Reporter · Audit Logger  │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   MongoDB                                 │
│         Users · Scans · Policies · AuditLogs            │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Anthropic API key (optional — Layer 3 AI analysis)

### 1. Clone and install

```bash
git clone <repo-url>
cd privacyguard

# Backend
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/privacyguard
JWT_SECRET=your_super_secret_key_here
ANTHROPIC_API_KEY=sk-ant-...        # Get from console.anthropic.com
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Seed demo data (optional)

```bash
cd backend
node seed.js
# Creates demo@privacyguard.ai / Demo@1234
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start
```

Open **http://localhost:3000**

---

## 🐳 Docker Deployment

```bash
# Copy and configure env
cp backend/.env.example .env
# Edit .env with your keys

# Build and start all services
docker-compose up --build

# Seed demo data
docker-compose exec backend node seed.js
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

---

## 🔌 REST API

All endpoints require `Authorization: Bearer <token>` except auth routes.

### Authentication
```
POST /api/auth/register    { name, email, password, organization, sector }
POST /api/auth/login       { email, password }
GET  /api/auth/me
```

### Privacy Scanning
```
POST /api/scan/analyze     { text, sector, useAI, saveResult }
GET  /api/scan/history     ?page=1&limit=20&riskLevel=&sector=
GET  /api/scan/:id
DELETE /api/scan/:id
```

### Safe LLM Proxy
```
POST /api/redact/safe-prompt  { prompt, systemPrompt, sector, model }
POST /api/redact/batch        { texts[], sector }
```

### Embedding Privacy
```
POST /api/embedding/protect          { data, pipelineConfig }
POST /api/embedding/analyze-chunks   { chunks[] }
POST /api/embedding/pseudonymize     { text, aggressiveness }
```

### Compliance Reports
```
GET  /api/compliance/scan/:id
POST /api/compliance/aggregate    { from, to, sector }
GET  /api/compliance/scan/:id/text
```

### Dashboard & Audit
```
GET /api/dashboard/stats
GET /api/audit?action=SCAN&limit=50
```

### Settings
```
GET    /api/settings/profile
PATCH  /api/settings/profile
POST   /api/settings/change-password
POST   /api/settings/api-key
DELETE /api/settings/api-key
DELETE /api/settings/account
```

---

## 🔒 Detected Entity Types

| Type | Category | Risk | Example |
|------|----------|------|---------|
| SSN | PII | Critical | `123-45-6789` |
| EMAIL | PII | High | `user@example.com` |
| PHONE | PII | Medium | `555-867-5309` |
| CREDIT_CARD | Financial | Critical | `4532-1234-5678-9012` |
| BANK_ACCOUNT | Financial | Critical | `Account #78234` |
| IBAN | Financial | Critical | `GB29 NWBK...` |
| NPI | Medical | Critical | `NPI: 1234567890` |
| MRN | Medical | Critical | `MRN: MED-892341` |
| ICD_CODE | Medical | High | `E11.9` |
| API_KEY | Credential | Critical | `sk-abc123...` |
| AWS_KEY | Credential | Critical | `AKIA...` |
| JWT | Credential | Critical | `eyJ...` |
| IP_ADDRESS | PII | Medium | `192.168.1.1` |
| DOB | PII | High | `01/15/1982` |
| PASSPORT | PII | Critical | `A1234567` |
| ADDRESS | PII | Medium | `742 Evergreen Terrace` |

Plus AI-detected: contextual disclosures, aggregation risks, re-identification risks, sector-specific confidential data.

---

## 📁 Project Structure

```
privacyguard/
├── backend/
│   ├── models/          # Mongoose schemas (User, Scan, Policy, AuditLog)
│   ├── routes/          # Express routers (auth, scan, redact, compliance...)
│   ├── services/
│   │   ├── privacyEngine.js      # Core 3-layer detection engine
│   │   ├── nlpService.js         # NLP entity recognition
│   │   ├── embeddingPrivacy.js   # RAG/vector DB protection
│   │   └── complianceReporter.js # Compliance report generator
│   ├── middleware/
│   │   └── auth.js      # JWT authentication middleware
│   ├── server.js        # Express app entry point
│   ├── seed.js          # Demo data seeder
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/       # Dashboard, Scanner, SafePrompt, Reports...
│   │   ├── components/  # Layout, RiskBadge, StatCard, RiskMeter...
│   │   ├── context/     # AuthContext
│   │   └── utils/       # API client
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## 🧠 AI Integration

PrivacyGuard uses Claude (`claude-sonnet-4-20250514`) for Layer 3 contextual analysis. It specifically detects:

- **Aggregation risk** — when combining non-sensitive pieces reveals sensitive data
- **Inference risk** — information that enables re-identification of anonymized data
- **Implied disclosures** — health conditions, financial distress, immigration status implied by context
- **Sector-specific risks** — insider trading signals, PHI patterns, classified info indicators

The AI prompt is carefully engineered to return structured JSON and never echoes the original sensitive data back.

---

## 🛡️ Security Features

- JWT authentication with 7-day expiry
- Bcrypt password hashing (12 rounds)
- Rate limiting (300 req/15min)
- Helmet.js security headers
- Input validation and sanitization
- All operations logged to tamper-evident audit trail
- API keys use crypto.randomBytes(32)

---

## 📄 License

MIT — free to use, modify, and distribute.

---

**Built with:** MongoDB · Express.js · React · Node.js · Claude AI · Recharts · Lucide Icons
