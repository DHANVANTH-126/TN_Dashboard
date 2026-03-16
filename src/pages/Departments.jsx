import { useState, useEffect } from 'react';
import { Building2, Users, FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Departments() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.departments || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const viewDepartment = async (id) => {
    try {
      const res = await api.get(`/departments/${id}`);
      setSelected(res.data);
    } catch (err) { toast.error('Failed to load department'); }
  };

  const createDepartment = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/departments', { name: newName, description: newDesc });
      toast.success('Department created!');
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      fetchDepartments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Departments</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={16} /> New</button>
        )}
      </div>
      <div className="page-content fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24 }}>
          <div className="dept-grid" style={selected ? { gridTemplateColumns: '1fr' } : {}}>
            {departments.map(dept => (
              <div key={dept.id} className="dept-card" onClick={() => viewDepartment(dept.id)}
                style={selected?.id === dept.id ? { borderColor: 'var(--accent-primary)' } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="stat-icon purple"><Building2 size={20} /></div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{dept.name}</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{dept.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {dept.member_count} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14} /> {dept.document_count} docs</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{selected.name}</h2>
                <button className="btn-ghost" onClick={() => setSelected(null)}><X size={18} /></button>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{selected.description}</p>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Members ({selected.members?.length || 0})</h4>
                {(selected.members || []).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-glass-border)' }}>
                    <span>{m.name}</span><span className="badge badge-draft">{m.role}</span>
                  </div>
                ))}
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 20 }}>Recent Documents</h4>
                {(selected.documents || []).length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents</p> :
                  (selected.documents || []).map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-glass-border)' }}>
                      <span style={{ fontSize: 14 }}>{d.title}</span><span className={`badge badge-${d.status}`}>{d.status}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Department</h3><button className="btn-ghost" onClick={() => setShowCreate(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createDepartment}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
