import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Settings2, Plus, Trash2, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const FRAMEWORKS = ['HIPAA', 'GDPR', 'PCI-DSS', 'SOX', 'GLBA', 'ITAR', 'CMMC', 'SOC2', 'ISO27001', 'NIST'];

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sector: 'general', complianceFrameworks: [], rules: [] });

  const fetchPolicies = () => {
    api.policies.list()
      .then(res => setPolicies(res.data.policies))
      .catch(() => toast.error('Failed to load policies'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPolicies(); }, []);

  const loadDefault = async (sector) => {
    try {
      const res = await api.policies.getDefault(sector);
      setForm({ ...res.data.policy, sector });
      toast.success('Default policy loaded');
    } catch { toast.error('No default for this sector'); }
  };

  const createPolicy = async () => {
    try {
      await api.policies.create(form);
      toast.success('Policy created');
      setShowCreate(false);
      setForm({ name: '', description: '', sector: 'general', complianceFrameworks: [], rules: [] });
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create policy');
    }
  };

  const toggleFramework = (fw) => {
    setForm(f => ({
      ...f,
      complianceFrameworks: f.complianceFrameworks.includes(fw)
        ? f.complianceFrameworks.filter(x => x !== fw)
        : [...f.complianceFrameworks, fw]
    }));
  };

  const deletePolicy = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    try {
      await api.policies.delete(id);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch { toast.error('Delete failed'); }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.policies.update(id, { isActive: !current });
      fetchPolicies();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings2 size={26} color="var(--cyan)" /> Privacy Policies
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Manage custom detection rules and compliance frameworks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={16} /> New Policy
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 24, animation: 'fadeIn 0.2s ease', border: '1px solid var(--border-bright)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Create Policy</h3>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <div>
              <label>Policy Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. HIPAA Compliance Policy" />
            </div>
            <div>
              <label>Sector</label>
              <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                <option value="general">General</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="defense">Defense</option>
                <option value="legal">Legal</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what this policy enforces..." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Compliance Frameworks</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {FRAMEWORKS.map(fw => (
                <button key={fw} type="button" onClick={() => toggleFramework(fw)} style={{
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', transition: 'all 0.15s',
                  background: form.complianceFrameworks.includes(fw) ? 'var(--purple-dim)' : 'var(--bg-secondary)',
                  border: form.complianceFrameworks.includes(fw) ? '1px solid rgba(155,93,229,0.4)' : '1px solid var(--border)',
                  color: form.complianceFrameworks.includes(fw) ? 'var(--purple)' : 'var(--text-muted)'
                }}>{fw}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={createPolicy} disabled={!form.name}>
              <CheckCircle size={15} /> Create Policy
            </button>
            <button className="btn btn-outline" onClick={() => loadDefault(form.sector)}>Load {form.sector} Defaults</button>
            <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Policies list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : policies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Settings2 size={40} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p style={{ fontSize: 14 }}>No custom policies yet</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Create one above or load defaults for your sector</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {policies.map(policy => (
            <div key={policy._id} className="card" style={{ border: policy.isActive ? '1px solid rgba(0,200,255,0.15)' : '1px solid var(--border)', opacity: policy.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{policy.name}</h3>
                    <span style={{ fontSize: 11, textTransform: 'capitalize', background: 'var(--cyan-dim)', color: 'var(--cyan)', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{policy.sector}</span>
                    {policy.isActive
                      ? <span style={{ fontSize: 11, background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 8px', borderRadius: 4 }}>● Active</span>
                      : <span style={{ fontSize: 11, background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: 4 }}>● Inactive</span>}
                  </div>
                  {policy.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{policy.description}</p>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(policy.complianceFrameworks || []).map(fw => (
                      <span key={fw} style={{ fontSize: 11, background: 'var(--purple-dim)', color: 'var(--purple)', padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)', border: '1px solid rgba(155,93,229,0.3)' }}>{fw}</span>
                    ))}
                    {policy.rules?.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{policy.rules.length} rules</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                  <button onClick={() => toggleActive(policy._id, policy.isActive)} style={{ background: policy.isActive ? 'var(--red-dim)' : 'var(--green-dim)', border: '1px solid', borderColor: policy.isActive ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)', color: policy.isActive ? 'var(--red)' : 'var(--green)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
                    {policy.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deletePolicy(policy._id)} style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,51,102,0.2)', color: 'var(--red)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
