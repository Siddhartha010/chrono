const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    process.env.CLIENT_URL?.replace(/\/$/, ''),
    'http://localhost:3000',
    'https://chrono-siddhartha010.vercel.app',
    /\.vercel\.app$/,
    /\.netlify\.app$/
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint - make sure this works
app.get('/api/health', (req, res) => {
  console.log('Health check called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'ChronoGen Backend is running',
    version: '1.0.0'
  });
});

// Root health check (without /api prefix)
app.get('/health', (req, res) => {
  console.log('Root health check called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'ChronoGen Backend is running',
    routes: 'Available'
  });
});

// Root route to wake up the server
app.get('/', (req, res) => {
  console.log('Root route called');
  res.json({ 
    message: 'ChronoGen Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health or /api/health',
      excel: '/api/excel/template'
    }
  });
});

// Excel routes - simplified loading
app.get('/api/excel/test', (req, res) => {
  console.log('Excel test route called');
  res.json({ message: 'Excel route is working', timestamp: new Date().toISOString() });
});

app.get('/api/excel/template', (req, res) => {
  console.log('Excel template route called');
  try {
    const simpleCSV = `Class Name,Section,Strength
BTech CSE,A,60
BTech CSE,B,58
BCS,A,45`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="template.csv"');
    res.send(simpleCSV);
    console.log('CSV sent successfully');
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/excel/upload', (req, res) => {
  console.log('Excel upload route called');
  res.json({
    success: true,
    message: 'Upload route working',
    data: {
      classes: [{ name: 'Test Class', section: 'A', strength: 30 }],
      subjects: [{ name: 'Test Subject', code: 'TS101', hoursPerWeek: 3 }],
      teachers: [{ name: 'Test Teacher', email: 'test@test.com' }],
      classrooms: [{ name: 'Test Room', capacity: 30 }],
      timeSlots: { days: ['Monday'], periods: [{ periodNumber: 1, startTime: '09:00', endTime: '10:00' }] },
      assignments: [{ className: 'Test Class', section: 'A', subjectName: 'Test Subject', teacherName: 'Test Teacher' }],
      errors: [],
      warnings: ['This is a test response']
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/timeslots', require('./routes/timeslots'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/export', require('./routes/export'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/substitutes', require('./routes/substitutes'));
app.use('/api/unavailability', require('./routes/unavailability'));
app.use('/api/semesters', require('./routes/semesters'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
