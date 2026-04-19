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
    // Comprehensive CSV template with all ChronoGen inputs
    const comprehensiveCSV = `CHRONOGEN EXCEL TEMPLATE - Complete Timetable Generation Data

=== CLASSES SHEET ===
Class Name,Section,Strength,Course
BTech CSE,A,60,BTech
BTech CSE,B,58,BTech
BTech IT,A,55,BTech
BCS,A,45,BCS
MCA,A,40,MCA
MBA,A,50,MBA
MSc CS,A,35,MSc

=== SUBJECTS SHEET ===
Subject Name,Subject Code,Hours Per Week,Is Lab (Yes/No),Course
Data Structures,CS201,4,No,BTech
Data Structures Lab,CS201L,2,Yes,BTech
Database Management Systems,CS301,3,No,BTech
Database Lab,CS301L,2,Yes,BTech
Computer Networks,CS401,3,No,BTech
Network Lab,CS401L,2,Yes,BTech
Software Engineering,CS501,3,No,BTech
Web Development,CS601,3,No,BTech
Web Development Lab,CS601L,2,Yes,BTech
Machine Learning,CS701,4,No,BTech
Artificial Intelligence,CS801,3,No,BTech
Operating Systems,CS302,3,No,BTech
OS Lab,CS302L,2,Yes,BTech
Compiler Design,CS502,3,No,BTech
Mobile App Development,CS602,3,No,BTech
Mobile Lab,CS602L,2,Yes,BTech
Cybersecurity,CS702,3,No,BTech
Cloud Computing,CS802,3,No,BTech
Programming Fundamentals,BCS101,4,No,BCS
Programming Lab,BCS101L,2,Yes,BCS
Mathematics,BCS201,3,No,BCS
Statistics,BCS301,3,No,BCS
Advanced Java,MCA201,4,No,MCA
Java Lab,MCA201L,2,Yes,MCA
System Analysis,MCA301,3,No,MCA
Project Management,MCA401,3,No,MCA
Marketing Management,MBA101,3,No,MBA
Financial Management,MBA201,3,No,MBA
Human Resource Management,MBA301,3,No,MBA
Operations Management,MBA401,3,No,MBA
Advanced Algorithms,MSC201,4,No,MSc
Research Methodology,MSC301,3,No,MSc
Thesis Work,MSC401,2,No,MSc

=== TEACHERS SHEET ===
Teacher Name,Email,Subjects (comma separated),Max Hours Per Day,Max Hours Per Week,Course,Phone,Department
Dr. John Smith,john.smith@college.edu,"Data Structures,Data Structures Lab,Advanced Algorithms",6,30,BTech,+1234567890,Computer Science
Prof. Jane Doe,jane.doe@college.edu,"Database Management Systems,Database Lab,System Analysis",5,25,BTech,+1234567891,Computer Science
Dr. Alice Brown,alice.brown@college.edu,"Computer Networks,Network Lab,Cybersecurity",6,30,BTech,+1234567892,Computer Science
Prof. Bob Wilson,bob.wilson@college.edu,"Software Engineering,Project Management",5,25,BTech,+1234567893,Computer Science
Dr. Carol Davis,carol.davis@college.edu,"Web Development,Web Development Lab,Mobile App Development,Mobile Lab",6,30,BTech,+1234567894,Computer Science
Prof. David Miller,david.miller@college.edu,"Machine Learning,Artificial Intelligence,Cloud Computing",6,30,BTech,+1234567895,Computer Science
Dr. Emma Taylor,emma.taylor@college.edu,"Operating Systems,OS Lab,Compiler Design",5,25,BTech,+1234567896,Computer Science
Prof. Frank Johnson,frank.johnson@college.edu,"Programming Fundamentals,Programming Lab,Advanced Java,Java Lab",6,30,BCS,+1234567897,Computer Science
Dr. Grace Lee,grace.lee@college.edu,"Mathematics,Statistics,Research Methodology",5,25,BCS,+1234567898,Mathematics
Prof. Henry Clark,henry.clark@college.edu,"Marketing Management,Human Resource Management",4,20,MBA,+1234567899,Management
Dr. Ivy Martinez,ivy.martinez@college.edu,"Financial Management,Operations Management",4,20,MBA,+1234567800,Management
Prof. Jack Anderson,jack.anderson@college.edu,"Thesis Work,Research Methodology",3,15,MSc,+1234567801,Computer Science

=== CLASSROOMS SHEET ===
Room Name,Capacity,Is Lab (Yes/No),Building,Floor,Equipment,AC (Yes/No)
Room 101,60,No,Main Block,1,Projector,Yes
Room 102,55,No,Main Block,1,Projector,Yes
Room 103,50,No,Main Block,1,Projector,Yes
Room 201,65,No,Main Block,2,Smart Board,Yes
Room 202,60,No,Main Block,2,Projector,Yes
Room 203,55,No,Main Block,2,Projector,Yes
Lab 301,30,Yes,CS Block,3,"30 Computers, Projector",Yes
Lab 302,25,Yes,CS Block,3,"25 Computers, Projector",Yes
Lab 303,35,Yes,CS Block,3,"35 Computers, Smart Board",Yes
Lab 401,30,Yes,CS Block,4,"30 Computers, Server",Yes
Lab 402,25,Yes,CS Block,4,"25 Computers, Network Setup",Yes
Seminar Hall,100,No,Main Block,Ground,"Audio System, Projector",Yes
Auditorium,200,No,Main Block,Ground,"Full Audio/Video Setup",Yes
Conference Room,20,No,Admin Block,2,"Video Conferencing, Projector",Yes
Library Hall,80,No,Library Block,1,"Silent Study, Projector",Yes

=== TIME SLOTS SHEET ===
Days (comma separated),Period Number,Start Time (24hr),End Time (24hr),Is Break (Yes/No),Break Name
"Monday,Tuesday,Wednesday,Thursday,Friday",1,09:00,10:00,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",2,10:00,11:00,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",3,11:00,11:15,Yes,Tea Break
"Monday,Tuesday,Wednesday,Thursday,Friday",4,11:15,12:15,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",5,12:15,13:15,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",6,13:15,14:00,Yes,Lunch Break
"Monday,Tuesday,Wednesday,Thursday,Friday",7,14:00,15:00,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",8,15:00,16:00,No,
"Monday,Tuesday,Wednesday,Thursday,Friday",9,16:00,16:15,Yes,Evening Break
"Monday,Tuesday,Wednesday,Thursday,Friday",10,16:15,17:15,No,
"Saturday",1,09:00,10:00,No,
"Saturday",2,10:00,11:00,No,
"Saturday",3,11:00,11:15,Yes,Tea Break
"Saturday",4,11:15,12:15,No,
"Saturday",5,12:15,13:15,No,

=== CLASS-SUBJECT-TEACHER ASSIGNMENTS SHEET ===
Class Name,Section,Subject Name,Teacher Name,Priority (1-10),Preferred Days,Avoid Days,Special Requirements
BTech CSE,A,Data Structures,Dr. John Smith,9,"Monday,Wednesday,Friday",,Lab after theory
BTech CSE,A,Data Structures Lab,Dr. John Smith,8,"Tuesday,Thursday",,Need CS Lab
BTech CSE,A,Database Management Systems,Prof. Jane Doe,9,"Monday,Wednesday,Friday",,
BTech CSE,A,Database Lab,Prof. Jane Doe,8,"Tuesday,Thursday",,Need CS Lab
BTech CSE,A,Computer Networks,Dr. Alice Brown,8,"Monday,Wednesday",,
BTech CSE,A,Network Lab,Dr. Alice Brown,7,"Thursday,Friday",,Need Network Lab
BTech CSE,A,Software Engineering,Prof. Bob Wilson,7,"Tuesday,Thursday",,
BTech CSE,A,Web Development,Dr. Carol Davis,8,"Monday,Friday",,
BTech CSE,A,Web Development Lab,Dr. Carol Davis,7,"Wednesday,Thursday",,Need CS Lab
BTech CSE,B,Data Structures,Dr. John Smith,9,"Tuesday,Thursday,Friday",,Lab after theory
BTech CSE,B,Data Structures Lab,Dr. John Smith,8,"Monday,Wednesday",,Need CS Lab
BTech CSE,B,Database Management Systems,Prof. Jane Doe,9,"Tuesday,Thursday,Friday",,
BTech CSE,B,Database Lab,Prof. Jane Doe,8,"Monday,Wednesday",,Need CS Lab
BTech CSE,B,Computer Networks,Dr. Alice Brown,8,"Tuesday,Friday",,
BTech CSE,B,Network Lab,Dr. Alice Brown,7,"Monday,Thursday",,Need Network Lab
BTech CSE,B,Software Engineering,Prof. Bob Wilson,7,"Monday,Wednesday",,
BTech CSE,B,Web Development,Dr. Carol Davis,8,"Tuesday,Thursday",,
BTech CSE,B,Web Development Lab,Dr. Carol Davis,7,"Monday,Friday",,Need CS Lab
BTech IT,A,Data Structures,Dr. John Smith,8,"Monday,Wednesday",,
BTech IT,A,Database Management Systems,Prof. Jane Doe,8,"Tuesday,Friday",,
BTech IT,A,Computer Networks,Dr. Alice Brown,7,"Wednesday,Thursday",,
BCS,A,Programming Fundamentals,Prof. Frank Johnson,9,"Monday,Wednesday,Friday",,
BCS,A,Programming Lab,Prof. Frank Johnson,8,"Tuesday,Thursday",,Need CS Lab
BCS,A,Mathematics,Dr. Grace Lee,8,"Monday,Wednesday",,
BCS,A,Statistics,Dr. Grace Lee,7,"Tuesday,Friday",,
MCA,A,Advanced Java,Prof. Frank Johnson,8,"Monday,Thursday",,
MCA,A,Java Lab,Prof. Frank Johnson,7,"Tuesday,Friday",,Need CS Lab
MCA,A,System Analysis,Prof. Jane Doe,7,"Wednesday,Thursday",,
MCA,A,Project Management,Prof. Bob Wilson,6,"Monday,Friday",,
MBA,A,Marketing Management,Prof. Henry Clark,7,"Monday,Wednesday",,
MBA,A,Financial Management,Dr. Ivy Martinez,8,"Tuesday,Thursday",,
MBA,A,Human Resource Management,Prof. Henry Clark,6,"Wednesday,Friday",,
MBA,A,Operations Management,Dr. Ivy Martinez,7,"Monday,Thursday",,
MSc CS,A,Advanced Algorithms,Dr. John Smith,8,"Tuesday,Thursday",,
MSc CS,A,Research Methodology,Prof. Jack Anderson,7,"Monday,Wednesday",,
MSc CS,A,Thesis Work,Prof. Jack Anderson,6,"Friday",,Individual guidance

=== TEACHER AVAILABILITY SHEET ===
Teacher Name,Day,Available Periods (comma separated),Unavailable Periods,Max Consecutive Hours,Preferred Time Slots,Notes
Dr. John Smith,Monday,"1,2,4,5,7,8","3,6",3,"Morning preferred",Available for extra hours if needed
Dr. John Smith,Tuesday,"1,2,4,5,7,8,10","3,6,9",3,"Morning preferred",
Dr. John Smith,Wednesday,"1,2,4,5,7,8","3,6",3,"Morning preferred",
Dr. John Smith,Thursday,"1,2,4,5,7,8,10","3,6,9",3,"Morning preferred",
Dr. John Smith,Friday,"1,2,4,5,7,8","3,6",3,"Morning preferred",
Prof. Jane Doe,Monday,"2,4,5,7,8","1,3,6",2,"Afternoon preferred",Not available first period
Prof. Jane Doe,Tuesday,"1,2,4,5,7,8","3,6",2,"Afternoon preferred",
Prof. Jane Doe,Wednesday,"2,4,5,7,8","1,3,6",2,"Afternoon preferred",Not available first period
Prof. Jane Doe,Thursday,"1,2,4,5,7,8","3,6",2,"Afternoon preferred",
Prof. Jane Doe,Friday,"2,4,5,7,8","1,3,6",2,"Afternoon preferred",Not available first period
Dr. Alice Brown,Monday,"1,2,4,5,7,8,10","3,6,9",4,"Full day available",
Dr. Alice Brown,Tuesday,"1,2,4,5,7,8","3,6",4,"Full day available",
Dr. Alice Brown,Wednesday,"1,2,4,5,7,8,10","3,6,9",4,"Full day available",
Dr. Alice Brown,Thursday,"1,2,4,5,7,8","3,6",4,"Full day available",
Dr. Alice Brown,Friday,"1,2,4,5,7,8,10","3,6,9",4,"Full day available",
Prof. Bob Wilson,Monday,"4,5,7,8","1,2,3,6",2,"Afternoon only",Morning meetings
Prof. Bob Wilson,Tuesday,"1,2,4,5,7,8","3,6",2,"Full day",
Prof. Bob Wilson,Wednesday,"4,5,7,8","1,2,3,6",2,"Afternoon only",Morning meetings
Prof. Bob Wilson,Thursday,"1,2,4,5,7,8","3,6",2,"Full day",
Prof. Bob Wilson,Friday,"4,5,7,8","1,2,3,6",2,"Afternoon only",Morning meetings

=== INSTRUCTIONS SHEET ===
Sheet Name,Purpose,Key Points,Validation Rules
Classes,"Define all classes with sections and student strength","Use consistent naming, specify course type","Class name + section must be unique"
Subjects,"List all subjects with codes and weekly hours","Mark lab subjects clearly, assign to correct course","Subject code must be unique, hours > 0"
Teachers,"Teacher details with subject expertise","List all subjects teacher can handle, set realistic hour limits","Email must be unique, max hours <= 40/week"
Classrooms,"All available rooms with capacity and type","Mark lab rooms clearly, specify equipment","Room name must be unique, capacity > 0"
Time Slots,"Define weekly schedule with periods and breaks","Use 24-hour format, mark breaks clearly","No overlapping periods, breaks properly placed"
Assignments,"Map classes to subjects and teachers","Ensure teacher can handle the subject, set priorities","Valid class-subject-teacher combinations only"
Availability,"Teacher availability by day and period","Be realistic about availability, consider preferences","Periods must exist in time slots"
Instructions,"How to fill the template","Read carefully before filling data","Follow all validation rules"

=== SAMPLE DATA NOTES ===
"This template contains comprehensive sample data for a typical engineering college"
"Modify all data according to your institution's requirements"
"Ensure all teacher names, subject names, and classroom names are consistent across sheets"
"Lab subjects must have corresponding lab classrooms available"
"Teacher availability must align with defined time slots"
"Subject assignments must match teacher expertise"
"Classroom capacity should accommodate class strength"
"Time slots should include appropriate breaks"
"Priority values help the algorithm make better scheduling decisions"
"The genetic algorithm will optimize based on all provided constraints"
"Hard constraints are never violated, soft constraints are preferences"
"Review all data for consistency before uploading"
"Contact system administrator for any clarifications"
"Save file as .xlsx or .csv format for upload"
"Keep a backup copy of your data"`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Complete_Template.csv"');
    res.send(comprehensiveCSV);
    console.log('Comprehensive CSV template sent successfully');
  } catch (error) {
    console.error('Template error via auth:', error);
    res.status(500).json({ error: error.message });
  }
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
