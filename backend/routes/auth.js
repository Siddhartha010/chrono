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
  const subjectsCSV = `Subject Name,Subject Code,Hours Per Week,Is Lab,Course,Prerequisites,Department,Semester,Credits,Type
Data Structures,CS201,4,false,BTech,Programming Fundamentals,Computer Science,3,4,Core
Data Structures Lab,CS201L,2,true,BTech,CS201,Computer Science,3,1,Core
Database Management Systems,CS301,3,false,BTech,Data Structures,Computer Science,4,3,Core
Database Lab,CS301L,2,true,BTech,CS301,Computer Science,4,1,Core
Computer Networks,CS401,3,false,BTech,Operating Systems,Computer Science,5,3,Core
Network Lab,CS401L,2,true,BTech,CS401,Computer Science,5,1,Core
Software Engineering,CS501,3,false,BTech,Database Management Systems,Computer Science,6,3,Core
Web Development,CS601,3,false,BTech,Database Management Systems,Computer Science,6,3,Elective
Web Development Lab,CS601L,2,true,BTech,CS601,Computer Science,6,1,Elective
Machine Learning,CS701,4,false,BTech,Statistics,Computer Science,7,4,Elective
Artificial Intelligence,CS801,3,false,BTech,Machine Learning,Computer Science,8,3,Elective
Operating Systems,CS302,3,false,BTech,Computer Organization,Computer Science,4,3,Core
OS Lab,CS302L,2,true,BTech,CS302,Computer Science,4,1,Core
Compiler Design,CS502,3,false,BTech,Theory of Computation,Computer Science,6,3,Core
Mobile App Development,CS602,3,false,BTech,Web Development,Computer Science,6,3,Elective
Mobile Lab,CS602L,2,true,BTech,CS602,Computer Science,6,1,Elective
Cybersecurity,CS702,3,false,BTech,Computer Networks,Computer Science,7,3,Elective
Cloud Computing,CS802,3,false,BTech,Computer Networks,Computer Science,8,3,Elective
Microprocessors,EC301,3,false,BTech,Digital Electronics,Electronics,4,3,Core
Microprocessors Lab,EC301L,2,true,BTech,EC301,Electronics,4,1,Core
Signal Processing,EC401,4,false,BTech,Mathematics III,Electronics,5,4,Core
Communication Systems,EC501,3,false,BTech,Signal Processing,Electronics,6,3,Core
VLSI Design,EC601,3,false,BTech,Microprocessors,Electronics,6,3,Elective
Embedded Systems,EC701,3,false,BTech,Microprocessors,Electronics,7,3,Elective
Thermodynamics,ME301,3,false,BTech,Physics,Mechanical,4,3,Core
Fluid Mechanics,ME401,4,false,BTech,Thermodynamics,Mechanical,5,4,Core
Machine Design,ME501,3,false,BTech,Strength of Materials,Mechanical,6,3,Core
Manufacturing Processes,ME601,3,false,BTech,Machine Design,Mechanical,6,3,Core
Automobile Engineering,ME701,3,false,BTech,Thermodynamics,Mechanical,7,3,Elective
Structural Analysis,CE301,4,false,BTech,Mechanics of Materials,Civil,4,4,Core
Concrete Technology,CE401,3,false,BTech,Structural Analysis,Civil,5,3,Core
Geotechnical Engineering,CE501,3,false,BTech,Soil Mechanics,Civil,6,3,Core
Transportation Engineering,CE601,3,false,BTech,Highway Engineering,Civil,6,3,Core
Environmental Engineering,CE701,3,false,BTech,Chemistry,Civil,7,3,Elective
Programming Fundamentals,BCS101,4,false,BCS,,Computer Science,1,4,Core
Programming Lab,BCS101L,2,true,BCS,BCS101,Computer Science,1,1,Core
Mathematics I,BCS201,3,false,BCS,,Mathematics,1,3,Core
Mathematics II,BCS202,3,false,BCS,BCS201,Mathematics,2,3,Core
Statistics,BCS301,3,false,BCS,Mathematics II,Mathematics,3,3,Core
Discrete Mathematics,BCS302,3,false,BCS,Mathematics I,Mathematics,3,3,Core
Object Oriented Programming,BCS401,4,false,BCS,Programming Fundamentals,Computer Science,4,4,Core
OOP Lab,BCS401L,2,true,BCS,BCS401,Computer Science,4,1,Core
Advanced Java,MCA201,4,false,MCA,Object Oriented Programming,Computer Science,2,4,Core
Java Lab,MCA201L,2,true,MCA,MCA201,Computer Science,2,1,Core
System Analysis,MCA301,3,false,MCA,Software Engineering,Computer Science,3,3,Core
Project Management,MCA401,3,false,MCA,System Analysis,Management,4,3,Core
Data Mining,MCA501,3,false,MCA,Database Management Systems,Computer Science,5,3,Elective
Big Data Analytics,MCA601,3,false,MCA,Data Mining,Computer Science,6,3,Elective
Marketing Management,MBA101,3,false,MBA,,Management,1,3,Core
Financial Management,MBA201,3,false,MBA,Accounting,Management,2,3,Core
Human Resource Management,MBA301,3,false,MBA,Organizational Behavior,Management,3,3,Core
Operations Management,MBA401,3,false,MBA,Statistics,Management,4,3,Core
Strategic Management,MBA501,3,false,MBA,Marketing Management,Management,5,3,Core
International Business,MBA601,3,false,MBA,Strategic Management,Management,6,3,Elective
Advanced Algorithms,MSC201,4,false,MSc,Data Structures,Computer Science,2,4,Core
Research Methodology,MSC301,3,false,MSc,,Research,3,3,Core
Thesis Work,MSC401,2,false,MSc,Research Methodology,Research,4,6,Core
Advanced Mathematics,MSC101,4,false,MSc,,Mathematics,1,4,Core
Numerical Methods,MSC202,3,false,MSc,Advanced Mathematics,Mathematics,2,3,Core`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Subjects_Template.csv"');
  res.send(subjectsCSV);
});

router.get('/excel-teachers', (req, res) => {
  const teachersCSV = `Teacher Name,Email,Max Hours Per Day,Max Hours Per Week,Department,Specialization,Experience Years,Qualification,Phone,Preferred Time Slots,Unavailable Days,Subject Preferences,Lab Supervision,Research Areas
Dr. John Smith,john.smith@college.edu,6,30,Computer Science,Data Structures & Algorithms,15,PhD,+1234567890,Morning,Saturday,"Data Structures,Algorithms,Programming",Yes,"Machine Learning,AI"
Prof. Jane Doe,jane.doe@college.edu,5,25,Computer Science,Database Systems,12,PhD,+1234567891,Afternoon,,"Database,SQL,Data Mining",Yes,"Big Data,Analytics"
Dr. Alice Brown,alice.brown@college.edu,6,30,Computer Science,Computer Networks,10,PhD,+1234567892,Full Day,,"Networks,Security,Protocols",Yes,"Cybersecurity,IoT"
Prof. Bob Wilson,bob.wilson@college.edu,5,25,Computer Science,Software Engineering,8,MTech,+1234567893,Morning,"Monday,Friday","Software Design,Testing,Agile",No,"DevOps,Cloud"
Dr. Carol Davis,carol.davis@college.edu,6,30,Computer Science,Web Technologies,7,PhD,+1234567894,Afternoon,,"Web Dev,Mobile,UI/UX",Yes,"Frontend,React"
Prof. David Miller,david.miller@college.edu,6,30,Computer Science,Artificial Intelligence,14,PhD,+1234567895,Morning,,"ML,AI,Deep Learning",Yes,"Neural Networks,NLP"
Dr. Emma Taylor,emma.taylor@college.edu,5,25,Computer Science,Operating Systems,9,PhD,+1234567896,Full Day,Saturday,"OS,System Programming,Compilers",Yes,"Distributed Systems"
Prof. Frank Johnson,frank.johnson@college.edu,6,30,Computer Science,Programming Languages,11,MTech,+1234567897,Morning,,"Java,Python,C++,OOP",Yes,"Language Design"
Dr. Grace Lee,grace.lee@college.edu,5,25,Mathematics,Applied Mathematics,13,PhD,+1234567898,Afternoon,,"Statistics,Calculus,Discrete Math",No,"Numerical Analysis"
Prof. Henry Clark,henry.clark@college.edu,4,20,Management,Marketing & HR,6,MBA,+1234567899,Morning,"Wednesday,Saturday","Marketing,HR,Strategy",No,"Digital Marketing"
Dr. Ivy Martinez,ivy.martinez@college.edu,4,20,Management,Finance & Operations,8,PhD,+1234567800,Afternoon,,"Finance,Operations,Supply Chain",No,"Financial Modeling"
Prof. Jack Anderson,jack.anderson@college.edu,3,15,Computer Science,Research Methodology,20,PhD,+1234567801,Morning,"Monday,Tuesday","Research,Thesis,Publications",No,"Academic Writing"
Dr. Sarah Wilson,sarah.wilson@college.edu,5,25,Electronics,Microprocessors,12,PhD,+1234567802,Full Day,,"Microprocessors,Embedded,VLSI",Yes,"IoT,Robotics"
Prof. Mike Brown,mike.brown@college.edu,6,30,Electronics,Signal Processing,9,MTech,+1234567803,Morning,,"Signals,Communication,DSP",Yes,"Image Processing"
Dr. Lisa Davis,lisa.davis@college.edu,5,25,Mechanical,Thermodynamics,11,PhD,+1234567804,Afternoon,Saturday,"Thermal,Fluid,Heat Transfer",Yes,"Renewable Energy"
Prof. Tom Johnson,tom.johnson@college.edu,6,30,Mechanical,Manufacturing,8,MTech,+1234567805,Full Day,,"Manufacturing,Design,CAD",Yes,"Automation"
Dr. Amy Taylor,amy.taylor@college.edu,5,25,Civil,Structural Engineering,10,PhD,+1234567806,Morning,,"Structures,Concrete,Steel",Yes,"Earthquake Engineering"
Prof. Chris Lee,chris.lee@college.edu,6,30,Civil,Transportation,7,MTech,+1234567807,Afternoon,,"Transportation,Traffic,Urban Planning",No,"Smart Cities"`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Teachers_Template.csv"');
  res.send(teachersCSV);
});

router.get('/excel-classrooms', (req, res) => {
  const classroomsCSV = `Room Name,Capacity,Is Lab,Building,Floor,Equipment,AC,Projector,Smart Board,Whiteboard,Audio System,Network Points,Power Outlets,Accessibility,Room Type,Preferred Usage
Room 101,60,false,Main Block,1,"Projector,Whiteboard",Yes,Yes,No,Yes,No,2,8,Yes,Lecture Hall,Theory Classes
Room 102,55,false,Main Block,1,"Projector,Whiteboard",Yes,Yes,No,Yes,No,2,8,Yes,Lecture Hall,Theory Classes
Room 103,50,false,Main Block,1,"Smart Board,Audio",Yes,Yes,Yes,No,Yes,4,10,Yes,Smart Classroom,Interactive Sessions
Room 201,65,false,Main Block,2,"Projector,Audio,Whiteboard",Yes,Yes,No,Yes,Yes,2,8,Yes,Large Lecture Hall,Core Subjects
Room 202,60,false,Main Block,2,"Projector,Whiteboard",Yes,Yes,No,Yes,No,2,8,Yes,Lecture Hall,Theory Classes
Room 203,55,false,Main Block,2,"Smart Board,Audio",Yes,Yes,Yes,No,Yes,4,10,Yes,Smart Classroom,Interactive Sessions
Room 301,45,false,Main Block,3,"Projector,Whiteboard",Yes,Yes,No,Yes,No,2,6,No,Medium Hall,Elective Subjects
Room 302,40,false,Main Block,3,"Projector,Whiteboard",Yes,Yes,No,Yes,No,2,6,No,Medium Hall,Elective Subjects
Lab 301,30,true,CS Block,3,"30 Computers,Projector,Server",Yes,Yes,No,Yes,No,32,60,Yes,Computer Lab,Programming Labs
Lab 302,25,true,CS Block,3,"25 Computers,Projector,Network Setup",Yes,Yes,No,Yes,No,27,50,Yes,Network Lab,Network & Security Labs
Lab 303,35,true,CS Block,3,"35 Computers,Smart Board,High-end GPUs",Yes,Yes,Yes,No,No,37,70,Yes,Advanced Lab,ML & AI Labs
Lab 401,30,true,CS Block,4,"30 Computers,Server,Database Setup",Yes,Yes,No,Yes,No,32,60,Yes,Database Lab,Database Labs
Lab 402,25,true,CS Block,4,"25 Computers,Web Servers,Development Tools",Yes,Yes,No,Yes,No,27,50,Yes,Web Lab,Web Development Labs
Lab 501,20,true,EC Block,5,"20 Workstations,Oscilloscopes,Signal Generators",Yes,Yes,No,Yes,No,22,40,Yes,Electronics Lab,Electronics Practicals
Lab 502,18,true,EC Block,5,"18 Workstations,Microprocessor Kits,Embedded Boards",Yes,Yes,No,Yes,No,20,36,Yes,Microprocessor Lab,Embedded Systems
Lab 601,25,true,ME Block,6,"25 Workstations,CAD Software,3D Printers",Yes,Yes,No,Yes,No,27,50,Yes,CAD Lab,Design & Manufacturing
Lab 602,20,true,ME Block,6,"Testing Equipment,Material Testing Machines",Yes,No,No,Yes,No,5,20,No,Materials Lab,Materials Testing
Lab 701,22,true,CE Block,7,"22 Workstations,Surveying Equipment,AutoCAD",Yes,Yes,No,Yes,No,24,44,Yes,Civil Lab,Surveying & Design
Seminar Hall,100,false,Main Block,Ground,"Audio System,Projector,Microphones",Yes,Yes,No,No,Yes,4,12,Yes,Seminar Hall,Seminars & Presentations
Auditorium,200,false,Main Block,Ground,"Full Audio/Video Setup,Stage Lighting",Yes,Yes,No,No,Yes,6,20,Yes,Auditorium,Events & Conferences
Conference Room,20,false,Admin Block,2,"Video Conferencing,Smart Board,Round Table",Yes,Yes,Yes,No,Yes,8,16,Yes,Conference Room,Meetings & Discussions
Library Hall,80,false,Library Block,1,"Silent Study Setup,Individual Desks",Yes,No,No,No,No,40,80,Yes,Study Hall,Silent Study
Workshop Hall,40,false,Workshop Block,Ground,"Industrial Equipment,Safety Gear",No,No,No,Yes,No,8,20,No,Workshop,Practical Training
Drawing Hall,50,false,Main Block,2,"Drawing Boards,Technical Equipment",Yes,No,No,No,No,2,10,Yes,Drawing Hall,Technical Drawing
Language Lab,35,true,Humanities Block,1,"35 Audio Stations,Language Software",Yes,Yes,No,No,Yes,37,70,Yes,Language Lab,Language Learning`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Classrooms_Template.csv"');
  res.send(classroomsCSV);
});

// Additional comprehensive templates
router.get('/excel-timeslots', (req, res) => {
  const timeslotsCSV = `Days,Period Number,Start Time,End Time,Is Break,Break Name,Duration Minutes,Type,Priority
"Monday,Tuesday,Wednesday,Thursday,Friday",1,09:00,10:00,No,,60,Regular,High
"Monday,Tuesday,Wednesday,Thursday,Friday",2,10:00,11:00,No,,60,Regular,High
"Monday,Tuesday,Wednesday,Thursday,Friday",3,11:00,11:15,Yes,Tea Break,15,Break,
"Monday,Tuesday,Wednesday,Thursday,Friday",4,11:15,12:15,No,,60,Regular,High
"Monday,Tuesday,Wednesday,Thursday,Friday",5,12:15,13:15,No,,60,Regular,Medium
"Monday,Tuesday,Wednesday,Thursday,Friday",6,13:15,14:00,Yes,Lunch Break,45,Break,
"Monday,Tuesday,Wednesday,Thursday,Friday",7,14:00,15:00,No,,60,Regular,Medium
"Monday,Tuesday,Wednesday,Thursday,Friday",8,15:00,16:00,No,,60,Regular,Low
"Monday,Tuesday,Wednesday,Thursday,Friday",9,16:00,16:15,Yes,Evening Break,15,Break,
"Monday,Tuesday,Wednesday,Thursday,Friday",10,16:15,17:15,No,,60,Extended,Low
"Saturday",1,09:00,10:00,No,,60,Weekend,Medium
"Saturday",2,10:00,11:00,No,,60,Weekend,Medium
"Saturday",3,11:00,11:15,Yes,Tea Break,15,Break,
"Saturday",4,11:15,12:15,No,,60,Weekend,Medium
"Saturday",5,12:15,13:15,No,,60,Weekend,Low`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_TimeSlots_Template.csv"');
  res.send(timeslotsCSV);
});

router.get('/excel-assignments', (req, res) => {
  const assignmentsCSV = `Class Name,Section,Subject Name,Teacher Name,Priority,Preferred Days,Avoid Days,Special Requirements,Room Type Required,Consecutive Hours,Max Gap Hours,Preferred Time,Lab After Theory
BTech CSE,A,Data Structures,Dr. John Smith,9,"Monday,Wednesday,Friday",,Lab after theory,Lecture Hall,2,1,Morning,Yes
BTech CSE,A,Data Structures Lab,Dr. John Smith,8,"Tuesday,Thursday",,Need CS Lab,Computer Lab,2,0,Morning,No
BTech CSE,A,Database Management Systems,Prof. Jane Doe,9,"Monday,Wednesday,Friday",,Interactive sessions preferred,Smart Classroom,1,2,Afternoon,Yes
BTech CSE,A,Database Lab,Prof. Jane Doe,8,"Tuesday,Thursday",,Need Database Lab,Database Lab,2,0,Afternoon,No
BTech CSE,A,Computer Networks,Dr. Alice Brown,8,"Monday,Wednesday",,Theory before lab,Lecture Hall,1,1,Morning,Yes
BTech CSE,A,Network Lab,Dr. Alice Brown,7,"Thursday,Friday",,Need Network Lab,Network Lab,2,0,Afternoon,No
BTech CSE,A,Software Engineering,Prof. Bob Wilson,7,"Tuesday,Thursday",,Case studies required,Smart Classroom,1,2,Morning,No
BTech CSE,A,Web Development,Dr. Carol Davis,8,"Monday,Friday",,Project-based learning,Lecture Hall,1,1,Afternoon,Yes
BTech CSE,A,Web Development Lab,Dr. Carol Davis,7,"Wednesday,Thursday",,Need Web Lab,Web Lab,2,0,Afternoon,No
BTech CSE,B,Data Structures,Dr. John Smith,9,"Tuesday,Thursday,Friday",,Lab after theory,Lecture Hall,2,1,Morning,Yes
BTech CSE,B,Data Structures Lab,Dr. John Smith,8,"Monday,Wednesday",,Need CS Lab,Computer Lab,2,0,Morning,No
BTech CSE,B,Database Management Systems,Prof. Jane Doe,9,"Tuesday,Thursday,Friday",,Interactive sessions,Smart Classroom,1,2,Afternoon,Yes
BTech CSE,B,Database Lab,Prof. Jane Doe,8,"Monday,Wednesday",,Need Database Lab,Database Lab,2,0,Afternoon,No
BTech IT,A,Data Structures,Dr. John Smith,8,"Monday,Wednesday",,Basic concepts focus,Lecture Hall,2,1,Morning,Yes
BTech IT,A,Database Management Systems,Prof. Jane Doe,8,"Tuesday,Friday",,Practical approach,Smart Classroom,1,2,Afternoon,Yes
BTech ECE,A,Microprocessors,Dr. Sarah Wilson,9,"Monday,Wednesday,Friday",,Hardware focus,Lecture Hall,1,1,Morning,Yes
BTech ECE,A,Microprocessors Lab,Dr. Sarah Wilson,8,"Tuesday,Thursday",,Need Electronics Lab,Electronics Lab,2,0,Afternoon,No
BTech ECE,A,Signal Processing,Prof. Mike Brown,8,"Monday,Wednesday",,Mathematical concepts,Lecture Hall,2,1,Morning,No
BTech ME,A,Thermodynamics,Dr. Lisa Davis,9,"Tuesday,Thursday,Friday",,Theory intensive,Lecture Hall,1,2,Morning,No
BTech ME,A,Fluid Mechanics,Dr. Lisa Davis,8,"Monday,Wednesday",,Lab demonstrations,Lecture Hall,1,1,Afternoon,Yes
BTech CE,A,Structural Analysis,Dr. Amy Taylor,9,"Monday,Wednesday,Friday",,Design focus,Lecture Hall,2,1,Morning,Yes
BTech CE,A,Concrete Technology,Dr. Amy Taylor,8,"Tuesday,Thursday",,Material testing,Materials Lab,1,1,Afternoon,No
BCS,A,Programming Fundamentals,Prof. Frank Johnson,9,"Monday,Wednesday,Friday",,Hands-on coding,Smart Classroom,1,1,Morning,Yes
BCS,A,Programming Lab,Prof. Frank Johnson,8,"Tuesday,Thursday",,Individual practice,Computer Lab,2,0,Morning,No
BCS,A,Mathematics I,Dr. Grace Lee,8,"Monday,Wednesday",,Problem solving,Lecture Hall,1,2,Morning,No
BCS,A,Statistics,Dr. Grace Lee,7,"Tuesday,Friday",,Data analysis focus,Smart Classroom,1,1,Afternoon,No
MCA,A,Advanced Java,Prof. Frank Johnson,8,"Monday,Thursday",,Enterprise focus,Smart Classroom,2,1,Morning,Yes
MCA,A,Java Lab,Prof. Frank Johnson,7,"Tuesday,Friday",,Project development,Computer Lab,2,0,Afternoon,No
MCA,A,System Analysis,Prof. Jane Doe,7,"Wednesday,Thursday",,Case study method,Conference Room,1,2,Morning,No
MCA,A,Project Management,Prof. Bob Wilson,6,"Monday,Friday",,Group discussions,Conference Room,1,1,Afternoon,No
MBA,A,Marketing Management,Prof. Henry Clark,7,"Monday,Wednesday",,Interactive sessions,Smart Classroom,1,2,Morning,No
MBA,A,Financial Management,Dr. Ivy Martinez,8,"Tuesday,Thursday",,Calculation intensive,Lecture Hall,1,1,Afternoon,No
MBA,A,Human Resource Management,Prof. Henry Clark,6,"Wednesday,Friday",,Role play activities,Conference Room,1,2,Afternoon,No
MBA,A,Operations Management,Dr. Ivy Martinez,7,"Monday,Thursday",,Process analysis,Smart Classroom,1,1,Morning,No
MSc CS,A,Advanced Algorithms,Dr. John Smith,8,"Tuesday,Thursday",,Research oriented,Smart Classroom,2,1,Morning,No
MSc CS,A,Research Methodology,Prof. Jack Anderson,7,"Monday,Wednesday",,Seminar style,Seminar Hall,1,2,Morning,No
MSc CS,A,Thesis Work,Prof. Jack Anderson,6,"Friday",,Individual guidance,Conference Room,2,0,Morning,No`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Assignments_Template.csv"');
  res.send(assignmentsCSV);
});

router.get('/excel-availability', (req, res) => {
  const availabilityCSV = `Teacher Name,Day,Available Periods,Unavailable Periods,Max Consecutive Hours,Preferred Time Slots,Notes,Break Preferences,Travel Time,Room Preferences
Dr. John Smith,Monday,"1,2,4,5,7,8","3,6",3,Morning,Available for extra hours if needed,Prefers longer breaks,15 min,"Room 101,Room 201"
Dr. John Smith,Tuesday,"1,2,4,5,7,8,10","3,6,9",3,Morning,Research work in evening,Standard breaks,15 min,"Room 101,Room 201"
Dr. John Smith,Wednesday,"1,2,4,5,7,8","3,6",3,Morning,Committee meeting after 5 PM,Standard breaks,15 min,"Room 101,Room 201"
Dr. John Smith,Thursday,"1,2,4,5,7,8,10","3,6,9",3,Morning,Available for lab supervision,Standard breaks,15 min,"Lab 301,Lab 303"
Dr. John Smith,Friday,"1,2,4,5,7,8","3,6",3,Morning,Faculty meeting at 4 PM,Standard breaks,15 min,"Room 101,Room 201"
Prof. Jane Doe,Monday,"2,4,5,7,8","1,3,6",2,Afternoon,Not available first period,Prefers lunch break,20 min,"Room 103,Lab 401"
Prof. Jane Doe,Tuesday,"1,2,4,5,7,8","3,6",2,Afternoon,Database consultation hours,Standard breaks,20 min,"Room 103,Lab 401"
Prof. Jane Doe,Wednesday,"2,4,5,7,8","1,3,6",2,Afternoon,Not available first period,Standard breaks,20 min,"Room 103,Lab 401"
Prof. Jane Doe,Thursday,"1,2,4,5,7,8","3,6",2,Afternoon,Industry collaboration meeting,Standard breaks,20 min,"Room 103,Lab 401"
Prof. Jane Doe,Friday,"2,4,5,7,8","1,3,6",2,Afternoon,Research paper writing,Standard breaks,20 min,"Room 103,Lab 401"
Dr. Alice Brown,Monday,"1,2,4,5,7,8,10","3,6,9",4,Full Day,Network lab maintenance,Flexible breaks,10 min,"Room 201,Lab 302"
Dr. Alice Brown,Tuesday,"1,2,4,5,7,8","3,6",4,Full Day,Cybersecurity workshop prep,Standard breaks,10 min,"Room 201,Lab 302"
Dr. Alice Brown,Wednesday,"1,2,4,5,7,8,10","3,6,9",4,Full Day,Available for consultations,Flexible breaks,10 min,"Room 201,Lab 302"
Dr. Alice Brown,Thursday,"1,2,4,5,7,8","3,6",4,Full Day,Conference call at 3 PM,Standard breaks,10 min,"Room 201,Lab 302"
Dr. Alice Brown,Friday,"1,2,4,5,7,8,10","3,6,9",4,Full Day,Lab equipment testing,Flexible breaks,10 min,"Room 201,Lab 302"
Prof. Bob Wilson,Monday,"4,5,7,8","1,2,3,6",2,Afternoon Only,Morning administrative work,Prefers lunch break,25 min,"Room 103,Conference Room"
Prof. Bob Wilson,Tuesday,"1,2,4,5,7,8","3,6",2,Full Day,Software engineering seminar,Standard breaks,25 min,"Room 103,Conference Room"
Prof. Bob Wilson,Wednesday,"4,5,7,8","1,2,3,6",2,Afternoon Only,Morning meetings with industry,Prefers lunch break,25 min,"Room 103,Conference Room"
Prof. Bob Wilson,Thursday,"1,2,4,5,7,8","3,6",2,Full Day,Project review sessions,Standard breaks,25 min,"Room 103,Conference Room"
Prof. Bob Wilson,Friday,"4,5,7,8","1,2,3,6",2,Afternoon Only,Morning research work,Prefers lunch break,25 min,"Room 103,Conference Room"`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Availability_Template.csv"');
  res.send(availabilityCSV);
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
