import React from 'react';

export default function RiskBadge({ level, size = 'sm' }) {
  const classes = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  const padding = size === 'lg' ? '5px 14px' : size === 'xs' ? '2px 6px' : '3px 10px';
  const fontSize = size === 'lg' ? 13 : size === 'xs' ? 10 : 11;
  return (
    <span className={`badge ${classes[level] || 'badge-low'}`} style={{ padding, fontSize }}>
      {level?.toUpperCase()}
    </span>
  );
}
