const express = require('express');
const auth = require('../middleware/auth');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');
const { runGA } = require('../utils/geneticAlgorithm');
const router = express.Router();

// Generate timetable
router.post('/generate', auth, async (req, res) => {
  try {
    const { constraints = {} } = req.body;
    const uid = req.user.id;

    const [classes, teachers, classrooms, timeslots] = await Promise.all([
      Class.find({ createdBy: uid }).populate('subjects.subject subjects.teacher'),
      Teacher.find({ createdBy: uid }),
      Classroom.find({ createdBy: uid }),
      Timeslot.find({ createdBy: uid })
    ]);

    if (!timeslots.length) return res.status(400).json({ message: 'No timeslot configuration found' });
    if (!classrooms.length) return res.status(400).json({ message: 'No classrooms found' });
    if (!classes.length) return res.status(400).json({ message: 'No classes found' });

    const timeslotConfig = timeslots[0];
    const { chromosome, fitnessScore, generation } = runGA(classes, teachers, classrooms, timeslotConfig, constraints);

    const entries = chromosome.map(gene => ({
      day: gene.day,
      period: gene.period,
      class: gene.classId,
      subject: gene.subjectId,
      teacher: gene.teacherId,
      classroom: gene.classroomId
    }));

    const timetable = await Timetable.create({
      entries,
      fitnessScore: Math.round(fitnessScore * 100),
      generation,
      constraints,
      status: 'completed',
      createdBy: uid
    });

    const populated = await Timetable.findById(timetable._id)
      .populate('entries.class entries.subject entries.teacher entries.classroom');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all timetables for current user
router.get('/', auth, async (req, res) => {
  const timetables = await Timetable.find({ createdBy: req.user.id }).select('-entries').sort('-createdAt');
  res.json(timetables);
});

// Get single timetable — only if owned by current user
router.get('/:id', auth, async (req, res) => {
  try {
    const tt = await Timetable.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('entries.class entries.subject entries.teacher entries.classroom');
    if (!tt) return res.status(404).json({ message: 'Not found' });
    res.json(tt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete timetable
router.delete('/:id', auth, async (req, res) => {
  await Timetable.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  res.json({ message: 'Deleted' });
});

// Teacher dashboard
router.get('/:id/teacher-dashboard', auth, async (req, res) => {
  try {
    const tt = await Timetable.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('entries.teacher entries.subject entries.class');
    if (!tt) return res.status(404).json({ message: 'Not found' });

    const dashboard = {};
    for (const entry of tt.entries) {
      const tid = entry.teacher?._id?.toString();
      if (!tid) continue;
      if (!dashboard[tid]) {
        dashboard[tid] = { teacher: entry.teacher, totalLectures: 0, byDay: {}, subjects: new Set() };
      }
      dashboard[tid].totalLectures++;
      dashboard[tid].byDay[entry.day] = (dashboard[tid].byDay[entry.day] || 0) + 1;
      if (entry.subject) dashboard[tid].subjects.add(entry.subject.name);
    }

    res.json(Object.values(dashboard).map(d => ({ ...d, subjects: [...d.subjects] })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
