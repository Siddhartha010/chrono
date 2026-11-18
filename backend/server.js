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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test if excel route loads
try {
  app.use('/api/excel', require('./routes/excel-test'));
  console.log('Excel routes loaded successfully');
} catch (error) {
  console.error('Failed to load Excel routes:', error);
  // Fallback route
  app.get('/api/excel/template', (req, res) => {
    console.log('Fallback template route called');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fallback.csv"');
    res.send('Class,Section\nTest Class,A\nTest Class,B');
  });
}

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
