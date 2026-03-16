import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/client';

export default function DocumentPreview({ documentId, collapsed = false }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    if (!documentId || isCollapsed) return;

    const fetchPreview = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/documents/${documentId}`);
        setPreview(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load document');
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [documentId, isCollapsed]);

  if (!documentId) return null;

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="card" style={{ marginBottom: 16, border: '1px solid var(--accent-primary-glow)' }}>
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={toggleCollapse}
      >
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
          <FileText size={16} style={{ marginRight: 8, display: 'inline' }} />
          Document Preview
        </h3>
        <button className="btn-ghost" onClick={toggleCollapse} style={{ padding: 0 }}>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="card-body">
          {loading ? (
            <div className="text-center p-8">
              <div className="spinner" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading preview...</p>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <FileText size={40} style={{ color: 'var(--error)' }} />
              <p style={{ color: 'var(--error)', marginTop: 8 }}>{error}</p>
            </div>
          ) : preview ? (
            <div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--bg-glass-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{preview.title}</h4>
                {preview.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {preview.description}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Owner:</span>{' '}
                    <span style={{ fontWeight: 500 }}>{preview.owner_name}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                    <span style={{ fontWeight: 500 }}>{preview.department_name || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>File Type:</span>{' '}
                    <span style={{ fontWeight: 500, textTransform: 'uppercase' }}>{preview.file_type?.split('/').pop() || '-'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Size:</span>{' '}
                    <span style={{ fontWeight: 500 }}>
                      {preview.file_size ? `${(preview.file_size / 1024).toFixed(1)} KB` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <DocumentFilePreview fileType={preview.file_type} documentId={documentId} fileName={preview.title} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DocumentFilePreview({ fileType, documentId, fileName }) {
  const [fileUrl, setFileUrl] = useState('');
  const [fileLoading, setFileLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    const fetchFile = async () => {
      setFileLoading(true);
      setFetchError('');
      try {
        console.log(`Fetching preview for document ${documentId}, expecting type: ${fileType}`);
        const res = await api.get(`/documents/${documentId}/download`, { responseType: 'blob' });
        
        if (cancelled) return;
        
        console.log(`Blob size: ${res.data.size}, blob type: ${res.data.type}, file_type: ${fileType}`);
        
        if (!res.data || res.data.size === 0) {
          console.warn('Empty blob received');
          setFetchError('File appears to be empty');
          setFileUrl('');
          return;
        }
        
        objectUrl = URL.createObjectURL(res.data);
        console.log(`Created object URL: ${objectUrl}`);
        setFileUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err.response?.data?.error || err.message || 'Failed to load file';
          console.error('File fetch error:', errorMsg);
          setFetchError(errorMsg);
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
  }, [documentId]);

  if (fileLoading) {
    return (
      <div className="text-center p-8">
        <div className="spinner" style={{ marginBottom: 8 }} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading file preview...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="empty-state" style={{ padding: 32, backgroundColor: 'rgba(220, 38, 38, 0.1)', borderRadius: 8, border: '1px solid rgba(220, 38, 38, 0.3)' }}>
        <FileText size={44} style={{ marginBottom: 12, color: 'var(--error)' }} />
        <p style={{ fontSize: 13, color: 'var(--error)', fontWeight: 500 }}>Error loading preview</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{fetchError}</p>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="empty-state" style={{ padding: 32 }}>
        <FileText size={44} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preview not available for this file type</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>File type: {fileType || 'unknown'}</p>
      </div>
    );
  }

  // PDF Preview - check both file_type and blob type
  const isPdf = fileType?.toLowerCase().includes('pdf') || fileUrl?.toLowerCase?.().includes('pdf');
  if (isPdf || (fileUrl && fileType?.toLowerCase().startsWith('application/pdf'))) {
    return (
      <div style={{ height: 400, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bg-glass-border)', backgroundColor: 'white' }}>
        <iframe
          src={fileUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 8,
          }}
          title={fileName}
          onError={() => {
            console.error('iframe failed to load');
          }}
        />
      </div>
    );
  }

  // Image Preview
  const isImage = fileType?.toLowerCase().includes('image');
  if (isImage) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }}>
        <img
          src={fileUrl}
          alt={fileName}
          style={{
            maxWidth: '100%',
            maxHeight: 400,
            borderRadius: 8,
            border: '1px solid var(--bg-glass-border)',
          }}
          onError={() => {
            console.error('Image failed to load');
          }}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="empty-state" style={{ padding: 32 }}>
      <FileText size={44} style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preview not available</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>File type: {fileType}</p>
    </div>
  );
}
