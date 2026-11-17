import React, { useEffect, useState } from 'react';
import { Plus, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, Users, Zap } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function UnavailabilityManager() {
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/unavailability').then(r => setUnavailabilities(r.data));
    api.get('/teachers').then(r => setTeachers(r.data));
    api.get('/timetable').then(r => setTimetables(r.data));
  };
  useEffect(() => { load(); }, []);

  const openModal = () => {
    setForm({
      teacher: '',
      type: 'leave',
      startDate: '',
      endDate: '',
      isFullDay: true,
      specificSlots: [],
      reason: ''
    });
    setModal('create');
  };

  const addUnavailability = async e => {
    e.preventDefault();
    try {
      await api.post('/unavailability', form);
      toast.success('Unavailability added');
      setModal(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/unavailability/${id}/status`, { status });
    toast.success(`${status === 'approved' ? 'Approved' : 'Rejected'}`);
    load();
  };

  const checkConflicts = async () => {
    if (!form.timetableId || !form.startDate || !form.endDate) {
      toast.error('Please select timetable and date range');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post('/unavailability/check-conflicts', {
        timetableId: form.timetableId,
        startDate: form.startDate,
        endDate: form.endDate
      });
      setConflicts(data.conflicts);
      toast.success(`Found ${data.totalConflicts} conflicts`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const autoAssignSubstitutes = async () => {
    if (conflicts.length === 0) return;
    
    try {
      const { data } = await api.post('/unavailability/auto-assign-substitutes', {
        timetableId: form.timetableId,
        conflicts
      });
      toast.success(data.message);
      setConflicts([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const del = async id => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/unavailability/${id}`);
    toast.success('Deleted'); load();
  };

  const pending = unavailabilities.filter(u => u.status === 'pending');
  const approved = unavailabilities.filter(u => u.status === 'approved');

  const typeColors = {
    leave: '#ef4444',
    exam_duty: '#f59e0b',
    event: '#8b5cf6',
    meeting: '#06b6d4',
    training: '#10b981',
    other: '#6b7280'
  };

  const typeIcons = {
    leave: '🏖️',
    exam_duty: '📝',
    event: '🎉',
    meeting: '👥',
    training: '📚',
    other: '📋'
  };

  return (
    <div className="page">
      <div className="topbar">
        <h2>Teacher Unavailability</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={16} /> Add Unavailability
          </button>
          <button className="btn btn-secondary" onClick={() => setModal('conflicts')}>
            <AlertTriangle size={16} /> Check Conflicts
          </button>
        </div>
      </div>

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="card" style={{ marginTop: 24, borderTop: '3px solid #f59e0b' }}>
          <div className="card-header">
            <span className="card-title">Pending Approvals ({pending.length})</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Teacher</th><th>Type</th><th>Period</th><th>Reason</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pending.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.teacher?.name}</strong></td>
                    <td>
                      <span style={{ color: typeColors[u.type] }}>
                        {typeIcons[u.type]} {u.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        {new Date(u.startDate).toLocaleDateString()} - {new Date(u.endDate).toLocaleDateString()}
                        {u.isFullDay ? ' (Full Day)' : ' (Specific Slots)'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{u.reason || '-'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(u._id, 'approved')}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(u._id, 'rejected')}>
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Unavailabilities */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-title">Active Unavailabilities ({approved.length})</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Teacher</th><th>Type</th><th>Period</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {approved.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.teacher?.name}</strong></td>
                  <td>
                    <span style={{ color: typeColors[u.type] }}>
                      {typeIcons[u.type]} {u.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      {new Date(u.startDate).toLocaleDateString()} - {new Date(u.endDate).toLocaleDateString()}
                      <br />
                      {u.isFullDay ? (
                        <span style={{ color: '#dc2626' }}>Full Day</span>
                      ) : (
                        <span style={{ color: '#2563eb' }}>Specific Slots</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{u.reason || '-'}</td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => del(u._id)}>Remove</button>
                  </td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No active unavailabilities</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Unavailability Modal */}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Teacher Unavailability</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={addUnavailability}>
              <div className="form-group">
                <label className="form-label">Teacher</label>
                <select className="form-select" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="leave">🏖️ Leave</option>
                    <option value="exam_duty">📝 Exam Duty</option>
                    <option value="event">🎉 Event</option>
                    <option value="meeting">👥 Meeting</option>
                    <option value="training">📚 Training</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select className="form-select" value={form.isFullDay} onChange={e => setForm({ ...form, isFullDay: e.target.value === 'true' })}>
                    <option value="true">Full Day</option>
                    <option value="false">Specific Slots</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input className="form-input" type="date" value={form.startDate} 
                    onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input className="form-input" type="date" value={form.endDate} 
                    onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} 
                  placeholder="Brief description" />
              </div>
              
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Add Unavailability
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Checker Modal */}
      {modal === 'conflicts' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Check Timetable Conflicts</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>×</button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Timetable</label>
                <select className="form-select" value={form.timetableId} onChange={e => setForm({ ...form, timetableId: e.target.value })}>
                  <option value="">Select Timetable</option>
                  {timetables.map(t => <option key={t._id} value={t._id}>{t.name} ({t.fitnessScore}%)</option>)}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.startDate} 
                  onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={form.endDate} 
                  onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="btn btn-secondary" onClick={checkConflicts} disabled={loading}>
                <AlertTriangle size={14} /> {loading ? 'Checking...' : 'Check Conflicts'}
              </button>
              {conflicts.length > 0 && (
                <button className="btn btn-primary" onClick={autoAssignSubstitutes}>
                  <Zap size={14} /> Auto-Assign Substitutes ({conflicts.length})
                </button>
              )}
            </div>
            
            {conflicts.length > 0 && (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <h4 style={{ color: '#dc2626', marginBottom: 12 }}>Found {conflicts.length} Conflicts:</h4>
                {conflicts.map((conflict, i) => (
                  <div key={i} style={{ 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: 6, 
                    padding: 12, 
                    marginBottom: 8,
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 600, color: '#dc2626' }}>
                      {conflict.entry.teacher?.name} - {conflict.entry.class?.name}
                    </div>
                    <div style={{ color: '#7f1d1d' }}>
                      {conflict.entry.subject?.name} | {conflict.entry.day} P{conflict.entry.period}
                    </div>
                    <div style={{ color: '#991b1b', marginTop: 4 }}>
                      Conflict: {typeIcons[conflict.unavailability.type]} {conflict.unavailability.type.replace('_', ' ')} 
                      ({new Date(conflict.unavailability.startDate).toLocaleDateString()})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}