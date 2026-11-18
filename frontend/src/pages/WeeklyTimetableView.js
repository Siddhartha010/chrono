import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Calendar, Clock, Users, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function WeeklyTimetableView() {
  const { semesterId, weekNumber } = useParams();
  const navigate = useNavigate();
  const [weeklyTimetable, setWeeklyTimetable] = useState(null);
  const [timeslotConfig, setTimeslotConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    loadWeeklyTimetable();
    loadTimeslotConfig();
  }, [semesterId, weekNumber]);

  const loadWeeklyTimetable = async () => {
    try {
      const response = await api.get(`/semesters/${semesterId}/week/${weekNumber}`);
      setWeeklyTimetable(response.data);
    } catch (err) {
      toast.error('Failed to load weekly timetable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeslotConfig = async () => {
    try {
      const response = await api.get('/timeslots');
      if (response.data.length > 0) {
        setTimeslotConfig(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to load timeslot config:', err);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!weeklyTimetable) return <div className="page"><p>Weekly timetable not found</p></div>;

  // Filter entries
  const entries = weeklyTimetable.entries.filter(e => {
    if (filterClass && e.class?._id !== filterClass) return false;
    if (filterTeacher && e.teacher?._id !== filterTeacher) return false;
    if (filterSubject && e.subject?._id !== filterSubject) return false;
    return true;
  });

  // Day order
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = [...new Set(entries.map(e => e.day))].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);
  const classes = [...new Map(entries.filter(e => e.class).map(e => [e.class._id, e.class])).values()];
  const teachers = [...new Map(entries.filter(e => e.teacher).map(e => [e.teacher._id, e.teacher])).values()];
  const subjects = [...new Map(entries.filter(e => e.subject).map(e => [e.subject._id, e.subject])).values()];

  // Map period number -> time label from timeslot config
  const periodLabel = (p) => {
    if (!timeslotConfig) return `P${p}`;
    const slot = timeslotConfig.periods.find(s => s.periodNumber === p);
    return slot ? `${slot.startTime} – ${slot.endTime}` : `P${p}`;
  };

  const getCell = (day, period) => entries.find(e => e.day === day && e.period === period);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`Week ${weekNumber} Timetable`, 14, 15);
    doc.setFontSize(10);
    doc.text(`${new Date(weeklyTimetable.weekStartDate).toLocaleDateString()} - ${new Date(weeklyTimetable.weekEndDate).toLocaleDateString()}`, 14, 22);

    const grouped = {};
    for (const e of entries) {
      const key = e.class?.name || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }

    let y = 30;
    for (const [cls, ents] of Object.entries(grouped)) {
      doc.setFontSize(12);
      doc.text(`Class: ${cls}`, 14, y);
      y += 4;
      const clsDays = [...new Set(ents.map(e => e.day))].sort();
      const clsPeriods = [...new Set(ents.map(e => e.period))].sort((a, b) => a - b);
      const head = [['Day', ...clsPeriods.map(p => `P${p}`)]]];
      const body = clsDays.map(d => {
        const row = [d];
        for (const p of clsPeriods) {
          const e = ents.find(x => x.day === d && x.period === p);
          row.push(e ? `${e.subject?.name || ''}\\n${e.teacher?.name || ''}` : '-');
        }
        return row;
      });
      autoTable(doc, { head, body, startY: y, styles: { fontSize: 8 }, headStyles: { fillColor: [99, 102, 241] } });
      y = doc.lastAutoTable.finalY + 10;
      if (y > 180) { doc.addPage(); y = 20; }
    }
    doc.save(`week-${weekNumber}-timetable.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const grouped = {};
    for (const e of entries) {
      const key = e.class?.name || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }
    for (const [cls, ents] of Object.entries(grouped)) {
      const clsDays = [...new Set(ents.map(e => e.day))].sort();
      const clsPeriods = [...new Set(ents.map(e => e.period))].sort((a, b) => a - b);
      const rows = [['Day', ...clsPeriods.map(p => `Period ${p}`)]];
      for (const d of clsDays) {
        const row = [d];
        for (const p of clsPeriods) {
          const e = ents.find(x => x.day === d && x.period === p);
          row.push(e ? `${e.subject?.name || ''} (${e.teacher?.name || ''})` : '-');
        }
        rows.push(row);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, cls.slice(0, 31));
    }
    XLSX.writeFile(wb, `week-${weekNumber}-timetable.xlsx`);
  };

  const compensationClasses = entries.filter(e => e.isCompensation).length;
  const saturdayClasses = entries.filter(e => e.isSaturdayClass).length;
  const totalClasses = entries.length;

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/semester-planner`)}>
              <ArrowLeft size={14} /> Back to Semester
            </button>
            <h2 style={{ margin: 0 }}>Week {weekNumber} Timetable</h2>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {new Date(weeklyTimetable.weekStartDate).toLocaleDateString()} - {new Date(weeklyTimetable.weekEndDate).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success btn-sm" onClick={exportExcel}>
            <Download size={14} /> Excel
          </button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Week Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><Calendar size={20} /></div>
          <div>
            <div className="stat-value">{totalClasses}</div>
            <div className="stat-label">Total Classes</div>
          </div>
        </div>
        {compensationClasses > 0 && (
          <div className="stat-card">
            <div className="stat-icon orange"><AlertTriangle size={20} /></div>
            <div>
              <div className="stat-value">{compensationClasses}</div>
              <div className="stat-label">Compensation Classes</div>
            </div>
          </div>
        )}
        {saturdayClasses > 0 && (
          <div className="stat-card">
            <div className="stat-icon purple"><Clock size={20} /></div>
            <div>
              <div className="stat-value">{saturdayClasses}</div>
              <div className="stat-label">Saturday Classes</div>
            </div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <div className={`stat-value ${weeklyTimetable.status === 'completed' ? 'text-green' : weeklyTimetable.status === 'in_progress' ? 'text-yellow' : 'text-gray'}`}>
              {weeklyTimetable.status.replace('_', ' ').toUpperCase()}
            </div>
            <div className="stat-label">Week Status</div>
          </div>
        </div>
        {weeklyTimetable.fitnessScore > 0 && (
          <div className="stat-card">
            <div className="stat-icon purple"><BarChart3 size={20} /></div>
            <div>
              <div className="stat-value">{weeklyTimetable.fitnessScore}%</div>
              <div className="stat-label">Efficiency Score</div>
            </div>
          </div>
        )}
      </div>

      {/* Holidays Notice */}
      {weeklyTimetable.holidaysInWeek && weeklyTimetable.holidaysInWeek.length > 0 && (
        <div style={{ 
          marginTop: 16, 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: 8, 
          padding: 12 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: 600, color: '#dc2626' }}>
              Holidays this week: {weeklyTimetable.holidaysInWeek.join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 160 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        {(filterClass || filterTeacher || filterSubject) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setFilterClass(''); setFilterTeacher(''); setFilterSubject(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Timetable Grid */}
      <div style={{ marginTop: 16 }} className="card">
        <div className="tt-grid">
          <table className="tt-table">
            <thead>
              <tr>
                <th style={{ background: '#4f46e5', minWidth: 100, textAlign: 'left', paddingLeft: 12 }}>Day</th>
                {periods.map(p => (
                  <th key={p}>
                    <div style={{ fontWeight: 700 }}>Period {p}</div>
                    <div style={{ fontWeight: 400, fontSize: '0.7rem', opacity: 0.85, marginTop: 2 }}>{periodLabel(p)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day}>
                  <td style={{ background: '#f8fafc', fontWeight: 600, fontSize: '0.85rem', color: '#4f46e5', whiteSpace: 'nowrap', paddingLeft: 12 }}>
                    {day}
                  </td>
                  {periods.map(period => {
                    const cell = getCell(day, period);
                    return (
                      <td key={period}>
                        {cell ? (
                          <div 
                            className="tt-cell"
                            style={{
                              background: cell.isCompensation ? '#fef3c7' : 
                                         cell.isSaturdayClass ? '#f3e8ff' : 
                                         cell.isExtraClass ? '#dcfce7' : '#ede9fe'
                            }}
                          >
                            <div className="subject">{cell.subject?.name || '-'}</div>
                            <div className="teacher">{cell.teacher?.name || '-'}</div>
                            <div className="room">
                              {cell.classroom?.name || ''}{cell.class?.name ? ` · ${cell.class.name}` : ''}
                            </div>
                            {cell.isCompensation && (
                              <div style={{ 
                                fontSize: '0.6rem', 
                                color: '#ca8a04', 
                                fontWeight: 600, 
                                marginTop: 2 
                              }}>
                                COMPENSATION
                              </div>
                            )}
                            {cell.isSaturdayClass && (
                              <div style={{ 
                                fontSize: '0.6rem', 
                                color: '#7c3aed', 
                                fontWeight: 600, 
                                marginTop: 2 
                              }}>
                                SATURDAY
                              </div>
                            )}
                            {cell.isExtraClass && (
                              <div style={{ 
                                fontSize: '0.6rem', 
                                color: '#059669', 
                                fontWeight: 600, 
                                marginTop: 2 
                              }}>
                                EXTRA
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="tt-empty">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#94a3b8' }}>
        Week {weekNumber} · Entries: {entries.length} · Created: {new Date(weeklyTimetable.createdAt).toLocaleString()}
      </div>
    </div>
  );
}