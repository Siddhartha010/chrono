import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const empty = { name: '', code: '', hoursPerWeek: 3, isLab: false };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/subjects').then(r => setSubjects(r.data));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = s => { setForm({ name: s.name, code: s.code || '', hoursPerWeek: s.hoursPerWeek, isLab: s.isLab }); setEditing(s._id); setModal(true); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/subjects/${editing}`, form);
      else await api.post('/subjects', form);
      toast.success('Saved'); setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const del = async id => {
    if (!window.confirm('Delete subject?')) return;
    await api.delete(`/subjects/${id}`); toast.success('Deleted'); load();
  };

  return (
    <div className="page">
      <div className="topbar">
        <h2>Subjects</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Subject</button>
      </div>

      <div style={{ marginTop: 24 }} className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Code</th><th>Hours/Week</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.code || '-'}</td>
                  <td>{s.hoursPerWeek}</td>
                  <td><span className={`badge ${s.isLab ? 'badge-blue' : 'badge-purple'}`}>{s.isLab ? 'Lab' : 'Theory'}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(s._id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={5} className="empty-state">No subjects found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit' : 'Add'} Subject</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Code</label>
                  <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hours/Week</label>
                  <input className="form-input" type="number" min={1} max={10} value={form.hoursPerWeek}
                    onChange={e => setForm({ ...form, hoursPerWeek: +e.target.value })} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                  <input type="checkbox" id="isLab" checked={form.isLab} onChange={e => setForm({ ...form, isLab: e.target.checked })} />
                  <label htmlFor="isLab" className="form-label" style={{ margin: 0 }}>Lab Subject</label>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
