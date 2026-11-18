const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');
const Timetable = require('../models/Timetable');
const { runGA } = require('../utils/geneticAlgorithm');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files allowed'), false);
    }
  }
});

// Download Excel template (no auth for testing)
router.get('/template-test', async (req, res) => {
  try {
    // Simple test without ExcelService
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    const sheet = workbook.addWorksheet('Test');
    sheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Value', key: 'value', width: 15 }
    ];
    
    sheet.addRows([
      { name: 'Test 1', value: 'Working' },
      { name: 'Test 2', value: 'Success' }
    ]);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Test.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Test template error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Simple template download without ExcelService dependency
router.get('/template', auth, async (req, res) => {
  try {
    // Create template data as JSON first
    const templateData = {
      classes: [
        { name: 'BTech CSE', section: 'A', strength: 60, course: 'BTech' },
        { name: 'BTech CSE', section: 'B', strength: 58, course: 'BTech' },
        { name: 'BCS', section: 'A', strength: 45, course: 'BCS' }
      ],
      subjects: [
        { name: 'Data Structures', code: 'CS201', hoursPerWeek: 4, isLab: 'No', course: 'BTech' },
        { name: 'Database Systems', code: 'CS301', hoursPerWeek: 3, isLab: 'No', course: 'BTech' },
        { name: 'Database Lab', code: 'CS301L', hoursPerWeek: 2, isLab: 'Yes', course: 'BTech' }
      ],
      teachers: [
        { name: 'Dr. John Smith', email: 'john@college.edu', subjects: 'Data Structures,Algorithms', maxHoursPerDay: 6, maxHoursPerWeek: 24, course: 'BTech' },
        { name: 'Prof. Jane Doe', email: 'jane@college.edu', subjects: 'Database Systems,Database Lab', maxHoursPerDay: 5, maxHoursPerWeek: 20, course: 'BTech' }
      ],
      classrooms: [
        { name: 'Room 101', capacity: 60, isLab: 'No', building: 'Main Block' },
        { name: 'Lab 201', capacity: 30, isLab: 'Yes', building: 'CS Block' },
        { name: 'Room 102', capacity: 50, isLab: 'No', building: 'Main Block' }
      ],
      timeSlots: [
        { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', periodNumber: 1, startTime: '09:00', endTime: '10:00', isBreak: 'No' },
        { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', periodNumber: 2, startTime: '10:00', endTime: '11:00', isBreak: 'No' },
        { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', periodNumber: 3, startTime: '11:00', endTime: '11:15', isBreak: 'Yes' },
        { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', periodNumber: 4, startTime: '11:15', endTime: '12:15', isBreak: 'No' },
        { days: 'Monday,Tuesday,Wednesday,Thursday,Friday', periodNumber: 5, startTime: '12:15', endTime: '13:15', isBreak: 'No' }
      ],
      assignments: [
        { className: 'BTech CSE', section: 'A', subjectName: 'Data Structures', teacherName: 'Dr. John Smith' },
        { className: 'BTech CSE', section: 'A', subjectName: 'Database Systems', teacherName: 'Prof. Jane Doe' },
        { className: 'BTech CSE', section: 'B', subjectName: 'Data Structures', teacherName: 'Dr. John Smith' }
      ]
    };

    // Try to use ExcelJS if available, otherwise send CSV
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();

      // Create sheets
      const sheets = [
        { name: 'Classes', data: templateData.classes },
        { name: 'Subjects', data: templateData.subjects },
        { name: 'Teachers', data: templateData.teachers },
        { name: 'Classrooms', data: templateData.classrooms },
        { name: 'TimeSlots', data: templateData.timeSlots },
        { name: 'Assignments', data: templateData.assignments }
      ];

      sheets.forEach(({ name, data }) => {
        const sheet = workbook.addWorksheet(name);
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          sheet.columns = headers.map(header => ({ 
            header: header.charAt(0).toUpperCase() + header.slice(1), 
            key: header, 
            width: 20 
          }));
          sheet.addRows(data);
          
          // Style header
          const headerRow = sheet.getRow(1);
          headerRow.font = { bold: true };
          headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Template.xlsx"');
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (excelError) {
      console.log('ExcelJS not available, sending CSV:', excelError.message);
      
      // Fallback to CSV
      let csvContent = '';
      
      Object.keys(templateData).forEach(sheetName => {
        csvContent += `\n\n=== ${sheetName.toUpperCase()} ===\n`;
        const data = templateData[sheetName];
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          csvContent += headers.join(',') + '\n';
          data.forEach(row => {
            csvContent += headers.map(header => row[header] || '').join(',') + '\n';
          });
        }
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Template.csv"');
      res.send(csvContent);
    }
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template', details: error.message });
  }
});

// Upload and parse Excel file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, req.file.size, 'bytes');

    // Simple parsing without ExcelService
    const result = {
      classes: [
        { name: 'Sample Class', section: 'A', strength: 30, course: 'Sample' }
      ],
      subjects: [
        { name: 'Sample Subject', code: 'SS101', hoursPerWeek: 3, isLab: false, course: 'Sample' }
      ],
      teachers: [
        { name: 'Sample Teacher', email: 'teacher@example.com', subjects: ['Sample Subject'], maxHoursPerDay: 6, maxHoursPerWeek: 24, course: 'Sample' }
      ],
      classrooms: [
        { name: 'Room 101', capacity: 30, isLab: false, building: 'Main' }
      ],
      timeSlots: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periods: [
          { periodNumber: 1, startTime: '09:00', endTime: '10:00', isBreak: false },
          { periodNumber: 2, startTime: '10:00', endTime: '11:00', isBreak: false }
        ]
      },
      assignments: [
        { className: 'Sample Class', section: 'A', subjectName: 'Sample Subject', teacherName: 'Sample Teacher' }
      ],
      errors: [],
      warnings: ['This is sample data. Please upload a properly filled Excel template.']
    };

    // Try to parse Excel if ExcelJS is available
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      
      // Parse actual Excel data here if needed
      console.log('Excel file parsed successfully');
      result.warnings = ['Excel file uploaded successfully. Using sample data for demo.'];
    } catch (excelError) {
      console.log('Excel parsing failed, using sample data:', excelError.message);
      result.warnings.push('Excel parsing not available. Using sample data.');
    }
    
    res.json({
      success: true,
      data: result,
      summary: {
        classes: result.classes.length,
        subjects: result.subjects.length,
        teachers: result.teachers.length,
        classrooms: result.classrooms.length,
        timeSlots: result.timeSlots.periods.length,
        assignments: result.assignments.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to parse Excel file', details: error.message });
  }
});

// Import data to database
router.post('/import', auth, async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || data.errors.length > 0) {
      return res.status(400).json({ error: 'Invalid data or errors present' });
    }

    const userId = req.user.id;
    const results = { subjects: 0, teachers: 0, classrooms: 0, classes: 0, timeslots: 0 };

    // Import subjects
    for (const subjectData of data.subjects) {
      const existing = await Subject.findOne({ name: subjectData.name, createdBy: userId });
      if (!existing) {
        await Subject.create({ ...subjectData, createdBy: userId });
        results.subjects++;
      }
    }

    // Import classrooms
    for (const roomData of data.classrooms) {
      const existing = await Classroom.findOne({ name: roomData.name, createdBy: userId });
      if (!existing) {
        await Classroom.create({ ...roomData, createdBy: userId });
        results.classrooms++;
      }
    }

    // Import teachers
    for (const teacherData of data.teachers) {
      const existing = await Teacher.findOne({ name: teacherData.name, createdBy: userId });
      if (!existing) {
        // Find subject IDs
        const subjectIds = [];
        for (const subjectName of teacherData.subjects) {
          const subject = await Subject.findOne({ name: subjectName, createdBy: userId });
          if (subject) subjectIds.push(subject._id);
        }

        await Teacher.create({
          name: teacherData.name,
          email: teacherData.email,
          subjects: subjectIds,
          maxHoursPerDay: teacherData.maxHoursPerDay,
          maxHoursPerWeek: teacherData.maxHoursPerWeek,
          createdBy: userId
        });
        results.teachers++;
      }
    }

    // Import classes with assignments
    for (const classData of data.classes) {
      const existing = await Class.findOne({ 
        name: classData.name, 
        section: classData.section, 
        createdBy: userId 
      });
      
      if (!existing) {
        // Build subject-teacher assignments
        const subjects = [];
        const classAssignments = data.assignments.filter(a => 
          a.className === classData.name && a.section === classData.section
        );

        for (const assignment of classAssignments) {
          const subject = await Subject.findOne({ name: assignment.subjectName, createdBy: userId });
          const teacher = await Teacher.findOne({ name: assignment.teacherName, createdBy: userId });
          
          if (subject && teacher) {
            subjects.push({ subject: subject._id, teacher: teacher._id });
          }
        }

        await Class.create({
          name: classData.name,
          section: classData.section,
          strength: classData.strength,
          subjects: subjects,
          createdBy: userId
        });
        results.classes++;
      }
    }

    // Import timeslots
    const existingTimeslot = await Timeslot.findOne({ createdBy: userId });
    if (!existingTimeslot && data.timeSlots.periods.length > 0) {
      await Timeslot.create({
        days: data.timeSlots.days,
        periods: data.timeSlots.periods,
        createdBy: userId
      });
      results.timeslots = 1;
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Generate timetable from imported data
router.post('/generate', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all required data
    const [classes, teachers, classrooms, timeslots] = await Promise.all([
      Class.find({ createdBy: userId }).populate('subjects.subject subjects.teacher'),
      Teacher.find({ createdBy: userId }),
      Classroom.find({ createdBy: userId }),
      Timeslot.find({ createdBy: userId })
    ]);

    if (!classes.length || !teachers.length || !classrooms.length || !timeslots.length) {
      return res.status(400).json({ error: 'Missing required data for timetable generation' });
    }

    // Run genetic algorithm
    const { chromosome, fitnessScore, generation } = runGA(
      classes, 
      teachers, 
      classrooms, 
      timeslots[0],
      { populationSize: 50, maxGenerations: 200 }
    );

    // Create timetable entries
    const entries = chromosome.map(gene => ({
      day: gene.day,
      period: gene.period,
      class: gene.classId,
      subject: gene.subjectId,
      teacher: gene.teacherId,
      classroom: gene.classroomId
    }));

    // Save timetable
    const timetable = await Timetable.create({
      name: `Excel Import - ${new Date().toLocaleDateString()}`,
      entries,
      fitnessScore: Math.round(fitnessScore * 100),
      generation,
      status: 'completed',
      createdBy: userId
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('entries.class entries.subject entries.teacher entries.classroom');

    res.json({ success: true, timetable: populated });
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
});

module.exports = router;