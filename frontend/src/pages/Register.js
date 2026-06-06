import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, Building2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '', sector: 'general' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    { value: 'general', label: '🌐 General' },
    { value: 'healthcare', label: '🏥 Healthcare' },
    { value: 'finance', label: '💰 Finance' },
    { value: 'defense', label: '🛡️ Defense' },
    { value: 'legal', label: '⚖️ Legal' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: 'var(--cyan-dim)', border: '1px solid var(--border-bright)', marginBottom: 16, position: 'relative' }}>
            <Shield size={30} color="var(--cyan)" />
            <Activity size={12} color="var(--green)" style={{ position: 'absolute', bottom: 8, right: 8 }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)' }}>PrivacyGuard AI</h1>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 24 }}>Create Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div style={{ marginBottom: 16 }}>
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" style={{ paddingLeft: 34 }} required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label>Organization</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Acme Corp" style={{ paddingLeft: 34 }} />
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@organization.com" style={{ paddingLeft: 34 }} required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" style={{ paddingLeft: 34 }} required />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label>Industry Sector</label>
              <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                {sectors.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Determines default compliance rules and detection sensitivity</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px 20px' }}>
              {loading ? 'Creating Account...' : 'Create Secure Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
