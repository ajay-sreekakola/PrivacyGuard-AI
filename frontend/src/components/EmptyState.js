import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', gap: 12 }}>
      {Icon && <Icon size={48} style={{ opacity: 0.18, color: 'var(--cyan)' }} />}
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{title}</p>
      {description && <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  );
}
