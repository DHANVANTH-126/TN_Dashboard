import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'text/plain': ['.txt'],
};

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.departments || [])).catch(() => {});
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      if (!title) setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!title.trim()) return toast.error('Title is required');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      if (departmentId) formData.append('department_id', departmentId);
      if (tags.length > 0) formData.append('tags', tags.join(','));

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Document uploaded successfully!');
      navigate(`/documents/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Upload Document</h1>
      </div>
      <div className="page-content fade-in">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Dropzone */}
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 24 }}>
                  <input {...getInputProps()} id="file-input" />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                      <FileText size={28} style={{ color: 'var(--accent-primary)' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatSize(file.size)}</div>
                      </div>
                      <button type="button" className="btn-ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }}><X size={18} /></button>
                    </div>
                  ) : (
                    <>
                      <Upload size={36} />
                      <p><span>Click to browse</span> or drag and drop</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, Word, Excel, Images, TXT — Max 50MB</p>
                    </>
                  )}
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input id="upload-title" type="text" className="form-input" placeholder="Enter document title"
                    value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea id="upload-desc" className="form-textarea" placeholder="Brief description of the document..."
                    value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select id="upload-dept" className="form-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Tags */}
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input type="text" className="form-input" placeholder="Add a tag..."
                      value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}><Tag size={14} /> Add</button>
                  </div>
                  {tags.length > 0 && (
                    <div className="doc-card-tags">
                      {tags.map(tag => (
                        <span key={tag} className="doc-tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>
                          {tag} <X size={10} style={{ marginLeft: 4 }} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button id="upload-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={uploading}>
                  {uploading ? <span className="spinner" /> : <><Upload size={18} /> Upload Document</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
