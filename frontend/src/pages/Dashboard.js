import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Shield, AlertTriangle, CheckCircle, Activity, TrendingUp, FileSearch, Lock, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  </div>
);

const RISK_COLORS = { critical: '#ff3366', high: '#ff7a00', medium: '#ffd700', low: '#00ff88' };
const CAT_COLORS = ['#00c8ff', '#9b5de5', '#ff7a00', '#00ff88', '#ff3366', '#ffd700'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ fontSize: 13, color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading analytics...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const riskData = Object.entries(stats?.riskBreakdown || {}).map(([level, count]) => ({ name: level, value: count, color: RISK_COLORS[level] }));
  const categoryData = (stats?.categoryBreakdown || []).map((c, i) => ({ name: c._id, value: c.count, color: CAT_COLORS[i % CAT_COLORS.length] }));

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 6 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--cyan-dim)', color: 'var(--cyan)', padding: '2px 8px', borderRadius: 4, marginRight: 8, textTransform: 'uppercase' }}>{user?.sector}</span>
          Privacy intelligence overview for your organization
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={FileSearch} label="Total Scans" value={stats?.totalScans || 0} color="var(--cyan)" sub={`${stats?.recentScans || 0} this month`} />
        <StatCard icon={AlertTriangle} label="Total Detections" value={stats?.totalDetections || 0} color="var(--orange)" sub="Across all scans" />
        <StatCard icon={Activity} label="Avg Risk Score" value={`${stats?.avgRiskScore || 0}/100`} color={parseFloat(stats?.avgRiskScore) > 50 ? 'var(--red)' : 'var(--yellow)'} />
        <StatCard icon={Shield} label="Compliance Flags" value={`${(stats?.complianceStats?.hipaaScans || 0) + (stats?.complianceStats?.pciScans || 0) + (stats?.complianceStats?.gdprScans || 0)}`} color="var(--purple)" sub="Active frameworks" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Timeline */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--cyan)" /> Scan Activity (30 days)
          </h3>
          {stats?.timelineData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Scans" stroke="#00c8ff" fill="url(#cyanGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="avgRisk" name="Avg Risk" stroke="#ff7a00" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No scan data yet. Run your first scan!
            </div>
          )}
        </div>

        {/* Risk donut */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--purple)" /> Risk Distribution
          </h3>
          {riskData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {riskData.map(r => (
                  <span key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    {r.name} ({r.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown + Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="var(--yellow)" /> Detection Categories
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No detections yet</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} color="var(--green)" /> Compliance Coverage
          </h3>
          {[
            { label: 'HIPAA', count: stats?.complianceStats?.hipaaScans || 0, color: 'var(--green)' },
            { label: 'PCI-DSS', count: stats?.complianceStats?.pciScans || 0, color: 'var(--cyan)' },
            { label: 'GDPR', count: stats?.complianceStats?.gdprScans || 0, color: 'var(--purple)' }
          ].map(({ label, count, color }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{count} scans</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((count / (stats?.totalScans || 1)) * 100, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="var(--green)" />
            <span style={{ fontSize: 13, color: 'var(--green)' }}>Privacy monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
