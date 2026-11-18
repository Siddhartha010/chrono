const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const ExcelTemplateService = require('../utils/ExcelTemplateService');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');
const { runGA } = require('../utils/geneticAlgorithm');
const Timetable = require('../models/Timetable');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'), false);
    }
  }
});

// Download Excel template
router.get('/template', auth, async (req, res) => {
  try {
    const templateService = new ExcelTemplateService();
    const workbook = await templateService.generateTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ChronoGen_Template.xlsx"');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ message: 'Failed to generate template', error: error.message });
  }
});

// Upload and parse Excel file
router.post('/upload', auth, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const templateService = new ExcelTemplateService();
    const parsedData = await templateService.parseExcelFile(req.file.buffer);
    
    // Store parsed data in session or temporary storage for preview
    req.session = req.session || {};
    req.session.parsedData = parsedData;
    
    res.json({
      message: 'File parsed successfully',
      data: parsedData,
      hasErrors: parsedData.errors.length > 0,
      hasWarnings: parsedData.warnings.length > 0,
      summary: {
        classes: parsedData.classes.length,
        subjects: parsedData.subjects.length,
        teachers: parsedData.teachers.length,
        classrooms: parsedData.classrooms.length,
        timeSlots: parsedData.timeSlots.periods?.length || 0,
        holidays: parsedData.holidays.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Failed to parse file', error: error.message });
  }
});

// Preview parsed data
router.get('/preview', auth, async (req, res) => {
  try {
    const parsedData = req.session?.parsedData;
    
    if (!parsedData) {
      return res.status(404).json({ message: 'No parsed data found. Please upload a file first.' });
    }
    
    res.json(parsedData);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: 'Failed to retrieve preview data', error: error.message });
  }
});

// Import data to database
router.post('/import', auth, async (req, res) => {
  try {
    const parsedData = req.session?.parsedData;
    
    if (!parsedData) {
      return res.status(404).json({ message: 'No parsed data found. Please upload a file first.' });
    }
    
    if (parsedData.errors.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot import data with errors. Please fix errors and re-upload.',
        errors: parsedData.errors 
      });
    }
    
    // Import data to database
    const userId = req.user.id;
    const importResults = {
      subjects: 0,
      teachers: 0,
      classrooms: 0,
      classes: 0,
      timeslots: 0,
      errors: []
    };
    
    try {
      // Import subjects
      for (const subjectData of parsedData.subjects) {
        const existingSubject = await Subject.findOne({ 
          name: subjectData.name, 
          createdBy: userId 
        });
        
        if (!existingSubject) {
          await Subject.create({
            ...subjectData,
            createdBy: userId
          });
          importResults.subjects++;
        }
      }
      
      // Import classrooms
      for (const roomData of parsedData.classrooms) {
        const existingRoom = await Classroom.findOne({ 
          name: roomData.name, 
          createdBy: userId 
        });
        
        if (!existingRoom) {
          await Classroom.create({
            name: roomData.name,
            capacity: roomData.capacity,
            isLab: roomData.isLab,
            building: roomData.building,
            createdBy: userId
          });
          importResults.classrooms++;
        }
      }
      
      // Import teachers
      for (const teacherData of parsedData.teachers) {
        const existingTeacher = await Teacher.findOne({ 
          name: teacherData.name, 
          createdBy: userId 
        });
        
        if (!existingTeacher) {
          // Find subject IDs
          const subjectIds = [];
          for (const subjectName of teacherData.subjects) {
            const subject = await Subject.findOne({ 
              name: subjectName, 
              createdBy: userId 
            });
            if (subject) {
              subjectIds.push(subject._id);
            }
          }
          
          await Teacher.create({
            name: teacherData.name,
            email: teacherData.email,
            subjects: subjectIds,
            availability: teacherData.availability,
            maxHoursPerDay: teacherData.maxHoursPerDay,
            maxHoursPerWeek: teacherData.maxHoursPerWeek,
            createdBy: userId
          });
          importResults.teachers++;
        }
      }
      
      // Import classes
      for (const classData of parsedData.classes) {
        const existingClass = await Class.findOne({ 
          name: classData.name, 
          section: classData.section,
          createdBy: userId 
        });
        
        if (!existingClass) {
          // Build subject-teacher assignments
          const subjects = [];
          for (const assignment of classData.subjects) {
            const subject = await Subject.findOne({ 
              name: assignment.subject, 
              createdBy: userId 
            });
            const teacher = await Teacher.findOne({ 
              name: assignment.teacher, 
              createdBy: userId 
            });
            
            if (subject && teacher) {
              subjects.push({
                subject: subject._id,
                teacher: teacher._id
              });
            }
          }
          
          await Class.create({
            name: classData.name,
            section: classData.section,
            strength: classData.strength,
            subjects: subjects,
            createdBy: userId
          });
          importResults.classes++;
        }
      }
      
      // Import timeslots
      const existingTimeslot = await Timeslot.findOne({ createdBy: userId });
      if (!existingTimeslot && parsedData.timeSlots.periods.length > 0) {
        await Timeslot.create({
          days: parsedData.timeSlots.days,
          periods: parsedData.timeSlots.periods,
          createdBy: userId
        });
        importResults.timeslots = 1;
      }
      
    } catch (error) {
      importResults.errors.push(`Import error: ${error.message}`);
    }\n    \n    // Clear session data\n    if (req.session) {\n      delete req.session.parsedData;\n    }\n    \n    res.json({\n      message: 'Data imported successfully',\n      results: importResults,\n      warnings: parsedData.warnings\n    });\n    \n  } catch (error) {\n    console.error('Import error:', error);\n    res.status(500).json({ message: 'Failed to import data', error: error.message });\n  }\n});\n\n// Generate timetable from imported data\nrouter.post('/generate-timetable', auth, async (req, res) => {\n  try {\n    const { constraints = {} } = req.body;\n    const userId = req.user.id;\n    \n    // Fetch all data\n    const [classes, teachers, classrooms, timeslots] = await Promise.all([\n      Class.find({ createdBy: userId }).populate('subjects.subject subjects.teacher'),\n      Teacher.find({ createdBy: userId }),\n      Classroom.find({ createdBy: userId }),\n      Timeslot.find({ createdBy: userId })\n    ]);\n    \n    if (!timeslots.length) {\n      return res.status(400).json({ message: 'No timeslot configuration found' });\n    }\n    if (!classrooms.length) {\n      return res.status(400).json({ message: 'No classrooms found' });\n    }\n    if (!classes.length) {\n      return res.status(400).json({ message: 'No classes found' });\n    }\n    \n    const timeslotConfig = timeslots[0];\n    \n    // Apply constraints from Excel if provided\n    const parsedData = req.session?.parsedData;\n    let gaConstraints = constraints;\n    \n    if (parsedData && parsedData.constraints) {\n      gaConstraints = {\n        populationSize: parsedData.constraints.populationsize || 50,\n        maxGenerations: parsedData.constraints.maxgenerations || 200,\n        mutationRate: parsedData.constraints.mutationrate || 0.1,\n        crossoverRate: parsedData.constraints.crossoverrate || 0.8,\n        ...constraints\n      };\n    }\n    \n    const { chromosome, fitnessScore, generation } = runGA(\n      classes, \n      teachers, \n      classrooms, \n      timeslotConfig, \n      gaConstraints\n    );\n    \n    const entries = chromosome.map(gene => ({\n      day: gene.day,\n      period: gene.period,\n      class: gene.classId,\n      subject: gene.subjectId,\n      teacher: gene.teacherId,\n      classroom: gene.classroomId\n    }));\n    \n    const timetable = await Timetable.create({\n      name: 'Generated from Excel Import',\n      entries,\n      fitnessScore: Math.round(fitnessScore * 100),\n      generation,\n      constraints: gaConstraints,\n      status: 'completed',\n      createdBy: userId\n    });\n    \n    const populated = await Timetable.findById(timetable._id)\n      .populate('entries.class entries.subject entries.teacher entries.classroom');\n    \n    res.json({\n      message: 'Timetable generated successfully from imported data',\n      timetable: populated,\n      importSummary: {\n        classes: classes.length,\n        teachers: teachers.length,\n        classrooms: classrooms.length,\n        subjects: await Subject.countDocuments({ createdBy: userId })\n      }\n    });\n    \n  } catch (error) {\n    console.error('Timetable generation error:', error);\n    res.status(500).json({ message: 'Failed to generate timetable', error: error.message });\n  }\n});\n\n// Validate Excel data without importing\nrouter.post('/validate', auth, upload.single('excelFile'), async (req, res) => {\n  try {\n    if (!req.file) {\n      return res.status(400).json({ message: 'No file uploaded' });\n    }\n    \n    const templateService = new ExcelTemplateService();\n    const parsedData = await templateService.parseExcelFile(req.file.buffer);\n    \n    // Additional validation against existing data\n    const userId = req.user.id;\n    const existingData = {\n      subjects: await Subject.find({ createdBy: userId }).select('name'),\n      teachers: await Teacher.find({ createdBy: userId }).select('name'),\n      classrooms: await Classroom.find({ createdBy: userId }).select('name'),\n      classes: await Class.find({ createdBy: userId }).select('name section')\n    };\n    \n    // Check for duplicates\n    const duplicateWarnings = [];\n    \n    parsedData.subjects.forEach(subject => {\n      if (existingData.subjects.some(existing => existing.name === subject.name)) {\n        duplicateWarnings.push(`Subject '${subject.name}' already exists`);\n      }\n    });\n    \n    parsedData.teachers.forEach(teacher => {\n      if (existingData.teachers.some(existing => existing.name === teacher.name)) {\n        duplicateWarnings.push(`Teacher '${teacher.name}' already exists`);\n      }\n    });\n    \n    parsedData.classrooms.forEach(room => {\n      if (existingData.classrooms.some(existing => existing.name === room.name)) {\n        duplicateWarnings.push(`Classroom '${room.name}' already exists`);\n      }\n    });\n    \n    parsedData.classes.forEach(cls => {\n      if (existingData.classes.some(existing => \n        existing.name === cls.name && existing.section === cls.section)) {\n        duplicateWarnings.push(`Class '${cls.name} ${cls.section}' already exists`);\n      }\n    });\n    \n    res.json({\n      message: 'Validation completed',\n      isValid: parsedData.errors.length === 0,\n      errors: parsedData.errors,\n      warnings: [...parsedData.warnings, ...duplicateWarnings],\n      summary: {\n        classes: parsedData.classes.length,\n        subjects: parsedData.subjects.length,\n        teachers: parsedData.teachers.length,\n        classrooms: parsedData.classrooms.length,\n        timeSlots: parsedData.timeSlots.periods?.length || 0,\n        holidays: parsedData.holidays.length\n      }\n    });\n    \n  } catch (error) {\n    console.error('Validation error:', error);\n    res.status(500).json({ message: 'Validation failed', error: error.message });\n  }\n});\n\nmodule.exports = router;