import React, { useEffect, useState } from 'react';
import { Plus, UserCheck, Users, RefreshCw, X, CheckCircle, XCircle, Clock, ArrowRightLeft } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SubstituteManager() {
  const [substitutes, setSubstitutes] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [modal, setModal] = useState(null); // 'substitute' or 'swap'
  const [form, setForm] = useState({});
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/substitutes').then(r => setSubstitutes(r.data));
    api.get('/timetable').then(r => setTimetables(r.data));
  };
  useEffect(() => { load(); }, []);

  const openSubstitute = () => {
    setForm({ timetableId: '', day: '', period: '', originalEntry: {}, reason: '', isLibrary: false });
    setModal('substitute');
  };

  const openSwap = () => {
    setForm({ timetableId: '', originalEntry: {}, swapWith: {}, reason: '' });
    setModal('swap');
  };

  const findSubstitute = async () => {
    if (!form.timetableId || !form.day || !form.period) return;
    setLoading(true);
    try {
      const r = await api.post('/substitutes/find-substitute', {
        timetableId: form.timetableId,
        day: form.day,
        period: parseInt(form.period)
      });
      setAvailableTeachers(r.data.available);
      toast.success(`Found ${r.data.available.length} available teachers`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const assignSubstitute = async e => {
    e.preventDefault();
    try {
      await api.post('/substitutes/assign', {
        timetableId: form.timetableId,
        originalEntry: {
          day: form.day,
          period: parseInt(form.period),
          class: form.classId,
          subject: form.subjectId,
          teacher: form.originalTeacherId,
          classroom: form.classroomId
        },
        substituteTeacher: form.isLibrary ? null : form.substituteTeacher,
        isLibrary: form.isLibrary,
        reason: form.reason
      });
      toast.success(form.isLibrary ? 'Library period assigned' : 'Substitute assigned');
      setModal(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const requestSwap = async e => {
    e.preventDefault();
    try {
      await api.post('/substitutes/swap-request', {
        timetableId: form.timetableId,
        originalEntry: {
          day: form.day1,
          period: parseInt(form.period1),
          teacher: form.teacher1
        },
        swapWith: {
          day: form.day2,
          period: parseInt(form.period2),
          teacher: form.teacher2
        },
        requestedBy: form.teacher1,
        reason: form.reason
      });
      toast.success('Swap request submitted');
      setModal(null); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/substitutes/${id}/status`, { status });
    toast.success(`${status === 'approved' ? 'Approved' : 'Rejected'}`);
    load();
  };

  const del = async id => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/substitutes/${id}`);
    toast.success('Deleted'); load();
  };

  const pendingSwaps = substitutes.filter(s => s.type === 'swap' && s.status === 'pending');
  const approvedSubs = substitutes.filter(s => s.status === 'approved');

  return (
    <div className="page">
      <div className="topbar">
        <h2>Substitute Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={openSubstitute}><UserCheck size={16} /> Assign Substitute</button>
          <button className="btn btn-secondary" onClick={openSwap}><ArrowRightLeft size={16} /> Request Swap</button>
        </div>
      </div>

      {/* Pending Swap Requests */}
      {pendingSwaps.length > 0 && (
        <div className="card" style={{ marginTop: 24, borderTop: '3px solid #f59e0b' }}>
          <div className="card-header">
            <span className="card-title">Pending Swap Requests ({pendingSwaps.length})</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Requested By</th><th>Original Slot</th><th>Swap With</th><th>Reason</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pendingSwaps.map(s => (
                  <tr key={s._id}>
                    <td><strong>{s.requestedBy?.name}</strong></td>
                    <td>{s.originalEntry.day} P{s.originalEntry.period}</td>
                    <td>{s.swapWith.day} P{s.swapWith.period} ({s.swapWith.teacher?.name})</td>
                    <td>{s.reason || '-'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(s._id, 'approved')}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(s._id, 'rejected')}>
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

      {/* Active Substitutes & Approved Swaps */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-title">Active Substitutes & Swaps ({approvedSubs.length})</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Type</th><th>Original</th><th>Assignment</th><th>Reason</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {approvedSubs.map(s => (
                <tr key={s._id}>
                  <td>
                    <span className={`badge ${s.type === 'substitute' ? 'badge-blue' : 'badge-purple'}`}>
                      {s.type === 'substitute' ? 'Substitute' : 'Swap'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div><strong>{s.originalEntry.class?.name}</strong> - {s.originalEntry.subject?.name}</div>
                      <div style={{ color: '#64748b' }}>{s.originalEntry.day} P{s.originalEntry.period} ({s.originalEntry.teacher?.name})</div>
                    </div>
                  </td>
                  <td>
                    {s.type === 'substitute' ? (
                      s.isLibrary ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>📚 Library Period</span>
                      ) : (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>{s.substituteTeacher?.name}</span>
                      )
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#7c3aed' }}>
                        Swapped with {s.swapWith.teacher?.name}<br />
                        {s.swapWith.day} P{s.swapWith.period}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.reason || '-'}</td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => del(s._id)}>Remove</button>
                  </td>
                </tr>
              ))}
              {approvedSubs.length === 0 && (
                <tr><td colSpan={6} className="empty-state">No active substitutes or swaps</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Substitute Assignment Modal */}
      {modal === 'substitute' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Assign Substitute Teacher</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}><X size={14} /></button>
            </div>
            <form onSubmit={assignSubstitute}>
              <div className="form-group">
                <label className="form-label">Timetable</label>
                <select className="form-select" value={form.timetableId} onChange={e => setForm({ ...form, timetableId: e.target.value })} required>
                  <option value="">Select Timetable</option>
                  {timetables.map(t => <option key={t._id} value={t._id}>{t.name} ({t.fitnessScore}%)</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} required>
                    <option value="">Select Day</option>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => 
                      <option key={d} value={d}>{d}</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select className="form-select" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required>
                    <option value="">Select Period</option>
                    {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <button type="button" className="btn btn-secondary" onClick={findSubstitute} disabled={loading}>
                  <RefreshCw size={14} /> {loading ? 'Finding...' : 'Find Available Teachers'}
                </button>
              </div>
              
              {availableTeachers.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Available Teachers ({availableTeachers.length})</label>
                  <select className="form-select" value={form.substituteTeacher} onChange={e => setForm({ ...form, substituteTeacher: e.target.value, isLibrary: false })}>
                    <option value="">Select Substitute Teacher</option>
                    {availableTeachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isLibrary" checked={form.isLibrary} 
                  onChange={e => setForm({ ...form, isLibrary: e.target.checked, substituteTeacher: '' })} />
                <label htmlFor="isLibrary" className="form-label" style={{ margin: 0 }}>
                  📚 Assign as Library Period (if no teacher available)
                </label>
              </div>
              
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} 
                  placeholder="e.g. Teacher on leave" />
              </div>
              
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {form.isLibrary ? '📚 Assign Library Period' : 'Assign Substitute'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {modal === 'swap' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Request Teacher Swap</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}><X size={14} /></button>
            </div>
            <form onSubmit={requestSwap}>
              <div className="form-group">
                <label className="form-label">Timetable</label>
                <select className="form-select" value={form.timetableId} onChange={e => setForm({ ...form, timetableId: e.target.value })} required>
                  <option value="">Select Timetable</option>
                  {timetables.map(t => <option key={t._id} value={t._id}>{t.name} ({t.fitnessScore}%)</option>)}
                </select>
              </div>
              
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#4f46e5' }}>Teacher A's Lecture</div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label">Day</label>
                    <select className="form-select" value={form.day1} onChange={e => setForm({ ...form, day1: e.target.value })}>
                      <option value="">Select Day</option>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => 
                        <option key={d} value={d}>{d}</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label">Period</label>
                    <select className="form-select" value={form.period1} onChange={e => setForm({ ...form, period1: e.target.value })}>
                      <option value="">Period</option>
                      {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>P{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff5f5', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>Teacher B's Lecture (Swap With)</div>
                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label">Day</label>
                    <select className="form-select" value={form.day2} onChange={e => setForm({ ...form, day2: e.target.value })}>
                      <option value="">Select Day</option>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => 
                        <option key={d} value={d}>{d}</option>
                      )}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label">Period</label>
                    <select className="form-select" value={form.period2} onChange={e => setForm({ ...form, period2: e.target.value })}>
                      <option value="">Period</option>
                      {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>P{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Reason for Swap</label>
                <input className="form-input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} 
                  placeholder="e.g. Personal commitment" />
              </div>
              
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowRightLeft size={16} /> Submit Swap Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}