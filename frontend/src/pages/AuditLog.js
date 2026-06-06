import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ClipboardList, User, Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_COLORS = { SCAN: 'var(--cyan)', REDACT: 'var(--purple)', LOGIN: 'var(--green)', POLICY_CHANGE: 'var(--orange)', DELETE: 'var(--red)' };

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.audit.logs({ limit: 100, action: filter || undefined })
      .then(res => setLogs(res.data.logs))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={26} color="var(--cyan)" /> Audit Logs
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Complete, tamper-evident activity trail for compliance reporting</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'SCAN', 'REDACT', 'LOGIN', 'POLICY_CHANGE'].map(action => (
          <button key={action} onClick={() => setFilter(action)} style={{
            background: filter === action ? 'var(--cyan-dim)' : 'var(--bg-card)', border: filter === action ? '1px solid var(--border-bright)' : '1px solid var(--border)',
            color: filter === action ? 'var(--cyan)' : 'var(--text-muted)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)'
          }}>
            {action || 'ALL'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Timestamp', 'Action', 'Status', 'IP Address', 'Details'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No audit logs found</td></tr>
            ) : logs.map((log, i) => (
              <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: ACTION_COLORS[log.action] || 'var(--text-primary)', background: `${ACTION_COLORS[log.action] || 'var(--cyan)'}15`, padding: '3px 8px', borderRadius: 4 }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {log.success ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="var(--red)" />}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {log.details ? Object.entries(Object.fromEntries(log.details || [])).map(([k, v]) => `${k}: ${v}`).join(', ') : log.resource || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
