import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, XCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import DocumentPreview from '../components/DocumentPreview';

function formatStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StepTimeline({ steps }) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No approval steps found.</p>;
  }

  return (
    <div className="timeline">
      {steps.map((step) => (
        <div key={step.id} className="timeline-item">
          <div className={`timeline-dot ${step.status}`} />
          <div className="timeline-content">
            <h4>
              Step {step.step_order} - {step.approver_name}
            </h4>
            <p>
              {formatStatus(step.status)}
              {step.actioned_at ? ` - ${new Date(step.actioned_at).toLocaleString()}` : ''}
            </p>
            {step.comments ? <p style={{ marginTop: 4 }}>&quot;{step.comments}&quot;</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Approvals() {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState([]);
  const [pendingSteps, setPendingSteps] = useState([]);
  const [status, setStatus] = useState('');
  const [commentsByStep, setCommentsByStep] = useState({});
  const [actingStepId, setActingStepId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const pendingByWorkflow = useMemo(() => {
    const map = new Map();
    for (const step of pendingSteps) {
      map.set(step.workflow_id, step);
    }
    return map;
  }, [pendingSteps]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const [wfRes, pendingRes] = await Promise.all([
        api.get('/approvals', { params }),
        api.get('/approvals/my-pending'),
      ]);
      setWorkflows(wfRes.data.workflows || []);
      setPendingSteps(pendingRes.data.pending || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  const takeAction = async (workflowId, stepId, action) => {
    setActingStepId(stepId);
    try {
      await api.post(`/approvals/${workflowId}/steps/${stepId}/action`, {
        action,
        comments: commentsByStep[stepId] || '',
      });
      toast.success(`Step ${action}`);
      setCommentsByStep((prev) => ({ ...prev, [stepId]: '' }));
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update step');
    } finally {
      setActingStepId(null);
    }
  };

  const handleDownloadDocument = async (docId, docTitle) => {
    if (downloadingDocId) return;
    setDownloadingDocId(docId);
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = docTitle || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to download document');
    } finally {
      setDownloadingDocId(null);
    }
  };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Approvals</h1>
        <div className="topbar-actions">
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: 170 }}
          >
            <option value="">All Workflows</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="page-content fade-in">
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card blue">
            <div className="stat-icon blue">
              <Clock3 size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-label">My Pending Steps</div>
              <div className="stat-value">{pendingSteps.length}</div>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon purple">
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Visible Workflows</div>
              <div className="stat-value">{workflows.length}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="spinner" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="empty-state">
            <Clock3 size={48} />
            <h3>No workflows found</h3>
            <p>Create and submit a document for approval to start a workflow.</p>
          </div>
        ) : (
          workflows.map((workflow) => {
            const myPendingStep = pendingByWorkflow.get(workflow.id);
            const canAct = Boolean(myPendingStep) && (user?.role === 'admin' || myPendingStep.approver_id === user?.id);

            return (
              <div key={workflow.id} className="workflow-card">
                <div className="workflow-header" style={{ cursor: 'default' }}>
                  <div>
                    <h3>{workflow.document_title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Workflow #{workflow.id} - Requested by {workflow.created_by_name}
                    </p>
                  </div>
                  <span className={`badge badge-${workflow.status}`}>{workflow.status}</span>
                </div>

                <StepTimeline steps={workflow.steps} />

                {canAct ? (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bg-glass-border)' }}>
                    <DocumentPreview documentId={workflow.document_id} collapsed={false} />

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadDocument(workflow.document_id, workflow.document_title)}
                      disabled={downloadingDocId === workflow.document_id}
                      style={{ marginBottom: 14, width: '100%' }}
                    >
                      <Download size={14} /> Download Document
                    </button>

                    <label className="form-label">Comment (optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Add approval or rejection notes..."
                      value={commentsByStep[myPendingStep.id] || ''}
                      onChange={(e) =>
                        setCommentsByStep((prev) => ({
                          ...prev,
                          [myPendingStep.id]: e.target.value,
                        }))
                      }
                      style={{ minHeight: 90, marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => takeAction(workflow.id, myPendingStep.id, 'approved')}
                        disabled={actingStepId === myPendingStep.id}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => takeAction(workflow.id, myPendingStep.id, 'rejected')}
                        disabled={actingStepId === myPendingStep.id}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
