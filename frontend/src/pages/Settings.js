import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Lock, Key, Trash2, Shield, Bell, Eye, EyeOff, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const SECTORS = ['general', 'healthcare', 'finance', 'defense', 'legal'];
const SENSITIVITY = ['low', 'medium', 'high', 'critical'];

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="var(--cyan)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({ name: '', organization: '', sector: 'general', settings: { sensitivityLevel: 'medium', autoRedact: true, notifications: true } });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', organization: user.organization || '', sector: user.sector || 'general', settings: user.settings || { sensitivityLevel: 'medium', autoRedact: true, notifications: true } });
    }
    axios.get('/api/settings/profile').then(r => { setScanCount(r.data.scanCount || 0); if (r.data.user.apiKey) setApiKey(r.data.user.apiKey); }).catch(() => {});
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await axios.patch('/api/settings/profile', profile);
      toast.success('Profile saved');
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error('Fill all fields');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Min 6 characters');
    try {
      await axios.post('/api/settings/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const generateApiKey = async () => {
    try {
      const res = await axios.post('/api/settings/api-key');
      setApiKey(res.data.apiKey);
      setShowApiKey(true);
      toast.success('API key generated');
    } catch (err) { toast.error('Failed to generate key'); }
  };

  const revokeApiKey = async () => {
    try {
      await axios.delete('/api/settings/api-key');
      setApiKey('');
      toast.success('API key revoked');
    } catch (err) { toast.error('Failed to revoke key'); }
  };

  const copyApiKey = () => { navigator.clipboard.writeText(apiKey); toast.success('Copied!'); };

  const deleteAccount = async () => {
    try {
      await axios.delete('/api/settings/account', { data: { password: deletePassword } });
      toast.success('Account deleted');
      logout();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 40, height: 22, background: value ? 'var(--cyan)' : 'var(--bg-secondary)', borderRadius: 11, position: 'relative', transition: 'background 0.2s', cursor: 'pointer', border: '1px solid var(--border)', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: value ? 20 : 2, transition: 'left 0.2s' }} />
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={26} color="var(--cyan)" /> Account Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Manage your profile, security, and API access
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <div style={{ display: 'flex', gap: 60, marginBottom: 16, padding: 16, background: 'var(--bg-secondary)', borderRadius: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>{scanCount}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Scans</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--purple)', textTransform: 'capitalize' }}>{user?.role}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)', textTransform: 'capitalize' }}>{user?.sector}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sector</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div><label>Full Name</label><input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
          <div><label>Organization</label><input value={profile.organization} onChange={e => setProfile({ ...profile, organization: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Industry Sector</label>
          <select value={profile.sector} onChange={e => setProfile({ ...profile, sector: e.target.value })}>
            {SECTORS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </Section>

      {/* Privacy Preferences */}
      <Section title="Privacy Preferences" icon={Shield}>
        <div style={{ marginBottom: 20 }}>
          <label>Default Sensitivity Level</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {SENSITIVITY.map(s => (
              <button key={s} onClick={() => setProfile(p => ({ ...p, settings: { ...p.settings, sensitivityLevel: s } }))} style={{ flex: 1, padding: '8px 4px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', border: profile.settings.sensitivityLevel === s ? '1px solid var(--cyan)' : '1px solid var(--border)', background: profile.settings.sensitivityLevel === s ? 'var(--cyan-dim)' : 'var(--bg-secondary)', color: profile.settings.sensitivityLevel === s ? 'var(--cyan)' : 'var(--text-muted)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Auto-Redact</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically redact detected entities before LLM calls</div>
          </div>
          <Toggle value={profile.settings.autoRedact} onChange={v => setProfile(p => ({ ...p, settings: { ...p.settings, autoRedact: v } }))} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alert on critical risk detections</div>
          </div>
          <Toggle value={profile.settings.notifications} onChange={v => setProfile(p => ({ ...p, settings: { ...p.settings, notifications: v } }))} />
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ marginTop: 8 }}>{saving ? 'Saving...' : 'Save Preferences'}</button>
      </Section>

      {/* Password */}
      <Section title="Change Password" icon={Lock}>
        <div style={{ marginBottom: 14 }}>
          <label>Current Password</label>
          <input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} placeholder="••••••••" />
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div><label>New Password</label><input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="••••••••" /></div>
          <div><label>Confirm New Password</label><input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} placeholder="••••••••" /></div>
        </div>
        <button className="btn btn-outline" onClick={changePassword}>Update Password</button>
      </Section>

      {/* API Key */}
      <Section title="API Access" icon={Key}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Use your API key to integrate PrivacyGuard into your own LLM pipelines and applications.
        </p>
        {apiKey ? (
          <div>
            <label>Your API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showApiKey ? 'text' : 'password'} value={apiKey} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <button className="btn btn-outline" onClick={() => setShowApiKey(!showApiKey)} style={{ flexShrink: 0, padding: '0 12px' }}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              <button className="btn btn-outline" onClick={copyApiKey} style={{ flexShrink: 0, padding: '0 12px' }}><Copy size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-outline" onClick={generateApiKey} style={{ gap: 6 }}><RefreshCw size={14} /> Regenerate</button>
              <button className="btn btn-danger" onClick={revokeApiKey}>Revoke Key</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={generateApiKey}><Key size={16} /> Generate API Key</button>
        )}
        <div style={{ marginTop: 16, padding: 12, background: 'var(--cyan-dim)', border: '1px solid var(--border-bright)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Authorization: Bearer pg_your_key_here
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(255,51,102,0.25)', background: 'rgba(255,51,102,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,51,102,0.15)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--red)' }}>Danger Zone</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Permanently delete your account and all associated scan data. This cannot be undone.</p>
        <button className="btn btn-danger" onClick={() => setShowDelete(true)} style={{ gap: 8 }}><Trash2 size={15} /> Delete Account</button>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Account"
        message="This will permanently delete your account and all scan data. Type your password to confirm."
        onCancel={() => setShowDelete(false)}
        onConfirm={deleteAccount}
        danger
      />

      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 380, padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--red)' }}>⚠️ Delete Account</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>This is permanent. Enter your password to confirm.</p>
            <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your password" style={{ marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setShowDelete(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteAccount} style={{ flex: 1 }}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
