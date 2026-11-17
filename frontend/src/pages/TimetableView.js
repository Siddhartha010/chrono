import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Users, Search, Trash2, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function TimetableView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tt, setTt] = useState(null);
  const [timeslotConfig, setTimeslotConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/timetable/${id}`),
      api.get('/timeslots')
    ]).then(([ttRes, tsRes]) => {
      setTt(ttRes.data);
      if (tsRes.data.length > 0) setTimeslotConfig(tsRes.data[0]);
      setLoading(false);
    }).catch(() => { toast.error('Failed to load'); setLoading(false); });
  }, [id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!tt) return <div className="page"><p>Timetable not found</p></div>;

  const entries = tt.entries.filter(e => {
    if (filterClass && e.class?._id !== filterClass) return false;
    if (filterTeacher && e.teacher?._id !== filterTeacher) return false;
    if (filterSubject && e.subject?._id !== filterSubject) return false;
    return true;
  });

  // Day order
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = [...new Set(tt.entries.map(e => e.day))].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  const periods = [...new Set(tt.entries.map(e => e.period))].sort((a, b) => a - b);
  const classes = [...new Map(tt.entries.filter(e => e.class).map(e => [e.class._id, e.class])).values()];
  const teachers = [...new Map(tt.entries.filter(e => e.teacher).map(e => [e.teacher._id, e.teacher])).values()];
  const subjects = [...new Map(tt.entries.filter(e => e.subject).map(e => [e.subject._id, e.subject])).values()];

  // Map period number -> time label from timeslot config
  const periodLabel = (p) => {
    if (!timeslotConfig) return `P${p}`;
    const slot = timeslotConfig.periods.find(s => s.periodNumber === p);
    return slot ? `${slot.startTime} – ${slot.endTime}` : `P${p}`;
  };

  const getCell = (day, period) => entries.find(e => e.day === day && e.period === period);

  const fitnessClass = s => s >= 80 ? '' : s >= 50 ? 'medium' : 'low';

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('ChronoGen - Timetable', 14, 15);
    doc.setFontSize(10);
    doc.text(`Fitness: ${tt.fitnessScore}% | Generated: ${new Date(tt.createdAt).toLocaleDateString()}`, 14, 22);

    const grouped = {};
    for (const e of tt.entries) {
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
      const head = [['Day', ...clsPeriods.map(p => `P${p}`)]];
      const body = clsDays.map(d => {
        const row = [d];
        for (const p of clsPeriods) {
          const e = ents.find(x => x.day === d && x.period === p);
          row.push(e ? `${e.subject?.name || ''}\n${e.teacher?.name || ''}` : '-');
        }
        return row;
      });
      autoTable(doc, { head, body, startY: y, styles: { fontSize: 8 }, headStyles: { fillColor: [99, 102, 241] } });
      y = doc.lastAutoTable.finalY + 10;
      if (y > 180) { doc.addPage(); y = 20; }
    }
    doc.save('timetable.pdf');
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const grouped = {};
    for (const e of tt.entries) {
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
    XLSX.writeFile(wb, 'timetable.xlsx');
  };

  const del = async () => {
    if (!window.confirm('Delete this timetable?')) return;
    await api.delete(`/timetable/${id}`);
    toast.success('Deleted');
    navigate('/');
  };

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h2>Timetable View</h2>
          <span className={`fitness-badge ${fitnessClass(tt.fitnessScore)}`} style={{ marginTop: 4, display: 'inline-flex' }}>
            Efficiency: {tt.fitnessScore}%
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/teacher-dashboard/${id}`)}>
            <Users size={14} /> Teacher Dashboard
          </button>
          <button className="btn btn-success btn-sm" onClick={exportExcel}><Download size={14} /> Excel</button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}><Download size={14} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/generate')}><RefreshCw size={14} /> Regenerate</button>
          <button className="btn btn-danger btn-sm" onClick={del}><Trash2 size={14} /></button>
        </div>
      </div>

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

      <div style={{ marginTop: 16 }} className="card">
        <div className="tt-grid">
          <table className="tt-table">
            <thead>
              <tr>
                {/* Top-left corner */}
                <th style={{ background: '#4f46e5', minWidth: 100, textAlign: 'left', paddingLeft: 12 }}>Day</th>
                {/* Periods / time slots across the top */}
                {periods.map(p => (
                  <th key={p}>
                    <div style={{ fontWeight: 700 }}>Period {p}</div>
                    <div style={{ fontWeight: 400, fontSize: '0.7rem', opacity: 0.85, marginTop: 2 }}>{periodLabel(p)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Days down the left */}
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
                          <div className="tt-cell">
                            <div className="subject">{cell.subject?.name || '-'}</div>
                            <div className="teacher">{cell.teacher?.name || '-'}</div>
                            <div className="room">{cell.classroom?.name || ''}{cell.class?.name ? ` · ${cell.class.name}` : ''}</div>
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
        Generation: {tt.generation} · Entries: {tt.entries.length} · Created: {new Date(tt.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
