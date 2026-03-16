import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Filter, File, Image, FileSpreadsheet } from 'lucide-react';
import api from '../api/client';

function getFileIcon(type) {
  if (!type) return <FileText size={20} />;
  if (type.includes('pdf')) return <FileText size={20} />;
  if (type.includes('image')) return <Image size={20} />;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet size={20} />;
  return <File size={20} />;
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.departments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [status, deptFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (deptFilter) params.department_id = deptFilter;
      const res = await api.get('/documents', { params });
      setDocs(res.data.documents || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return fetchDocuments();
    setLoading(true);
    try {
      const params = { q: query };
      if (status) params.status = status;
      if (deptFilter) {
        const dept = departments.find(d => String(d.id) === String(deptFilter));
        if (dept) params.department = dept.name;
      }
      const res = await api.get('/search', { params });
      setDocs(res.data.results || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Documents</h1>
        <div className="topbar-actions">
          <Link to="/upload" className="btn btn-primary btn-sm">+ Upload</Link>
        </div>
      </div>
      <div className="page-content fade-in">
        {/* Search & Filters */}
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              id="doc-search"
              placeholder="Search documents by title, description, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 140 }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="form-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleSearch}><Filter size={16} /> Search</button>
        </div>

        {/* Results */}
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          {total} document{total !== 1 ? 's' : ''} found
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No documents found</h3>
            <p>Upload your first document or adjust your search filters.</p>
          </div>
        ) : (
          <div className="doc-grid">
            {docs.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`} style={{ textDecoration: 'none' }}>
                <div className="doc-card">
                  <div className="doc-card-header">
                    <div className="doc-card-icon">{getFileIcon(doc.file_type)}</div>
                    <div>
                      <div className="doc-card-title">{doc.title}</div>
                      <div className="doc-card-meta">{doc.owner_name} · {new Date(doc.created_at || doc.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {doc.description && <div className="doc-card-desc">{doc.description}</div>}
                  <div className="doc-card-footer">
                    <div className="doc-card-tags">
                      {(Array.isArray(doc.tags) ? doc.tags : []).slice(0, 3).map((tag, i) => (
                        <span key={i} className="doc-tag">{tag}</span>
                      ))}
                    </div>
                    <span className={`badge badge-${doc.status}`}>{doc.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
