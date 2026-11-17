const express = require('express');
const Substitute = require('../models/Substitute');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all substitutes/swaps for current user
router.get('/', auth, async (req, res) => {
  const subs = await Substitute.find({ createdBy: req.user.id })
    .populate('originalEntry.class originalEntry.subject originalEntry.teacher originalEntry.classroom')
    .populate('substituteTeacher requestedBy swapWith.teacher approvedBy')
    .sort('-createdAt');
  res.json(subs);
});

// Find available substitute teachers for a specific slot
router.post('/find-substitute', auth, async (req, res) => {
  try {
    const { timetableId, day, period } = req.body;
    
    // Get the timetable to check existing assignments
    const timetable = await Timetable.findOne({ _id: timetableId, createdBy: req.user.id })
      .populate('entries.teacher');
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    
    // Find teachers already assigned at this slot
    const busyTeachers = timetable.entries
      .filter(e => e.day === day && e.period === period)
      .map(e => e.teacher?._id?.toString())
      .filter(Boolean);
    
    // Get all teachers and filter available ones
    const allTeachers = await Teacher.find({ createdBy: req.user.id });
    const available = allTeachers.filter(t => {
      const tid = t._id.toString();
      if (busyTeachers.includes(tid)) return false;
      
      // Check teacher availability constraints
      if (t.availability && t.availability.length > 0) {
        const dayAvail = t.availability.find(a => a.day === day);
        if (dayAvail && !dayAvail.periods.includes(period)) return false;
      }
      
      return true;
    });
    
    res.json({ available, busyCount: busyTeachers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create substitute assignment
router.post('/assign', auth, async (req, res) => {
  try {
    const { timetableId, originalEntry, substituteTeacher, isLibrary, reason } = req.body;
    
    const sub = await Substitute.create({
      timetableId,
      originalEntry,
      type: 'substitute',
      substituteTeacher: isLibrary ? null : substituteTeacher,
      isLibrary,
      reason,
      status: 'approved', // Auto-approve substitutes
      createdBy: req.user.id
    });
    
    const populated = await Substitute.findById(sub._id)
      .populate('originalEntry.class originalEntry.subject originalEntry.teacher originalEntry.classroom')
      .populate('substituteTeacher');
    
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create swap request
router.post('/swap-request', auth, async (req, res) => {
  try {
    const { timetableId, originalEntry, swapWith, requestedBy, reason } = req.body;
    
    const swap = await Substitute.create({
      timetableId,
      originalEntry,
      type: 'swap',
      swapWith,
      requestedBy,
      reason,
      status: 'pending', // Swaps need approval
      createdBy: req.user.id
    });
    
    const populated = await Substitute.findById(swap._id)
      .populate('originalEntry.class originalEntry.subject originalEntry.teacher originalEntry.classroom')
      .populate('requestedBy swapWith.teacher');
    
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Approve/reject swap
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    const sub = await Substitute.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status, approvedBy: req.user.id },
      { new: true }
    ).populate('originalEntry.class originalEntry.subject originalEntry.teacher originalEntry.classroom')
     .populate('substituteTeacher requestedBy swapWith.teacher approvedBy');
    
    if (!sub) return res.status(404).json({ message: 'Not found' });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete substitute/swap
router.delete('/:id', auth, async (req, res) => {
  await Substitute.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;