import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FileText, Download, Shield, AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import RiskBadge from '../components/RiskBadge';

const STATUS_STYLES = {
  COMPLIANT:      { color: 'var(--green)',  bg: 'var(--green-dim)',  border: 'rgba(0,255,136,0.25)' },
  AT_RISK:        { color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(255,215,0,0.25)' },
  REVIEW_NEEDED:  { color: 'var(--orange)', bg: 'var(--orange-dim)', border: 'rgba(255,122,0,0.25)' },
  NON_COMPLIANT:  { color: 'var(--red)',    bg: 'var(--red-dim)',    border: 'rgba(255,51,102,0.25)' },
};

function FrameworkCard({ assessment }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLES[assessment.status] || STATUS_STYLES.REVIEW_NEEDED;
  return (
    <div style={{ border: `1px solid ${style.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: style.bg }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: style.color, fontFamily: 'var(--font-mono)' }}>{assessment.framework}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{assessment.name}</div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: style.color, background: style.bg, border: `1px solid ${style.border}`, padding: '3px 10px', borderRadius: 6 }}>{assessment.status?.replace('_', ' ')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{assessment.relevantDetections} detections</div>
        </div>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${style.border}`, background: 'var(--bg-card)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Penalty exposure: <span style={{ color: style.color }}>{assessment.penaltyRange}</span></p>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Key Requirements:</div>
          {(assessment.requirements || []).map((r, i) => (
            <div key={i} style={{ padding: '8px 10px', marginBottom: 6, background: 'var(--bg-secondary)', borderRadius: 6, borderLeft: `3px solid ${style.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: style.color }}>{r.id}</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingScans, setLoadingScans] = useState(true);
  // Aggregate mode
  const [mode, setMode] = useState('single'); // single | aggregate
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    api.scan.history({ limit: 50 })
      .then(r => setScans(r.data.scans || []))
      .catch(() => {})
      .finally(() => setLoadingScans(false));
  }, []);

  const generateReport = async () => {
    if (mode === 'single' && !selectedScanId) return toast.error('Select a scan');
    setLoading(true);
    setReport(null);
    try {
      let res;
      if (mode === 'single') {
        res = await axios.get(`/api/compliance/scan/${selectedScanId}`);
        setReport(res.data.report);
      } else {
        res = await axios.post('/api/compliance/aggregate', { from: dateFrom || undefined, to: dateTo || undefined });
        setReport(res.data.report);
        toast.success(`Report generated across ${res.data.scanCount} scans`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadText = async () => {
    if (!selectedScanId || mode !== 'single') return;
    const res = await axios.get(`/api/compliance/scan/${selectedScanId}/text`);
    const blob = new Blob([res.data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `compliance-report.txt`; a.click();
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `compliance-report-${report.reportId}.json`; a.click();
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={26} color="var(--cyan)" /> Compliance Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Generate detailed HIPAA, GDPR, PCI-DSS, and ITAR compliance reports
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Controls */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {['single', 'aggregate'].map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', border: mode === m ? '1px solid var(--border-bright)' : '1px solid var(--border)', background: mode === m ? 'var(--cyan-dim)' : 'transparent', color: mode === m ? 'var(--cyan)' : 'var(--text-muted)' }}>
                  {m === 'single' ? 'Single Scan' : 'Aggregate'}
                </button>
              ))}
            </div>

            {mode === 'single' ? (
              <div>
                <label>Select Scan</label>
                {loadingScans ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>Loading scans...</div> : (
                  <select value={selectedScanId} onChange={e => setSelectedScanId(e.target.value)}>
                    <option value="">Choose a scan...</option>
                    {scans.map(s => (
                      <option key={s._id} value={s._id}>
                        {new Date(s.createdAt).toLocaleDateString()} — {s.riskLevel?.toUpperCase()} ({s.riskScore}/100) — {s.sector}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label>From Date</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label>To Date</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Leave blank to include all scans</p>
              </div>
            )}

            <button className="btn btn-primary" onClick={generateReport} disabled={loading || (mode === 'single' && !selectedScanId)} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
              {loading ? 'Generating...' : <><FileText size={15} /> Generate Report</>}
            </button>
          </div>

          {report && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Download Report</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-outline" onClick={downloadJson} style={{ justifyContent: 'center' }}><Download size={14} /> JSON Format</button>
                {mode === 'single' && selectedScanId && <button className="btn btn-outline" onClick={downloadText} style={{ justifyContent: 'center' }}><Download size={14} /> Text Format</button>}
              </div>
            </div>
          )}
        </div>

        {/* Report output */}
        <div>
          {loading && <LoadingSpinner message="Analyzing compliance posture..." />}

          {!loading && !report && (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ marginBottom: 16, opacity: 0.15 }} />
              <p style={{ fontSize: 14 }}>Select a scan or date range and generate a report</p>
            </div>
          )}

          {report && !loading && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Header */}
              <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(0,200,255,0.05) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>{report.reportId}</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Compliance Report</h2>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{report.organization} · {report.sector?.toUpperCase()} · {new Date(report.generatedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: report.privacyScore >= 70 ? 'var(--green)' : report.privacyScore >= 40 ? 'var(--yellow)' : 'var(--red)' }}>{report.privacyScore}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Privacy Score</div>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                  { label: 'Risk Score', value: `${report.executive_summary.overallRiskScore}/100`, color: 'var(--orange)' },
                  { label: 'Detections', value: report.executive_summary.totalDetections, color: 'var(--red)' },
                  { label: 'Critical', value: report.executive_summary.criticalFindings, color: 'var(--red)' },
                  { label: 'Non-Compliant', value: `${report.executive_summary.nonCompliantFrameworks}/${report.executive_summary.frameworksAssessed}`, color: 'var(--yellow)' }
                ].map(({ label, value, color }) => (
                  <div key={label} className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Framework assessments */}
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} color="var(--cyan)" /> Framework Assessment
                </h3>
                {(report.frameworkAssessments || []).map((fa, i) => <FrameworkCard key={i} assessment={fa} />)}
              </div>

              {/* Recommendations */}
              {report.recommendations?.length > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} color="var(--purple)" /> Recommendations
                  </h3>
                  {report.recommendations.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, marginBottom: 8, background: r.priority === 'CRITICAL' ? 'var(--red-dim)' : r.priority === 'HIGH' ? 'var(--orange-dim)' : 'var(--cyan-dim)', border: `1px solid ${r.priority === 'CRITICAL' ? 'rgba(255,51,102,0.25)' : r.priority === 'HIGH' ? 'rgba(255,122,0,0.25)' : 'var(--border-bright)'}` }}>
                      <div style={{ flexShrink: 0 }}><RiskBadge level={r.priority === 'CRITICAL' ? 'critical' : r.priority === 'HIGH' ? 'high' : 'medium'} size="xs" /></div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.action}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{r.framework}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Next review due: {new Date(report.nextReviewDate).toLocaleDateString()}</span>
                <span>Generated by PrivacyGuard AI v1.0</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
