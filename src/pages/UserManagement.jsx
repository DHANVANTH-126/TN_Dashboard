import { useState, useEffect } from 'react';
import { Users, Edit, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', department_id: '', is_active: true });

  useEffect(() => {
    Promise.all([
      api.get('/users').then(r => setUsers(r.data.users || [])),
      api.get('/departments').then(r => setDepartments(r.data.departments || []))
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startEdit = (u) => {
    setEditing(u.id);
    setEditForm({ role: u.role, department_id: u.department_id || '', is_active: u.is_active });
  };

  const saveEdit = async () => {
    try {
      await api.put(`/users/${editing}`, editForm);
      toast.success('User updated');
      setEditing(null);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) { toast.error('Update failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">User Management</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{users.length} users</div>
      </div>
      <div className="page-content fade-in">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-draft" style={{ textTransform: 'capitalize' }}><Shield size={10} style={{ marginRight: 4 }} />{u.role}</span></td>
                  <td>{u.department_name || '—'}</td>
                  <td>{u.is_active ? <span className="badge badge-approved">Active</span> : <span className="badge badge-rejected">Inactive</span>}</td>
                  <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}><Edit size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit User</h3><button className="btn-ghost" onClick={() => setEditing(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={editForm.department_id} onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} /> Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
