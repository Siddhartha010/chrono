import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Building2,
  Clock, Wand2, LogOut, GraduationCap, CalendarDays, FileText
} from 'lucide-react';

const adminNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/generate', icon: Wand2, label: 'Generate' },
  { to: '/teachers', icon: Users, label: 'Teachers' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/classes', icon: GraduationCap, label: 'Classes' },
  { to: '/classrooms', icon: Building2, label: 'Classrooms' },
  { to: '/timeslots', icon: Clock, label: 'Time Slots' },
  { to: '/personal-scheduler', icon: CalendarDays, label: 'My Schedule' },
  { to: '/exam-scheduler', icon: FileText, label: 'Exam Scheduler' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  const roleBadgeStyle = {
    display: 'inline-block', padding: '2px 8px', borderRadius: 20,
    fontSize: '0.65rem', fontWeight: 600, marginTop: 4,
    background: '#1e293b', color: '#6366f1', border: '1px solid #6366f1'
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Chrono<span>Gen</span></h1>
          <p>AI Timetable Generator</p>
        </div>
        <nav className="sidebar-nav">
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{user?.name}</div>
          <div style={roleBadgeStyle}>{user?.role}</div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
