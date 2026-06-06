import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Database, Shield, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

const RISK_COLOR = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

const SAMPLE = `Our RAG pipeline ingests customer support tickets. Here is a recent ticket:

From: sarah.johnson@techcorp.com (Account #78234, SSN 456-78-9012)
Subject: Billing Issue

Hi, I'm Sarah Johnson and I've been charged $1,249.99 on my credit card 4532-1234-5678-9012.
My phone number is 555-867-5309 and I live at 742 Evergreen Terrace, Springfield IL 62701.
My AWS key AKIAIOSFODNN7EXAMPLE is also in our system logs somehow.`;

export default function EmbeddingPlayground() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('protect'); // protect | chunks | pseudonymize
  const [aggressiveness, setAggressiveness] = useState('medium');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) return toast.error('Enter text');
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (mode === 'protect') {
        res = await axios.post('/api/embedding/protect', { data: text, pipelineConfig: { enablePseudonymization: true, privacyLevel: aggressiveness } });
        setResult({ type: 'protect', ...res.data });
      } else if (mode === 'chunks') {
        const chunks = text.split('\n\n').filter(Boolean);
        res = await axios.post('/api/embedding/analyze-chunks', { chunks });
        setResult({ type: 'chunks', ...res.data });
      } else {
        res = await axios.post('/api/embedding/pseudonymize', { text, aggressiveness });
        setResult({ type: 'pseudo', ...res.data });
      }
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = (val) => { navigator.clipboard.writeText(val); toast.success('Copied!'); };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={26} color="var(--cyan)" /> Embedding Privacy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Protect sensitive data in RAG pipelines and vector embeddings before indexing
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[['protect', '🛡️ Pipeline Protection'], ['chunks', '📦 Chunk Analysis'], ['pseudonymize', '🎭 Pseudonymization']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, border: mode === m ? '1px solid var(--border-bright)' : '1px solid var(--border)', background: mode === m ? 'var(--cyan-dim)' : 'transparent', color: mode === m ? 'var(--cyan)' : 'var(--text-muted)' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ margin: 0 }}>Input {mode === 'chunks' ? '(separate chunks with blank lines)' : ''}</label>
              <button onClick={() => setText(SAMPLE)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Load Sample</button>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste text containing sensitive data..." style={{ minHeight: 200 }} />
            {mode !== 'chunks' && (
              <div style={{ marginTop: 12 }}>
                <label>Aggressiveness</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['low', 'medium', 'high'].map(a => (
                    <button key={a} onClick={() => setAggressiveness(a)} style={{ flex: 1, padding: '7px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', border: aggressiveness === a ? '1px solid var(--border-bright)' : '1px solid var(--border)', background: aggressiveness === a ? 'var(--cyan-dim)' : 'transparent', color: aggressiveness === a ? 'var(--cyan)' : 'var(--text-muted)' }}>{a}</button>
                  ))}
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={run} disabled={loading || !text.trim()} style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              {loading ? 'Processing...' : <><Shield size={15} /> Protect Data</>}
            </button>
          </div>
        </div>

        <div>
          {!result && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Protected output will appear here</p>
            </div>
          )}

          {result?.type === 'protect' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ color: 'var(--green)', margin: 0 }}>✓ Protected Output</label>
                  <button onClick={() => copy(result.protectedData)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 11 }}><Copy size={12} /> Copy</button>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 180, overflow: 'auto' }}>
                  {result.protectedData}
                </div>
              </div>
              <div className="card">
                <label style={{ marginBottom: 10, display: 'block' }}>Modifications ({result.report?.modifications?.length || 0})</label>
                {(result.report?.modifications || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, alignItems: 'center' }}>
                    <code style={{ color: 'var(--red)', background: 'var(--red-dim)', padding: '2px 6px', borderRadius: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original}</code>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <code style={{ color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 6px', borderRadius: 4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.replacement}</code>
                  </div>
                ))}
                {result.report?.modifications?.length === 0 && <div style={{ color: 'var(--green)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> No sensitive data found</div>}
              </div>
            </div>
          )}

          {result?.type === 'chunks' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="grid-3" style={{ marginBottom: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>{result.summary?.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Chunks</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{result.summary?.safeToEmbed}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Safe to Embed</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>{result.summary?.requiresSanitization}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Need Sanitization</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <label style={{ display: 'block', marginBottom: 12 }}>Chunk Analysis</label>
                {(result.analysis || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: c.hasSensitiveData ? 'var(--red-dim)' : 'var(--green-dim)', border: `1px solid ${c.hasSensitiveData ? 'rgba(255,51,102,0.2)' : 'rgba(0,255,136,0.2)'}` }}>
                    {c.hasSensitiveData ? <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chunk {c.index + 1}: {c.chunk}</div>
                      <div style={{ fontSize: 11, color: c.hasSensitiveData ? 'var(--red)' : 'var(--green)', marginTop: 2 }}>{c.recommendation?.replace(/_/g, ' ')}</div>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: RISK_COLOR[c.riskScore >= 60 ? 'high' : c.riskScore >= 30 ? 'medium' : 'low'], flexShrink: 0 }}>{c.riskScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.type === 'pseudo' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ color: 'var(--purple)', margin: 0 }}>🎭 Pseudonymized Output</label>
                  <button onClick={() => copy(result.pseudonymized)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 11 }}><Copy size={12} /> Copy</button>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 180, overflow: 'auto' }}>
                  {result.pseudonymized}
                </div>
              </div>
              <div className="card">
                <label style={{ display: 'block', marginBottom: 10 }}>Pseudonym Vault ({result.modificationCount} mappings)</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>These consistent mappings allow de-pseudonymization when needed.</p>
                {Object.entries(result.vault?.mappings || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
                    <code style={{ flex: 1, background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{k.split(':').slice(1).join(':')}</code>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <code style={{ flex: 1, background: 'var(--purple-dim)', padding: '3px 8px', borderRadius: 4, color: 'var(--purple)' }}>{v}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
