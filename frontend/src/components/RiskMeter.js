import React from 'react';

const RISK_COLORS = { critical: '#ff3366', high: '#ff7a00', medium: '#ffd700', low: '#00ff88' };

export default function RiskMeter({ score = 0, showLabel = true, compact = false }) {
  const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
  const color = RISK_COLORS[level];

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, #00ff88, ${color})`, borderRadius: 2, transition: 'width 0.8s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color, fontWeight: 700, minWidth: 28 }}>{score}</span>
      </div>
    );
  }

  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>RISK SCORE</span>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{score}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/100</span></span>
        </div>
      )}
      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, #00ff88 0%, ${color} 100%)`, borderRadius: 4, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(l => (
          <span key={l} style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l}</span>
        ))}
      </div>
    </div>
  );
}
