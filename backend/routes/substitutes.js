const express = require('express');
const Substitute = require('../models/Substitute');
const Timetable = require('../models/Timetable');
const Teacher = require('../models/Teacher');
const Timeslot = require('../models/Timeslot');
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
    
    // Check for unavailable teachers due to approved unavailabilities
    const TeacherUnavailability = require('../models/TeacherUnavailability');
    const unavailabilities = await TeacherUnavailability.find({
      createdBy: req.user.id,
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    const unavailableTeachers = unavailabilities
      .filter(u => {
        if (u.isFullDay) return true;
        if (u.specificSlots && u.specificSlots.length > 0) {
          const daySlot = u.specificSlots.find(s => s.day === day);
          return daySlot && daySlot.periods.includes(period);
        }
        return true; // If no specific slots, assume full day
      })
      .map(u => u.teacher.toString());
    
    // Get all teachers and filter available ones
    const allTeachers = await Teacher.find({ createdBy: req.user.id });
    const available = allTeachers.filter(t => {
      const tid = t._id.toString();
      if (busyTeachers.includes(tid)) return false;
      if (unavailableTeachers.includes(tid)) return false;
      
      // Check teacher availability constraints
      if (t.availability && t.availability.length > 0) {
        const dayAvail = t.availability.find(a => a.day === day);
        if (dayAvail && !dayAvail.periods.includes(period)) return false;
      }
      
      return true;
    });
    
    res.json({ 
      available, 
      busyCount: busyTeachers.length,
      unavailableCount: unavailableTeachers.length
    });
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

// Get timetable with substitutions applied
router.get('/timetable/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, createdBy: req.user.id })
      .populate('entries.class entries.subject entries.teacher entries.classroom');
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    const substitutes = await Substitute.find({ 
      timetableId: req.params.id, 
      status: 'approved' 
    }).populate('substituteTeacher originalEntry.teacher originalEntry.class originalEntry.subject originalEntry.classroom swapWith.teacher');

    const timeslot = await Timeslot.findOne({ createdBy: req.user.id });
    
    console.log('Backend: Timetable entries:', timetable.entries.length);
    console.log('Backend: Found substitutes:', substitutes.length);
    substitutes.forEach((sub, i) => {
      console.log(`Backend: Substitute ${i}:`, {
        day: sub.originalEntry?.day,
        period: sub.originalEntry?.period,
        classId: sub.originalEntry?.class?._id || sub.originalEntry?.class,
        teacherId: sub.originalEntry?.teacher?._id || sub.originalEntry?.teacher,
        substituteTeacher: sub.substituteTeacher?.name,
        status: sub.status
      });
    });
    
    res.json({
      ...timetable.toObject(),
      substitutes,
      days: timeslot?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periods: timeslot?.periods || []
    });
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;