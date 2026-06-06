import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, ScanLine, MessageSquare,
  History, ClipboardList, Settings2, LogOut, ChevronLeft,
  ChevronRight, Activity, FileText, Database, User
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard,   label: 'Dashboard' },
  { to: '/scanner',      icon: ScanLine,           label: 'Privacy Scanner' },
  { to: '/safe-prompt',  icon: MessageSquare,      label: 'Safe LLM Proxy' },
  { to: '/embedding',    icon: Database,           label: 'Embedding Privacy' },
  { to: '/reports',      icon: FileText,           label: 'Reports' },
  { to: '/history',      icon: History,            label: 'Scan History' },
  { to: '/audit',        icon: ClipboardList,      label: 'Audit Logs' },
  { to: '/policies',     icon: Settings2,          label: 'Policies' },
  { to: '/settings',     icon: User,               label: 'Settings' },
];

const SECTOR_COLORS = {
  healthcare: '#00ff88', finance: '#ffd700', defense: '#ff3366',
  legal: '#9b5de5', general: '#00c8ff'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 232,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0, width: 30, height: 30 }}>
            <Shield size={26} color="var(--cyan)" />
            <Activity size={9} color="var(--green)" style={{ position: 'absolute', bottom: -1, right: -3 }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--cyan)' }}>PrivacyGuard</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>AI PIPELINE SECURITY</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 7, textDecoration: 'none', overflow: 'hidden',
              color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
              background: isActive ? 'var(--cyan-dim)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
              fontWeight: isActive ? 600 : 400, fontSize: 13, transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            })}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ padding: '7px 12px', marginBottom: 4, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[user?.sector] || 'var(--cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.sector}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '9px 12px',
              width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', borderRadius: 7, transition: 'all 0.15s',
              fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)', cursor: 'pointer', color: 'var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', maxHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
