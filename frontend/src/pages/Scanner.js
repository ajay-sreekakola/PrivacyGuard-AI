import React, { useState } from 'react';
import api from '../utils/api';
import { ScanLine, AlertTriangle, Shield, CheckCircle, Copy, Download, ChevronDown, ChevronUp, Zap, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

const SAMPLE_TEXTS = {
  healthcare: `Patient John Smith (DOB: 03/15/1982, SSN: 456-78-9012, MRN: MED-892341) was admitted on March 10, 2024 for acute myocardial infarction. 
His primary physician Dr. Sarah Johnson (NPI: 1234567890) prescribed Metoprolol 25mg BID. 
Patient's address: 742 Evergreen Terrace, Springfield, IL 62701. 
Insurance: Blue Cross, Policy #BCB-7734892. Contact: john.smith@gmail.com, (555) 867-5309.
Emergency contact: Mary Smith at (555) 234-5678. Patient has a known allergy to penicillin and is HIV positive.`,
  finance: `CONFIDENTIAL - Q4 Merger Discussion
Client: TechCorp Inc., Account #78234-BB, Routing: 021000021
Portfolio value: $4.2M. Credit card on file: 4532-1234-5678-9012 (expires 12/26, CVV 342).
CEO Sarah Chen (sarah.chen@techcorp.com) has authorized the $50M acquisition of StartupX.
This information is material non-public information. Insider trading risk.
Wire transfer to IBAN: GB29 NWBK 6016 1331 9268 19`,
  general: `Hi, I'm Alice Johnson and I need help with my account. 
My email is alice.johnson@company.com and my phone number is 555-123-4567.
I live at 123 Main Street, Boston, MA 02101. My IP address is 192.168.1.105.
The API key for our service is sk-abc123def456ghi789jkl012mno345pqr678.
My AWS access key is AKIAIOSFODNN7EXAMPLE.`
};

function RiskMeter({ score }) {
  const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
  const color = RISK_COLORS[level];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RISK SCORE</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{score}/100</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, var(--green), ${color})`, borderRadius: 4, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(l => (
          <span key={l} style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function DetectionItem({ detection }) {
  const [expanded, setExpanded] = useState(false);
  const color = RISK_COLORS[detection.riskLevel] || 'var(--cyan)';
  return (
    <div style={{ border: `1px solid ${color}30`, borderRadius: 8, marginBottom: 8, overflow: 'hidden', background: `${color}08` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`badge badge-${detection.riskLevel}`}>{detection.riskLevel}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{detection.label || detection.type}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{detection.category}</span>
        {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${color}20` }}>
          {detection.value && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detected: </span>
              <code style={{ fontSize: 12, background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, color }}>
                {detection.value.length > 60 ? detection.value.substring(0, 60) + '...' : detection.value}
              </code>
            </div>
          )}
          {detection.redacted && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Replaced with: </span>
              <code style={{ fontSize: 12, background: 'var(--green-dim)', padding: '2px 6px', borderRadius: 4, color: 'var(--green)' }}>{detection.redacted}</code>
            </div>
          )}
          {detection.reason && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{detection.reason}</p>}
          {detection.confidence && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Confidence: {(detection.confidence * 100).toFixed(0)}%</p>}
        </div>
      )}
    </div>
  );
}

export default function Scanner() {
  const [text, setText] = useState('');
  const [sector, setSector] = useState('general');
  const [useAI, setUseAI] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!text.trim()) return toast.error('Please enter text to scan');
    setLoading(true);
    try {
      const res = await api.scan.analyze({ text, sector, useAI });
      setResult(res.data);
      toast.success(`Scan complete: ${res.data.detections.length} items detected`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const copyRedacted = () => {
    navigator.clipboard.writeText(result.redactedText);
    toast.success('Redacted text copied!');
  };

  const loadSample = (s) => { setText(SAMPLE_TEXTS[s] || SAMPLE_TEXTS.general); setSector(s === 'healthcare' || s === 'finance' ? s : 'general'); };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScanLine size={26} color="var(--cyan)" /> Privacy Scanner
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Multi-layer detection: regex patterns + NLP keywords + AI contextual analysis
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
        {/* Left: Input */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <label style={{ margin: 0 }}>Input Text</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['healthcare', 'finance', 'general'].map(s => (
                  <button key={s} onClick={() => loadSample(s)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste text to analyze for privacy risks..." style={{ minHeight: 200 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <select value={sector} onChange={e => setSector(e.target.value)} style={{ flex: 1 }}>
                <option value="general">🌐 General</option>
                <option value="healthcare">🏥 Healthcare (HIPAA)</option>
                <option value="finance">💰 Finance (PCI-DSS)</option>
                <option value="defense">🛡️ Defense (ITAR)</option>
                <option value="legal">⚖️ Legal</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0, textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 400 }}>
                <div onClick={() => setUseAI(!useAI)} style={{ width: 36, height: 20, background: useAI ? 'var(--cyan)' : 'var(--bg-secondary)', borderRadius: 10, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: useAI ? 18 : 2, transition: 'left 0.2s' }} />
                </div>
                <Brain size={14} /> AI Analysis
              </label>
              <button className="btn btn-primary" onClick={handleScan} disabled={loading} style={{ flexShrink: 0 }}>
                {loading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Scanning...</> : <><ScanLine size={16} />Scan</>}
              </button>
            </div>
          </div>

          {/* Redacted output */}
          {result && (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ margin: 0, color: 'var(--green)' }}>✓ Redacted Output</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={copyRedacted} style={{ padding: '6px 12px', fontSize: 12 }}>
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--green-dim)' }}>
                {result.redactedText}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results panel */}
        <div>
          {result ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Risk meter */}
              <div className="card" style={{ marginBottom: 16 }}>
                <RiskMeter score={result.riskScore} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {result.complianceFlags?.map(f => (
                    <span key={f} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--purple-dim)', color: 'var(--purple)', padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(155,93,229,0.3)' }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>{result.detections.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Detected</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>{result.processingTime}ms</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan Time</div>
                </div>
              </div>

              {/* AI Contextual risk */}
              {result.aiAnalysis?.overallContextualRisk && result.aiAnalysis.overallContextualRisk !== 'unknown' && (
                <div className="card" style={{ marginBottom: 16, background: 'var(--purple-dim)', border: '1px solid rgba(155,93,229,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Brain size={16} color="var(--purple)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>AI Contextual Analysis</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Contextual Risk: <span style={{ color: RISK_COLORS[result.aiAnalysis.overallContextualRisk], fontWeight: 600 }}>{result.aiAnalysis.overallContextualRisk?.toUpperCase()}</span>
                  </div>
                  {result.aiAnalysis.aggregationRisk !== 'none' && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Aggregation Risk: <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{result.aiAnalysis.aggregationRisk?.toUpperCase()}</span>
                    </div>
                  )}
                  {result.aiAnalysis.recommendation && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{result.aiAnalysis.recommendation}</p>
                  )}
                </div>
              )}

              {/* Detections list */}
              <div className="card">
                <label style={{ marginBottom: 12, display: 'block' }}>Detections ({result.detections.length})</label>
                <div style={{ maxHeight: 350, overflow: 'auto', paddingRight: 4 }}>
                  {result.detections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--green)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={32} />
                      <span style={{ fontSize: 14 }}>No sensitive data detected</span>
                    </div>
                  ) : (
                    result.detections.map((d, i) => <DetectionItem key={i} detection={d} />)
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <ScanLine size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Scan results will appear here</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Try one of the sample texts</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
