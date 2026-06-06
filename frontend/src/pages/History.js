import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { History, Filter, Trash2, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ riskLevel: '', sector: '' });
  const [selectedScan, setSelectedScan] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await api.scan.history({ page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      setScans(res.data.scans);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [page, filters]);

  const viewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.scan.get(id);
      setSelectedScan(res.data.scan);
    } catch (err) {
      toast.error('Failed to load scan');
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteScan = async (id) => {
    if (!window.confirm('Delete this scan?')) return;
    try {
      await api.scan.delete(id);
      toast.success('Scan deleted');
      fetchScans();
      if (selectedScan?._id === id) setSelectedScan(null);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <History size={26} color="var(--cyan)" /> Scan History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          {total} total scans recorded
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} color="var(--text-muted)" />
          <select value={filters.riskLevel} onChange={e => setFilters({ ...filters, riskLevel: e.target.value })} style={{ width: 'auto' }}>
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <select value={filters.sector} onChange={e => setFilters({ ...filters, sector: e.target.value })} style={{ width: 'auto' }}>
          <option value="">All Sectors</option>
          <option value="healthcare">Healthcare</option>
          <option value="finance">Finance</option>
          <option value="defense">Defense</option>
          <option value="legal">Legal</option>
          <option value="general">General</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedScan ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Sector', 'Risk Level', 'Risk Score', 'Detections', 'Compliance', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : scans.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No scans found. Run your first scan!</td></tr>
              ) : (
                scans.map((scan, i) => (
                  <tr key={scan._id} style={{ borderBottom: '1px solid var(--border)', background: selectedScan?._id === scan._id ? 'var(--cyan-dim)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(scan.createdAt).toLocaleDateString()}<br />
                      <span style={{ fontSize: 10 }}>{new Date(scan.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}><span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{scan.sector}</span></td>
                    <td style={{ padding: '11px 16px' }}><span className={`badge badge-${scan.riskLevel}`}>{scan.riskLevel}</span></td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 50, height: 4, background: 'var(--bg-secondary)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${scan.riskScore}%`, background: RISK_COLORS[scan.riskLevel], borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: RISK_COLORS[scan.riskLevel] }}>{scan.riskScore}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: scan.detectionCount > 0 ? 'var(--orange)' : 'var(--green)' }}>{scan.detectionCount || 0}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(scan.complianceFlags || []).slice(0, 2).map(f => <span key={f} style={{ fontSize: 10, background: 'var(--purple-dim)', color: 'var(--purple)', padding: '2px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>{f}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => viewDetail(scan._id)} style={{ background: 'var(--cyan-dim)', border: '1px solid var(--border-bright)', color: 'var(--cyan)', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => deleteScan(scan._id)} style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,51,102,0.2)', color: 'var(--red)', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', fontSize: 13 }}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / 20)}</span>
              <button className="btn btn-outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} style={{ padding: '6px 14px', fontSize: 13 }}>Next →</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedScan && (
          <div className="card" style={{ position: 'sticky', top: 0, animation: 'fadeIn 0.2s ease', alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Scan Detail</h3>
              <button onClick={() => setSelectedScan(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span className={`badge badge-${selectedScan.riskLevel}`}>{selectedScan.riskLevel} risk</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Score: {selectedScan.riskScore}/100</span>
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {(selectedScan.detections || []).map((d, i) => (
                <div key={i} style={{ padding: '8px 10px', border: `1px solid ${RISK_COLORS[d.riskLevel] || 'var(--border)'}30`, borderRadius: 6, marginBottom: 6, background: `${RISK_COLORS[d.riskLevel] || 'var(--cyan)'}08` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span className={`badge badge-${d.riskLevel}`} style={{ fontSize: 9 }}>{d.riskLevel}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{d.label || d.type}</span>
                  </div>
                  <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.redacted}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
