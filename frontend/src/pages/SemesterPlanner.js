import React, { useEffect, useState } from 'react';
import { Calendar, Plus, AlertTriangle, CheckCircle, Clock, BarChart3, Settings, Trash2, Edit2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SemesterPlanner() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('semester');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    academicCalendar: {
      weeklySchedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periodsPerDay: 6
    },
    bufferSlots: {
      enabled: true,
      slotsPerWeek: 2,
      preferredDays: ['Friday'],
      preferredPeriods: [7, 8]
    },
    doublePeriods: {
      enabled: true,
      maxPerDay: 2,
      minGapBetween: 1
    },
    redistributionSettings: {
      autoRedistribute: true,
      prioritizeCore: true,
      allowWeekendClasses: false,
      maxDailyHours: 8
    }
  });
  
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'institutional'
  });

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const response = await api.get('/semesters');
      setSemesters(response.data);
      if (response.data.length > 0 && !selectedSemester) {
        setSelectedSemester(response.data[0]);
      }
    } catch (err) {
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const saveSemester = async (e) => {
    e.preventDefault();
    try {
      if (selectedSemester && modalType === 'semester') {
        await api.put(`/semesters/${selectedSemester._id}`, form);
        toast.success('Semester updated');
      } else {
        await api.post('/semesters', form);
        toast.success('Semester created');
      }
      setShowModal(false);
      loadSemesters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save semester');
    }
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    if (!selectedSemester) return;
    
    try {
      const response = await api.post(`/semesters/${selectedSemester._id}/holidays`, holidayForm);
      toast.success('Holiday added and impact analyzed');
      setSelectedSemester(response.data.semester);
      setShowModal(false);
      setHolidayForm({ name: '', startDate: '', endDate: '', type: 'institutional' });
      
      if (response.data.impact) {
        showImpactAnalysis(response.data.impact);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  const showImpactAnalysis = (impact) => {
    const message = `Holiday Impact Analysis:
• ${impact.affectedDays} teaching days affected
• ${impact.totalLostPeriods} periods need redistribution
• ${impact.affectedClasses} classes impacted

Redistribution suggestions available.`;
    
    if (window.confirm(message + '\n\nWould you like to auto-redistribute classes?')) {
      redistributeClasses('buffer');
    }
  };

  const redistributeClasses = async (strategy) => {
    if (!selectedSemester) return;
    
    try {
      const response = await api.post(`/semesters/${selectedSemester._id}/redistribute`, {
        strategy
      });
      toast.success('Classes redistributed successfully');
      console.log('Redistribution results:', response.data.results);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to redistribute classes');
    }
  };

  const openModal = (type, semester = null) => {
    setModalType(type);
    if (type === 'semester' && semester) {
      setForm({
        name: semester.name,
        startDate: semester.startDate?.split('T')[0] || '',
        endDate: semester.endDate?.split('T')[0] || '',
        academicCalendar: semester.academicCalendar || form.academicCalendar,
        bufferSlots: semester.bufferSlots || form.bufferSlots,
        doublePeriods: semester.doublePeriods || form.doublePeriods,
        redistributionSettings: semester.redistributionSettings || form.redistributionSettings
      });
    }
    setShowModal(true);
  };

  const deleteSemester = async (id) => {
    if (!window.confirm('Delete this semester? This will also delete all related progress data.')) return;
    
    try {
      await api.delete(`/semesters/${id}`);
      toast.success('Semester deleted');
      loadSemesters();
      if (selectedSemester?._id === id) {
        setSelectedSemester(null);
      }
    } catch (err) {
      toast.error('Failed to delete semester');
    }
  };

  const calculateProgress = (semester) => {
    if (!semester.academicCalendar) return { total: 0, actual: 0, percentage: 0 };
    
    const total = semester.academicCalendar.totalTeachingDays || 0;
    const actual = semester.academicCalendar.actualTeachingDays || 0;
    const percentage = total > 0 ? Math.round((actual / total) * 100) : 0;
    
    return { total, actual, percentage };
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="topbar">
        <h2>Semester Planner</h2>
        <button className="btn btn-primary" onClick={() => openModal('semester')}>
          <Plus size={16} /> New Semester
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Semesters</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {semesters.map(semester => {
              const progress = calculateProgress(semester);
              return (
                <div 
                  key={semester._id}
                  className={`semester-item ${selectedSemester?._id === semester._id ? 'active' : ''}`}
                  onClick={() => setSelectedSemester(semester)}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: selectedSemester?._id === semester._id ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{semester.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
                    {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className={`badge ${
                      semester.status === 'active' ? 'badge-green' :
                      semester.status === 'completed' ? 'badge-blue' : 'badge-secondary'
                    }`}>
                      {semester.status}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {progress.actual}/{progress.total} days
                    </span>
                  </div>
                </div>
              );
            })}
            {semesters.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>
                <Calendar size={32} />
                <p>No semesters created yet</p>
              </div>
            )}
          </div>
        </div>

        <div>
          {selectedSemester ? (
            <>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">{selectedSemester.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openModal('semester', selectedSemester)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSemester(selectedSemester._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  <div className="stat-card">
                    <div className="stat-icon blue"><Calendar size={20} /></div>
                    <div>
                      <div className="stat-value">{calculateProgress(selectedSemester).total}</div>
                      <div className="stat-label">Total Teaching Days</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={20} /></div>
                    <div>
                      <div className="stat-value">{calculateProgress(selectedSemester).actual}</div>
                      <div className="stat-label">Available Days</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon orange"><AlertTriangle size={20} /></div>
                    <div>
                      <div className="stat-value">{selectedSemester.holidays?.length || 0}</div>
                      <div className="stat-label">Holidays</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon purple"><BarChart3 size={20} /></div>
                    <div>
                      <div className="stat-value">{calculateProgress(selectedSemester).percentage}%</div>
                      <div className="stat-label">Availability</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                  <span className="card-title">Holiday Calendar</span>
                  <button className="btn btn-primary btn-sm" onClick={() => openModal('holiday')}>
                    <Plus size={14} /> Add Holiday
                  </button>
                </div>
                
                {selectedSemester.holidays && selectedSemester.holidays.length > 0 ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Holiday Name</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Type</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSemester.holidays.map((holiday, index) => {
                          const start = new Date(holiday.startDate);
                          const end = new Date(holiday.endDate);
                          const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                          
                          return (
                            <tr key={index}>
                              <td><strong>{holiday.name}</strong></td>
                              <td>{start.toLocaleDateString()}</td>
                              <td>{end.toLocaleDateString()}</td>
                              <td>
                                <span className={`badge ${
                                  holiday.type === 'national' ? 'badge-red' :
                                  holiday.type === 'regional' ? 'badge-blue' : 'badge-secondary'
                                }`}>
                                  {holiday.type}
                                </span>
                              </td>
                              <td>{duration} day{duration > 1 ? 's' : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Calendar size={40} />
                    <p>No holidays added yet</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <Calendar size={60} />
                <h3>Select a Semester</h3>
                <p>Choose a semester from the list to view details and manage holidays</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {modalType === 'semester' ? (selectedSemester ? 'Edit Semester' : 'New Semester') :
                 modalType === 'holiday' ? 'Add Holiday' : 'Semester Settings'}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            {modalType === 'semester' && (
              <form onSubmit={saveSemester}>
                <div className="form-group">
                  <label className="form-label">Semester Name *</label>
                  <input 
                    className="form-input" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g., Fall 2024, Spring 2025"
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={form.startDate} 
                      onChange={e => setForm({...form, startDate: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={form.endDate} 
                      onChange={e => setForm({...form, endDate: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {selectedSemester ? 'Update Semester' : 'Create Semester'}
                </button>
              </form>
            )}
            
            {modalType === 'holiday' && (
              <form onSubmit={addHoliday}>
                <div className="form-group">
                  <label className="form-label">Holiday Name *</label>
                  <input 
                    className="form-input" 
                    value={holidayForm.name} 
                    onChange={e => setHolidayForm({...holidayForm, name: e.target.value})} 
                    placeholder="e.g., Diwali, Christmas, Mid-term Break"
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={holidayForm.startDate} 
                      onChange={e => setHolidayForm({...holidayForm, startDate: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={holidayForm.endDate} 
                      onChange={e => setHolidayForm({...holidayForm, endDate: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Holiday Type</label>
                  <select 
                    className="form-select" 
                    value={holidayForm.type} 
                    onChange={e => setHolidayForm({...holidayForm, type: e.target.value})}
                  >
                    <option value="institutional">Institutional</option>
                    <option value="regional">Regional</option>
                    <option value="national">National</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Add Holiday & Analyze Impact
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}