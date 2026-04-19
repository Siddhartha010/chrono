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

// Root route - MUST be first
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

// Health check endpoints
app.get('/health', (req, res) => {
  console.log('Root health check called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'ChronoGen Backend is running',
    routes: 'Available'
  });
});

app.get('/api/health', (req, res) => {
  console.log('API health check called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'ChronoGen Backend is running',
    version: '1.0.0'
  });
});

// Excel routes - BEFORE other API routes to avoid conflicts
app.get('/api/excel/test', (req, res) => {
  console.log('Excel test route called');
  res.json({ message: 'Excel route is working', timestamp: new Date().toISOString() });
});

app.get('/api/excel/template', (req, res) => {
  console.log('Excel template route called');
  console.log('Request headers:', req.headers);
  try {
    const simpleCSV = `Class Name,Section,Strength\nBTech CSE,A,60\nBTech CSE,B,58\nBCS,A,45`;
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
  console.log('Request body:', req.body);
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

// Other API Routes
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

// Catch-all for unmatched routes
app.use('*', (req, res) => {
  console.log('Unmatched route:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.originalUrl,
    availableRoutes: {
      root: '/',
      health: '/health, /api/health',
      excel: '/api/excel/test, /api/excel/template, /api/excel/upload',
      auth: '/api/auth/*',
      data: '/api/teachers, /api/subjects, /api/classes, etc.'
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
