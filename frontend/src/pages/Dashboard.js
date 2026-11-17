import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Building2, Wand2, Clock } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [timetables, setTimetables] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/teachers'), api.get('/subjects'),
      api.get('/classes'), api.get('/classrooms'),
      api.get('/timetable')
    ]).then(([t, s, c, r, tt]) => {
      setCounts({ teachers: t.data.length, subjects: s.data.length, classes: c.data.length, classrooms: r.data.length });
      setTimetables(tt.data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Teachers', value: counts.teachers || 0, icon: Users, cls: 'purple' },
    { label: 'Subjects', value: counts.subjects || 0, icon: BookOpen, cls: 'blue' },
    { label: 'Classes', value: counts.classes || 0, icon: GraduationCap, cls: 'green' },
    { label: 'Classrooms', value: counts.classrooms || 0, icon: Building2, cls: 'orange' },
  ];

  const fitnessClass = score => score >= 80 ? '' : score >= 50 ? 'medium' : 'low';

  return (
    <div className="page">
      <div className="topbar">
        <h2>Dashboard</h2>
        <button className="btn btn-primary" onClick={() => navigate('/generate')}>
          <Wand2 size={16} /> Generate Timetable
        </button>
      </div>

      <div style={{ padding: '0' }}>
        <div className="stats-grid" style={{ marginTop: 24 }}>
          {stats.map(({ label, value, icon: Icon, cls }) => (
            <div className="stat-card" key={label}>
              <div className={`stat-icon ${cls}`}><Icon size={20} /></div>
              <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Timetables</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/generate')}>
              <Wand2 size={14} /> New
            </button>
          </div>
          {timetables.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} />
              <p>No timetables generated yet. Click "Generate Timetable" to start.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Fitness</th>
                    <th>Generation</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.map(tt => (
                    <tr key={tt._id}>
                      <td>{tt.name}</td>
                      <td>
                        <span className={`fitness-badge ${fitnessClass(tt.fitnessScore)}`}>
                          {tt.fitnessScore}%
                        </span>
                      </td>
                      <td>{tt.generation}</td>
                      <td>{new Date(tt.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/timetable/${tt._id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
