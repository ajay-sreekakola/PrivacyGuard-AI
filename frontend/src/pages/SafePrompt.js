import React, { useState } from 'react';
import api from '../utils/api';
import { MessageSquare, Send, Shield, AlertTriangle, CheckCircle, ArrowRight, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

export default function SafePrompt() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [sector, setSector] = useState('general');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('prompt');

  const handleSubmit = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.redact.safePrompt({ prompt, systemPrompt, sector });
      setResult(res.data);
      toast.success('Safe prompt processed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setPrompt(`I need to create a report for our patient John Smith (SSN: 123-45-6789, DOB: 01/15/1980) who was diagnosed with Type 2 Diabetes. 
His current medications include Metformin 500mg. 
His email john.smith@hospital.com and insurance policy #BCB-123456. 
Can you summarize his treatment plan?`);
    setSector('healthcare');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={26} color="var(--cyan)" /> Safe LLM Proxy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Automatically redacts sensitive data BEFORE sending to any LLM, then scans the response for leakage
        </p>
      </div>

      {/* How it works */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--cyan-dim)', border: '1px solid var(--border-bright)', borderRadius: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {['Your Prompt', '→ Privacy Scan', '→ Redact PII', '→ Send to LLM', '→ Scan Response', '→ Safe Output'].map((step, i) => (
          <span key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: i % 2 === 0 ? 'var(--cyan)' : 'var(--text-muted)', fontWeight: i === 0 || i === 5 ? 700 : 400 }}>{step}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              {['prompt', 'system'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? 'var(--cyan-dim)' : 'transparent', border: activeTab === tab ? '1px solid var(--border-bright)' : '1px solid transparent', color: activeTab === tab ? 'var(--cyan)' : 'var(--text-muted)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                  {tab === 'prompt' ? 'User Prompt' : 'System Prompt'}
                </button>
              ))}
              <button onClick={loadExample} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11 }}>
                Load Example
              </button>
            </div>

            {activeTab === 'prompt' ? (
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt containing potentially sensitive data..." style={{ minHeight: 180 }} />
            ) : (
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="System prompt (will also be scanned)..." style={{ minHeight: 180 }} />
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <select value={sector} onChange={e => setSector(e.target.value)} style={{ flex: 1 }}>
                <option value="general">🌐 General</option>
                <option value="healthcare">🏥 Healthcare</option>
                <option value="finance">💰 Finance</option>
                <option value="defense">🛡️ Defense</option>
              </select>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !prompt.trim()} style={{ flexShrink: 0 }}>
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Processing...</>
                ) : (
                  <><Shield size={16} />Send Safely</>
                )}
              </button>
            </div>
          </div>

          {/* Privacy indicator */}
          <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Privacy-Preserving Mode Active</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All PII/PHI/PCI data is stripped before reaching the LLM</div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          {result ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Risk summary */}
              <div className="card" style={{ marginBottom: 14, background: result.scanResult.riskLevel === 'critical' ? 'var(--red-dim)' : result.scanResult.riskLevel === 'high' ? 'var(--orange-dim)' : 'var(--green-dim)', border: `1px solid ${RISK_COLORS[result.scanResult.riskLevel]}40` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {result.scanResult.riskLevel === 'low' ? <CheckCircle size={18} color="var(--green)" /> : <AlertTriangle size={18} color={RISK_COLORS[result.scanResult.riskLevel]} />}
                    <span style={{ fontWeight: 700, fontSize: 14, color: RISK_COLORS[result.scanResult.riskLevel] }}>
                      {result.scanResult.detectionCount} items redacted
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.scanResult.complianceFlags?.map(f => (
                      <span key={f} className="badge badge-medium" style={{ fontSize: 10 }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Redacted prompt */}
              <div className="card" style={{ marginBottom: 14 }}>
                <label style={{ marginBottom: 8, display: 'block', color: 'var(--orange)' }}>Redacted Prompt (sent to LLM)</label>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)', maxHeight: 140, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {result.redactedPrompt}
                </div>
              </div>

              {/* AI Response */}
              <div className="card" style={{ marginBottom: 14, border: '1px solid var(--green-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Brain size={16} color="var(--cyan)" />
                  <label style={{ margin: 0, color: 'var(--green)' }}>AI Response (privacy-filtered)</label>
                  {result.responseRisk.detectionCount > 0 && (
                    <span className="badge badge-high" style={{ fontSize: 10 }}>{result.responseRisk.detectionCount} leaks blocked</span>
                  )}
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', maxHeight: 180, overflow: 'auto' }}>
                  {result.aiResponse}
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--green)" />
                <span style={{ fontSize: 13, color: 'var(--green)' }}>Privacy preserved — this interaction was logged to audit trail</span>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
              <p style={{ fontSize: 14 }}>Safe LLM response will appear here</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>Sensitive data is stripped before reaching the model</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
