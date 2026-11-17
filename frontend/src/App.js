import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import Classrooms from './pages/Classrooms';
import Timeslots from './pages/Timeslots';
import Generate from './pages/Generate';
import TimetableView from './pages/TimetableView';
import TeacherDashboard from './pages/TeacherDashboard';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classrooms" element={<Classrooms />} />
            <Route path="timeslots" element={<Timeslots />} />
            <Route path="generate" element={<Generate />} />
            <Route path="timetable/:id" element={<TimetableView />} />
            <Route path="teacher-dashboard/:id" element={<TeacherDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
