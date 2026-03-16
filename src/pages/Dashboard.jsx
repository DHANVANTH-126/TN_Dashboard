import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, ArrowUpRight, Building2, Upload, Send } from 'lucide-react';
import api from '../api/client';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const stats = data?.stats || {};
  const pending = data?.pendingApprovals || [];
  const recent = data?.recentDocuments || [];
  const deptBreakdown = data?.departmentBreakdown || [];
  const maxDocs = Math.max(...deptBreakdown.map(d => parseInt(d.count) || 0), 1);

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
      </div>
      <div className="page-content fade-in">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-icon purple"><FileText size={22} /></div>
            <div className="stat-info">
              <div className="stat-label">Total Documents</div>
              <div className="stat-value">{stats.total_documents || 0}</div>
            </div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon blue"><Clock size={22} /></div>
            <div className="stat-info">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value">{stats.pending_documents || 0}</div>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon green"><CheckCircle size={22} /></div>
            <div className="stat-info">
              <div className="stat-label">Approved</div>
              <div className="stat-value">{stats.approved_documents || 0}</div>
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon red"><XCircle size={22} /></div>
            <div className="stat-info">
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{stats.rejected_documents || 0}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recommended Process Flow</h2>
          </div>
          <div className="card-body">
            <div className="flow-steps-grid">
              <div className="flow-step-card">
                <div className="flow-step-icon"><Upload size={18} /></div>
                <div>
                  <div className="flow-step-title">1. Upload Document</div>
                  <div className="flow-step-text">Add title, department, tags, and upload your file.</div>
                </div>
                <Link to="/upload" className="btn btn-secondary btn-sm">Go</Link>
              </div>
              <div className="flow-step-card">
                <div className="flow-step-icon"><Send size={18} /></div>
                <div>
                  <div className="flow-step-title">2. Submit For Approval</div>
                  <div className="flow-step-text">Open document details and select manager approvers.</div>
                </div>
                <Link to="/documents" className="btn btn-secondary btn-sm">Open Docs</Link>
              </div>
              <div className="flow-step-card">
                <div className="flow-step-icon"><Clock size={18} /></div>
                <div>
                  <div className="flow-step-title">3. Track Workflow</div>
                  <div className="flow-step-text">Monitor pending, approved, and rejected steps in real time.</div>
                </div>
                <Link to="/approvals" className="btn btn-secondary btn-sm">Track</Link>
              </div>
              <div className="flow-step-card">
                <div className="flow-step-icon"><CheckCircle size={18} /></div>
                <div>
                  <div className="flow-step-title">4. Download & Share</div>
                  <div className="flow-step-text">Access approved documents and share securely.</div>
                </div>
                <Link to="/documents" className="btn btn-secondary btn-sm">Browse</Link>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Pending Approvals */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Pending Approvals</h2>
              <Link to="/approvals" className="btn btn-ghost btn-sm"><ArrowUpRight size={16} /></Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {pending.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 20px' }}>
                  <CheckCircle size={32} />
                  <p>No pending approvals</p>
                </div>
              ) : (
                pending.map(item => (
                  <div key={item.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.document_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>from {item.requester_name}</div>
                    </div>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Documents</h2>
              <Link to="/documents" className="btn btn-ghost btn-sm"><ArrowUpRight size={16} /></Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recent.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 20px' }}>
                  <FileText size={32} />
                  <p>No documents yet</p>
                </div>
              ) : (
                recent.slice(0, 6).map(doc => (
                  <Link key={doc.id} to={`/documents/${doc.id}`} style={{ padding: '14px 24px', borderBottom: '1px solid var(--bg-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.owner_name} · {doc.department_name || 'No dept'}</div>
                    </div>
                    <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Documents by Department</h2>
          </div>
          <div className="card-body">
            {deptBreakdown.length === 0 ? (
              <div className="empty-state"><Building2 size={32} /><p>No departments</p></div>
            ) : (
              deptBreakdown.map(dept => (
                <div key={dept.department} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{dept.department}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{dept.count} docs</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${(parseInt(dept.count) / maxDocs) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
