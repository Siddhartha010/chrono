import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Building2, Wand2, Clock, UserCheck, UserX } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [timetables, setTimetables] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/teachers'), api.get('/subjects'),
      api.get('/classes'), api.get('/classrooms'),
      api.get('/timetable'), api.get('/substitutes'),
      api.get('/unavailability')
    ]).then(([t, s, c, r, tt, sub, una]) => {
      setCounts({ 
        teachers: t.data.length, 
        subjects: s.data.length, 
        classes: c.data.length, 
        classrooms: r.data.length,
        substitutes: sub.data.length,
        unavailabilities: una.data.length
      });
      setTimetables(tt.data.slice(0, 5));
      setSubstitutes(sub.data.slice(0, 3));
      setUnavailabilities(una.data.slice(0, 3));
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Teachers', value: counts.teachers || 0, icon: Users, cls: 'purple' },
    { label: 'Subjects', value: counts.subjects || 0, icon: BookOpen, cls: 'blue' },
    { label: 'Classes', value: counts.classes || 0, icon: GraduationCap, cls: 'green' },
    { label: 'Classrooms', value: counts.classrooms || 0, icon: Building2, cls: 'orange' },
    { label: 'Substitutes', value: counts.substitutes || 0, icon: UserCheck, cls: 'teal' },
    { label: 'Unavailabilities', value: counts.unavailabilities || 0, icon: UserX, cls: 'red' },
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

        {/* Recent Substitutes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Substitute Assignments</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/substitutes')}>
              <UserCheck size={14} /> Manage
            </button>
          </div>
          {substitutes.length === 0 ? (
            <div className="empty-state">
              <UserCheck size={40} />
              <p>No substitute assignments yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Period</th>
                    <th>Original Teacher</th>
                    <th>Substitute</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutes.map(sub => (
                    <tr key={sub._id}>
                      <td>{new Date(sub.date).toLocaleDateString()}</td>
                      <td>Period {sub.period}</td>
                      <td>{sub.originalTeacher?.name || 'N/A'}</td>
                      <td>{sub.substituteTeacher?.name || 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          sub.status === 'approved' ? 'badge-green' :
                          sub.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Unavailabilities */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Teacher Unavailabilities</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/unavailability')}>
              <UserX size={14} /> Manage
            </button>
          </div>
          {unavailabilities.length === 0 ? (
            <div className="empty-state">
              <UserX size={40} />
              <p>No teacher unavailabilities recorded.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unavailabilities.map(una => (
                    <tr key={una._id}>
                      <td>{una.teacher?.name || 'N/A'}</td>
                      <td>{new Date(una.startDate).toLocaleDateString()}</td>
                      <td>{new Date(una.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-secondary">
                          {una.reason}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          una.status === 'approved' ? 'badge-green' :
                          una.status === 'rejected' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {una.status}
                        </span>
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
