const WeeklyTimetable = require('../models/WeeklyTimetable');
const Semester = require('../models/Semester');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Timeslot = require('../models/Timeslot');

class SemesterTimetableGenerator {
  constructor(semester, classes, teachers, subjects, classrooms, timeslots) {
    this.semester = semester;
    this.classes = classes;
    this.teachers = teachers;
    this.subjects = subjects;
    this.classrooms = classrooms;
    this.timeslots = timeslots[0]; // Assuming one timeslot config
    this.workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.compensationDay = 'Saturday';
  }

  // Generate complete semester timetable week by week
  async generateSemesterTimetable() {
    const weeks = this.generateWeekRanges();
    const weeklyTimetables = [];
    const missedClasses = []; // Track classes missed due to holidays

    console.log(`Generating timetable for ${weeks.length} weeks`);

    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const weekNumber = i + 1;
      
      console.log(`Processing Week ${weekNumber}: ${week.start.toDateString()} - ${week.end.toDateString()}`);
      
      // Check for holidays in this week
      const holidaysInWeek = this.getHolidaysInWeek(week);
      
      // Generate base timetable for the week
      const baseSchedule = this.generateWeeklySchedule(weekNumber);
      
      // Remove classes that fall on holidays
      const { validEntries, missedEntries } = this.filterHolidayClashes(baseSchedule, holidaysInWeek, week);
      
      // Add missed classes to compensation queue
      missedClasses.push(...missedEntries.map(entry => ({
        ...entry,
        originalWeek: weekNumber,
        compensationReason: holidaysInWeek.join(', ')
      })));
      
      // Try to compensate missed classes within the same week
      const compensatedEntries = this.compensateWithinWeek(validEntries, missedEntries, week);
      
      // Create weekly timetable
      const weeklyTimetable = await WeeklyTimetable.create({
        semester: this.semester._id,
        weekNumber,
        weekStartDate: week.start,
        weekEndDate: week.end,
        entries: compensatedEntries,
        holidaysInWeek: holidaysInWeek,
        compensationsMade: compensatedEntries.filter(e => e.isCompensation).length,
        createdBy: this.semester.createdBy
      });

      weeklyTimetables.push(weeklyTimetable);
    }

    // Handle remaining missed classes with Saturday compensation
    if (missedClasses.length > 0) {
      await this.scheduleSaturdayCompensation(weeklyTimetables, missedClasses);
    }

    // Calculate syllabus progress for each week
    await this.calculateSyllabusProgress(weeklyTimetables);

    return {
      weeklyTimetables,
      totalWeeks: weeks.length,
      totalMissedClasses: missedClasses.length,
      compensationStrategy: 'Saturday classes and redistribution'
    };
  }

  // Generate week ranges for the entire semester
  generateWeekRanges() {
    const weeks = [];
    const start = new Date(this.semester.startDate);
    const end = new Date(this.semester.endDate);
    
    // Start from the first Monday of the semester
    const firstMonday = new Date(start);
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }

    let currentWeekStart = new Date(firstMonday);
    
    while (currentWeekStart <= end) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
      
      // Don't go beyond semester end
      if (weekEnd > end) {
        weekEnd.setTime(end.getTime());
      }
      
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd)
      });
      
      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  }

  // Generate base weekly schedule (same pattern each week)
  generateWeeklySchedule(weekNumber) {
    const entries = [];
    
    for (const cls of this.classes) {
      for (const subjectAssignment of cls.subjects) {
        const subject = subjectAssignment.subject;
        const teacher = subjectAssignment.teacher;
        const hoursPerWeek = subject.hoursPerWeek || 3;
        
        // Distribute hours across the week
        const scheduledHours = this.distributeHoursAcrossWeek(
          cls, subject, teacher, hoursPerWeek, weekNumber
        );
        
        entries.push(...scheduledHours);
      }
    }
    
    return entries;
  }

  // Distribute subject hours across the week
  distributeHoursAcrossWeek(cls, subject, teacher, hoursPerWeek, weekNumber) {
    const entries = [];
    const periods = this.timeslots.periods || [];
    
    let hoursScheduled = 0;
    let dayIndex = 0;
    let periodIndex = 0;
    
    while (hoursScheduled < hoursPerWeek && dayIndex < this.workingDays.length) {
      const day = this.workingDays[dayIndex];
      const period = periods[periodIndex];
      
      if (period && !period.isBreak) {
        // Find available classroom
        const classroom = this.findAvailableClassroom(cls, subject);
        
        entries.push({
          day,
          period: period.periodNumber,
          class: cls._id,
          subject: subject._id,
          teacher: teacher._id,
          classroom: classroom?._id,
          isCompensation: false,
          isDoubleClass: false,
          isSaturdayClass: false
        });
        
        hoursScheduled++;
      }
      
      // Move to next period/day
      periodIndex++;
      if (periodIndex >= periods.length) {
        periodIndex = 0;
        dayIndex++;
      }
    }
    
    return entries;
  }

  // Find available classroom for a class/subject
  findAvailableClassroom(cls, subject) {
    // Prefer lab classrooms for lab subjects
    if (subject.isLab) {
      const labClassroom = this.classrooms.find(room => 
        room.isLab && room.capacity >= (cls.strength || 30)
      );
      if (labClassroom) return labClassroom;
    }
    
    // Find regular classroom with sufficient capacity
    return this.classrooms.find(room => 
      !room.isLab && room.capacity >= (cls.strength || 30)
    );
  }

  // Get holidays that fall within a specific week
  getHolidaysInWeek(week) {
    const holidays = [];
    
    if (this.semester.holidays) {
      for (const holiday of this.semester.holidays) {
        const holidayStart = new Date(holiday.startDate);
        const holidayEnd = new Date(holiday.endDate);
        
        // Check if holiday overlaps with this week
        if (holidayStart <= week.end && holidayEnd >= week.start) {
          holidays.push(holiday.name);
        }
      }
    }
    
    return holidays;
  }

  // Filter out classes that clash with holidays
  filterHolidayClashes(schedule, holidaysInWeek, week) {
    if (holidaysInWeek.length === 0) {
      return { validEntries: schedule, missedEntries: [] };
    }
    
    const validEntries = [];
    const missedEntries = [];
    
    for (const entry of schedule) {
      const entryDate = this.getDateForDayInWeek(entry.day, week);
      const isHoliday = this.isDateHoliday(entryDate);
      
      if (isHoliday) {
        missedEntries.push(entry);
      } else {
        validEntries.push(entry);
      }
    }
    
    return { validEntries, missedEntries };
  }

  // Get specific date for a day within a week
  getDateForDayInWeek(dayName, week) {
    const dayIndex = this.workingDays.indexOf(dayName);
    if (dayIndex === -1) return null;
    
    const date = new Date(week.start);
    date.setDate(date.getDate() + dayIndex);
    return date;
  }

  // Check if a specific date is a holiday
  isDateHoliday(date) {
    if (!this.semester.holidays || !date) return false;
    
    const checkDate = date.toDateString();
    
    return this.semester.holidays.some(holiday => {
      const holidayStart = new Date(holiday.startDate);
      const holidayEnd = new Date(holiday.endDate);
      
      return date >= holidayStart && date <= holidayEnd;
    });
  }

  // Try to compensate missed classes within the same week
  compensateWithinWeek(validEntries, missedEntries, week) {
    const compensatedEntries = [...validEntries];
    const periods = this.timeslots.periods || [];
    
    for (const missedEntry of missedEntries) {
      let compensated = false;
      
      // Try to find free slots in the same week
      for (const day of this.workingDays) {
        if (compensated) break;
        
        for (const period of periods) {
          if (period.isBreak) continue;
          
          // Check if this slot is free
          const isSlotFree = !compensatedEntries.some(entry => 
            entry.day === day && entry.period === period.periodNumber
          );
          
          if (isSlotFree && !this.isDateHoliday(this.getDateForDayInWeek(day, week))) {
            compensatedEntries.push({
              ...missedEntry,
              day,
              period: period.periodNumber,
              isCompensation: true,
              compensationReason: `Compensating for holiday`
            });
            compensated = true;
            break;
          }
        }
      }
    }
    
    return compensatedEntries;
  }

  // Schedule remaining missed classes on Saturdays
  async scheduleSaturdayCompensation(weeklyTimetables, missedClasses) {
    const periods = this.timeslots.periods || [];
    let saturdayPeriodIndex = 0;
    
    for (const missedClass of missedClasses) {
      // Find the appropriate week to add Saturday class
      const targetWeek = weeklyTimetables.find(wt => wt.weekNumber === missedClass.originalWeek) || 
                        weeklyTimetables[weeklyTimetables.length - 1];
      
      if (saturdayPeriodIndex < periods.length) {
        const period = periods[saturdayPeriodIndex];
        
        if (!period.isBreak) {
          targetWeek.entries.push({
            day: this.compensationDay,
            period: period.periodNumber,
            class: missedClass.class,
            subject: missedClass.subject,
            teacher: missedClass.teacher,
            classroom: missedClass.classroom,
            isCompensation: true,
            isSaturdayClass: true,
            originalWeek: missedClass.originalWeek,
            compensationReason: missedClass.compensationReason
          });
          
          targetWeek.compensationsMade++;
          await targetWeek.save();
          
          saturdayPeriodIndex++;
        }
      }
    }
  }

  // Calculate syllabus progress for each week
  async calculateSyllabusProgress(weeklyTimetables) {
    for (const weeklyTimetable of weeklyTimetables) {
      const progressMap = new Map();
      
      // Count hours per subject for this week
      for (const entry of weeklyTimetable.entries) {
        const subjectId = entry.subject.toString();
        if (!progressMap.has(subjectId)) {
          progressMap.set(subjectId, { plannedHours: 0, actualHours: 0 });
        }
        
        const progress = progressMap.get(subjectId);
        progress.plannedHours++;
        
        // For completed weeks, actualHours would be updated separately
        if (weeklyTimetable.status === 'completed') {
          progress.actualHours++;
        }
      }
      
      // Convert to syllabus progress array
      weeklyTimetable.syllabusProgress = Array.from(progressMap.entries()).map(([subjectId, progress]) => {
        const subject = this.subjects.find(s => s._id.toString() === subjectId);
        const totalHoursNeeded = subject ? subject.hoursPerWeek * weeklyTimetables.length : 0;
        const completionPercentage = totalHoursNeeded > 0 ? 
          Math.round((progress.actualHours / totalHoursNeeded) * 100) : 0;
        
        return {
          subject: subjectId,
          plannedHours: progress.plannedHours,
          actualHours: progress.actualHours,
          completionPercentage
        };
      });
      
      await weeklyTimetable.save();
    }
  }
}

module.exports = SemesterTimetableGenerator;