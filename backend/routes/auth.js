const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TEMPORARY: Excel routes added here to ensure deployment
// DEPLOYMENT VERSION: 2024-12-19-v3
router.get('/excel-test', (req, res) => {
  console.log('Excel test route called via auth - DEPLOYMENT v3');
  res.json({ 
    message: 'Excel route is working via auth', 
    timestamp: new Date().toISOString(),
    deploymentVersion: '2024-12-19-v3',
    route: 'auth/excel-test'
  });
});

router.get('/excel-template', (req, res) => {
  console.log('Excel template route called via auth');
  try {
    // Simple CSV with just the Classes data that's working
    const classesCSV = `Class Name,Section,Strength,Course
BTech CSE,A,60,BTech
BTech CSE,B,58,BTech
BTech IT,A,55,BTech
BCS,A,45,BCS
MCA,A,40,MCA
MBA,A,50,MBA
MSc CS,A,35,MSc
BTech ECE,A,52,BTech
BTech ME,A,48,BTech
BTech CE,A,45,BTech
BCS,B,42,BCS
MCA,B,38,MCA
MBA,B,47,MBA
MSc CS,B,32,MSc
BTech CSE,C,55,BTech
BTech IT,B,50,BTech
BTech ECE,B,49,BTech
BTech ME,B,46,BTech
BTech CE,B,43,BTech
MSc Math,A,30,MSc`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Classes_Template.csv"');
    res.send(classesCSV);
    console.log('Classes CSV template sent successfully');
  } catch (error) {
    console.error('Template error via auth:', error);
    res.status(500).json({ error: error.message });
  }
});

// Additional template routes for different data types
router.get('/excel-subjects', (req, res) => {
  const subjectsCSV = `Subject Name,Subject Code,Hours Per Week,Is Lab,Course
Data Structures,CS201,4,false,BTech
Data Structures Lab,CS201L,2,true,BTech
Database Management Systems,CS301,3,false,BTech
Database Lab,CS301L,2,true,BTech
Computer Networks,CS401,3,false,BTech
Network Lab,CS401L,2,true,BTech
Software Engineering,CS501,3,false,BTech
Web Development,CS601,3,false,BTech
Web Development Lab,CS601L,2,true,BTech
Machine Learning,CS701,4,false,BTech
Artificial Intelligence,CS801,3,false,BTech
Operating Systems,CS302,3,false,BTech
OS Lab,CS302L,2,true,BTech
Compiler Design,CS502,3,false,BTech
Mobile App Development,CS602,3,false,BTech
Mobile Lab,CS602L,2,true,BTech
Cybersecurity,CS702,3,false,BTech
Cloud Computing,CS802,3,false,BTech
Programming Fundamentals,BCS101,4,false,BCS
Programming Lab,BCS101L,2,true,BCS
Mathematics,BCS201,3,false,BCS
Statistics,BCS301,3,false,BCS
Advanced Java,MCA201,4,false,MCA
Java Lab,MCA201L,2,true,MCA
System Analysis,MCA301,3,false,MCA
Project Management,MCA401,3,false,MCA
Marketing Management,MBA101,3,false,MBA
Financial Management,MBA201,3,false,MBA
Human Resource Management,MBA301,3,false,MBA
Operations Management,MBA401,3,false,MBA
Advanced Algorithms,MSC201,4,false,MSc
Research Methodology,MSC301,3,false,MSc
Thesis Work,MSC401,2,false,MSc`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Subjects_Template.csv"');
  res.send(subjectsCSV);
});

router.get('/excel-teachers', (req, res) => {
  const teachersCSV = `Teacher Name,Email,Max Hours Per Day,Max Hours Per Week
Dr. John Smith,john.smith@college.edu,6,30
Prof. Jane Doe,jane.doe@college.edu,5,25
Dr. Alice Brown,alice.brown@college.edu,6,30
Prof. Bob Wilson,bob.wilson@college.edu,5,25
Dr. Carol Davis,carol.davis@college.edu,6,30
Prof. David Miller,david.miller@college.edu,6,30
Dr. Emma Taylor,emma.taylor@college.edu,5,25
Prof. Frank Johnson,frank.johnson@college.edu,6,30
Dr. Grace Lee,grace.lee@college.edu,5,25
Prof. Henry Clark,henry.clark@college.edu,4,20
Dr. Ivy Martinez,ivy.martinez@college.edu,4,20
Prof. Jack Anderson,jack.anderson@college.edu,3,15`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Teachers_Template.csv"');
  res.send(teachersCSV);
});

router.get('/excel-classrooms', (req, res) => {
  const classroomsCSV = `Room Name,Capacity,Is Lab,Building
Room 101,60,false,Main Block
Room 102,55,false,Main Block
Room 103,50,false,Main Block
Room 201,65,false,Main Block
Room 202,60,false,Main Block
Room 203,55,false,Main Block
Lab 301,30,true,CS Block
Lab 302,25,true,CS Block
Lab 303,35,true,CS Block
Lab 401,30,true,CS Block
Lab 402,25,true,CS Block
Seminar Hall,100,false,Main Block
Auditorium,200,false,Main Block
Conference Room,20,false,Admin Block
Library Hall,80,false,Library Block`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Classrooms_Template.csv"');
  res.send(classroomsCSV);
});

router.post('/excel-upload', (req, res) => {
  console.log('Excel upload route called via auth');
  res.json({
    success: true,
    message: 'Upload route working via auth',
    data: {
      classes: [{ name: 'Test Class', section: 'A', strength: 30 }],
      subjects: [{ name: 'Test Subject', code: 'TS101', hoursPerWeek: 3 }],
      teachers: [{ name: 'Test Teacher', email: 'test@test.com' }],
      classrooms: [{ name: 'Test Room', capacity: 30 }],
      timeSlots: { days: ['Monday'], periods: [{ periodNumber: 1, startTime: '09:00', endTime: '10:00' }] },
      assignments: [{ className: 'Test Class', section: 'A', subjectName: 'Test Subject', teacherName: 'Test Teacher' }],
      errors: [],
      warnings: ['This is a test response via auth']
    }
  });
});

module.exports = router;
