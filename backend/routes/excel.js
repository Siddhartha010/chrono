const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const ExcelService = require('../utils/ExcelService');
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

// Download Excel template
router.get('/template', auth, async (req, res) => {
  try {
    const excelService = new ExcelService();
    const workbook = await excelService.generateTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Template.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Upload and parse Excel file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const excelService = new ExcelService();
    const parsedData = await excelService.parseExcelFile(req.file.buffer);
    
    res.json({
      success: true,
      data: parsedData,
      summary: {
        classes: parsedData.classes.length,
        subjects: parsedData.subjects.length,
        teachers: parsedData.teachers.length,
        classrooms: parsedData.classrooms.length,
        timeSlots: parsedData.timeSlots.periods.length,
        assignments: parsedData.assignments.length,
        errors: parsedData.errors.length,
        warnings: parsedData.warnings.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to parse Excel file' });
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