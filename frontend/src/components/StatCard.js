import React from 'react';

export default function StatCard({ icon: Icon, label, value, color = 'var(--cyan)', sub, trend }) {
  return (
    <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {Icon && <Icon size={22} color={color} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color, marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
        {trend !== undefined && (
          <div style={{ fontSize: 11, color: trend >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </div>
  );
}
