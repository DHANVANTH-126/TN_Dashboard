import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle, XCircle, FileText, Download, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function DocumentViewer() {
  const { id } = useParams();
  const { user } = useAuthStore();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fileUrl, setFileUrl] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const isEmployee = user?.role === 'employee';
  const latestWorkflow = doc?.workflows?.[0] || null;

  useEffect(() => {
    let cancelled = false;

    const fetchDocument = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/documents/${id}`);
        if (!cancelled) setDoc(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load document.');
          setDoc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDocument();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    const fetchFile = async () => {
      if (!doc?.id || isEmployee) {
        setFileUrl('');
        setFileLoading(false);
        return;
      }

      setFileLoading(true);
      try {
        console.log(`Fetching file for document ${doc.id}...`);
        const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
        
        if (cancelled) return;
        
        console.log(`Blob received: size=${res.data.size}, type=${res.data.type}`);
        
        if (!res.data || res.data.size === 0) {
          console.warn('Empty blob received from server');
          setFileUrl('');
          return;
        }
        
        objectUrl = URL.createObjectURL(res.data);
        console.log(`Object URL created: ${objectUrl}`);
        setFileUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch file';
          console.error('File fetch error:', errorMsg);
          setFileUrl('');
        }
      } finally {
        if (!cancelled) setFileLoading(false);
      }
    };

    fetchFile();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc?.id, isEmployee]);

  useEffect(() => {
    if (!showApprovalModal) return;

    api.get('/users/approvers')
      .then((r) => {
        const allUsers = r.data.users || [];
        setManagers(allUsers.filter((u) => u.role === 'manager' || u.role === 'admin'));
      })
      .catch(() => {
        setManagers([]);
      });
  }, [showApprovalModal]);

  const selectableApprovers = useMemo(
    () => managers.filter((m) => m.id !== user?.id),
    [managers, user?.id]
  );

  const toggleApprover = (managerId) => {
    setSelectedApprovers((prev) =>
      prev.includes(managerId) ? prev.filter((x) => x !== managerId) : [...prev, managerId]
    );
  };

  const submitForApproval = async () => {
    if (!doc?.id) return;
    if (selectedApprovers.length === 0) {
      toast.error('Select at least one manager');
      return;
    }

    setSubmittingApproval(true);
    try {
      await api.post('/approvals', {
        document_id: parseInt(doc.id, 10),
        approver_ids: selectedApprovers,
      });
      toast.success('Sent to manager for approval');
      setShowApprovalModal(false);
      setSelectedApprovers([]);

      const refreshed = await api.get(`/documents/${id}`);
      setDoc(refreshed.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit for approval');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleDownloadClick = () => {
    if (!fileUrl || !doc) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.file_name || doc.title || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center p-8">Loading document...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!doc) return <div className="text-center p-8">Document not found.</div>;

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/documents" className="btn btn-ghost"><ChevronLeft size={18} /></Link>
          <h1 className="topbar-title">{doc.title}</h1>
        </div>
        <div className="topbar-actions">
          {!isEmployee && (
            <button
              type="button"
              onClick={handleDownloadClick}
              className="btn btn-secondary btn-sm"
              disabled={!fileUrl}
            >
              <Download size={16} /> Download
            </button>
          )}
          {doc.status === 'draft' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowApprovalModal(true)}>
              <Send size={16} /> Submit for Approval
            </button>
          )}
        </div>
      </div>

      <div className="page-content fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div>
            {!isEmployee ? (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header"><h2 style={{ fontSize: 16, fontWeight: 700 }}>Document Preview</h2></div>
                <div className="card-body">
                  {fileLoading ? (
                    <div className="text-center p-8" style={{ padding: '40px 24px' }}>
                      <div className="spinner" style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading preview...</p>
                    </div>
                  ) : !fileUrl ? (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <FileText size={48} />
                      <h3>Preview not available</h3>
                      <p>File type: {doc.file_type || 'unknown'}</p>
                      <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>Use Download to open this file.</p>
                    </div>
                  ) : doc.file_type?.toLowerCase().includes('pdf') ? (
                    <iframe 
                      src={fileUrl} 
                      style={{ width: '100%', height: 500, border: 'none', borderRadius: 8, backgroundColor: 'white' }} 
                      title="PDF Preview"
                      onError={() => console.error('PDF iframe failed to load')}
                    />
                  ) : doc.file_type?.toLowerCase().includes('image') ? (
                    <img 
                      src={fileUrl} 
                      alt={doc.title} 
                      style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 500, display: 'block', margin: '0 auto' }}
                      onError={() => console.error('Image failed to load')}
                    />
                  ) : (
                    <div className="empty-state" style={{ padding: 40 }}>
                      <FileText size={48} />
                      <h3>Preview not available</h3>
                      <p>File type: {doc.file_type || 'unknown'}</p>
                      <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>Download to view this file</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header"><h2 style={{ fontSize: 16, fontWeight: 700 }}>Document Status</h2></div>
                <div className="card-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ marginBottom: 16 }}>
                    {doc.status === 'approved' ? <CheckCircle size={48} style={{ color: 'var(--success)' }} /> :
                     doc.status === 'rejected' ? <XCircle size={48} style={{ color: 'var(--error)' }} /> :
                     doc.status === 'pending' ? <Clock size={48} style={{ color: 'var(--warning)' }} /> :
                     <FileText size={48} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, textTransform: 'capitalize' }}>{doc.status}</h3>
                </div>
              </div>
            )}

            {latestWorkflow && (
              <div className="card">
                <div className="card-header">
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Approval Workflow</h2>
                  <span className={`badge badge-${latestWorkflow.status}`}>{latestWorkflow.status}</span>
                </div>
                <div className="card-body">
                  <div className="timeline">
                    {(latestWorkflow.steps || []).map((step) => (
                      <div key={step.id} className="timeline-item">
                        <div className={`timeline-dot ${step.status}`} />
                        <div className="timeline-content">
                          <h4>Step {step.step_order}: {step.approver_name}</h4>
                          <p>
                            {step.status === 'pending'
                              ? 'Awaiting action'
                              : `${step.status.charAt(0).toUpperCase() + step.status.slice(1)}${step.actioned_at ? ` · ${new Date(step.actioned_at).toLocaleString()}` : ''}`}
                          </p>
                          {step.comments && <p style={{ marginTop: 4, fontStyle: 'italic' }}>"{step.comments}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h2 style={{ fontSize: 16, fontWeight: 700 }}>Details</h2></div>
              <div className="card-body" style={{ fontSize: 14 }}>
                {[
                  ['Status', <span className={`badge badge-${doc.status}`}>{doc.status}</span>],
                  ['Owner', doc.owner_name],
                  ['Department', doc.department_name || '-'],
                  ['Version', `v${doc.current_version}`],
                  ['File Type', doc.file_type || '-'],
                  ['Size', doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-glass-border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit to Manager for Approval</h3>
              <button className="btn-ghost" onClick={() => setShowApprovalModal(false)}>x</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Manager(s) to Approve</label>
                {selectableApprovers.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <p>No managers available</p>
                  </div>
                ) : (
                  selectableApprovers.map((mgr) => (
                    <label
                      key={mgr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        marginBottom: 6,
                        background: selectedApprovers.includes(mgr.id) ? 'var(--accent-primary-glow)' : 'var(--bg-glass)',
                        border: selectedApprovers.includes(mgr.id) ? '1px solid var(--accent-primary)' : '1px solid var(--bg-glass-border)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedApprovers.includes(mgr.id)}
                        onChange={() => toggleApprover(mgr.id)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{mgr.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {mgr.email} · <span style={{ textTransform: 'capitalize' }}>{mgr.role}</span>
                          {mgr.department_name ? ` · ${mgr.department_name}` : ''}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApprovalModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={submitForApproval}
                disabled={selectedApprovers.length === 0 || submittingApproval}
              >
                <Send size={16} /> Send for Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
