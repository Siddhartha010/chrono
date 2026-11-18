const ExcelJS = require('exceljs');
const path = require('path');

class ExcelTemplateService {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  // Generate Excel template with all required sheets
  async generateTemplate() {
    // Clear existing worksheets
    this.workbook.removeWorksheet(this.workbook.getWorksheet(1));

    // Create sheets
    await this.createClassesSheet();
    await this.createSubjectsSheet();
    await this.createTeachersSheet();
    await this.createClassroomsSheet();
    await this.createTimeSlotsSheet();
    await this.createHolidaysSheet();
    await this.createConstraintsSheet();
    await this.createInstructionsSheet();

    return this.workbook;
  }

  // Classes Sheet
  async createClassesSheet() {
    const worksheet = this.workbook.addWorksheet('Classes');
    
    // Headers
    const headers = [
      'Class Name*', 'Section', 'Strength', 'Course', 'Semester', 
      'Subject 1*', 'Teacher 1*', 'Hours/Week 1*',
      'Subject 2', 'Teacher 2', 'Hours/Week 2',
      'Subject 3', 'Teacher 3', 'Hours/Week 3',
      'Subject 4', 'Teacher 4', 'Hours/Week 4',
      'Subject 5', 'Teacher 5', 'Hours/Week 5',
      'Subject 6', 'Teacher 6', 'Hours/Week 6'
    ];
    
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
    
    // Add sample data
    worksheet.addRow([
      'CSE-A', 'A', '60', 'BTech', '5', 
      'Data Structures', 'Dr. Smith', '4',
      'Algorithms', 'Prof. Johnson', '3',
      'Database Systems', 'Dr. Brown', '3',
      'Computer Networks', 'Prof. Davis', '3',
      '', '', '',
      '', '', ''
    ]);
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Add validation notes
    worksheet.getCell('A3').value = 'Note: * indicates required fields';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FF0000' } };
  }

  // Subjects Sheet
  async createSubjectsSheet() {
    const worksheet = this.workbook.addWorksheet('Subjects');
    
    const headers = [
      'Subject Name*', 'Subject Code', 'Course*', 'Semester', 
      'Hours Per Week*', 'Is Lab?', 'Lab Duration (hours)', 'Prerequisites'
    ];
    
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '70AD47' } };
    
    // Sample data
    worksheet.addRow(['Data Structures', 'CS301', 'BTech', '5', '4', 'No', '', '']);
    worksheet.addRow(['Database Lab', 'CS302L', 'BTech', '5', '2', 'Yes', '2', 'Database Systems']);
    
    worksheet.columns.forEach(column => {
      column.width = 18;
    });
    
    // Add dropdown for Is Lab
    worksheet.getCell('F2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Yes,No"']
    };
  }

  // Teachers Sheet
  async createTeachersSheet() {
    const worksheet = this.workbook.addWorksheet('Teachers');
    
    const headers = [
      'Teacher Name*', 'Email', 'Department', 'Designation',
      'Max Hours Per Day', 'Max Hours Per Week', 'Subjects (comma-separated)*',
      'Monday Periods', 'Tuesday Periods', 'Wednesday Periods', 
      'Thursday Periods', 'Friday Periods', 'Saturday Periods'
    ];
    
    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC000' } };
    
    // Sample data
    worksheet.addRow([
      'Dr. Smith', 'smith@university.edu', 'Computer Science', 'Professor',
      '6', '24', 'Data Structures, Algorithms',
      '1,2,3,4,5,6', '1,2,3,4,5,6', '1,2,3,4,5,6', 
      '1,2,3,4,5,6', '1,2,3,4,5,6', ''
    ]);
    
    worksheet.columns.forEach(column => {
      column.width = 16;
    });
    
    worksheet.getCell('A3').value = 'Note: Period numbers should be comma-separated (e.g., 1,2,3,4)';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FF0000' } };
  }

  // Classrooms Sheet
  async createClassroomsSheet() {
    const worksheet = this.workbook.addWorksheet('Classrooms');
    
    const headers = [
      'Room Name*', 'Building', 'Floor', 'Capacity*', 
      'Is Lab?', 'Lab Type', 'Equipment', 'Availability'
    ];
    
    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E74C3C' } };
    
    // Sample data
    worksheet.addRow(['Room 101', 'Main Building', '1', '60', 'No', '', '', 'All Days']);
    worksheet.addRow(['CS Lab 1', 'CS Building', '2', '30', 'Yes', 'Computer Lab', 'PCs, Projector', 'Mon-Fri']);
    
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Add dropdown for Is Lab
    worksheet.getCell('E2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Yes,No"']
    };
  }

  // Time Slots Sheet
  async createTimeSlotsSheet() {
    const worksheet = this.workbook.addWorksheet('TimeSlots');
    
    const headers = [
      'Period Number*', 'Start Time*', 'End Time*', 'Is Break?', 'Break Name'
    ];
    
    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '9B59B6' } };
    
    // Sample time slots
    const timeSlots = [
      [1, '08:00', '09:00', 'No', ''],
      [2, '09:00', '10:00', 'No', ''],
      [3, '10:00', '11:00', 'No', ''],
      [4, '11:00', '11:15', 'Yes', 'Tea Break'],
      [5, '11:15', '12:15', 'No', ''],
      [6, '12:15', '13:15', 'No', ''],
      [7, '13:15', '14:00', 'Yes', 'Lunch Break'],
      [8, '14:00', '15:00', 'No', ''],
      [9, '15:00', '16:00', 'No', '']
    ];
    
    timeSlots.forEach(slot => worksheet.addRow(slot));
    
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Add dropdown for Is Break
    for (let i = 2; i <= 10; i++) {
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Yes,No"']
      };
    }
  }

  // Holidays Sheet
  async createHolidaysSheet() {
    const worksheet = this.workbook.addWorksheet('Holidays');
    
    const headers = [
      'Holiday Name*', 'Start Date*', 'End Date*', 'Type*', 'Description'
    ];
    
    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '17A2B8' } };
    
    // Sample holidays
    worksheet.addRow(['Diwali', '2024-11-01', '2024-11-01', 'National', 'Festival of Lights']);
    worksheet.addRow(['Winter Break', '2024-12-25', '2024-12-31', 'Institutional', 'Year-end holidays']);
    
    worksheet.columns.forEach(column => {
      column.width = 18;
    });
    
    // Add dropdown for Type
    worksheet.getCell('D2').dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"National,Regional,Institutional"']
    };
    
    worksheet.getCell('A4').value = 'Note: Date format should be YYYY-MM-DD';
    worksheet.getCell('A4').font = { italic: true, color: { argb: 'FF0000' } };
  }

  // Constraints Sheet
  async createConstraintsSheet() {
    const worksheet = this.workbook.addWorksheet('Constraints');
    
    const headers = ['Constraint Type', 'Value', 'Description'];
    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6C757D' } };
    
    // Add constraint data
    const constraints = [
      ['Working Days', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Days when classes are scheduled'],
      ['Max Periods Per Day', '9', 'Maximum periods in a day'],
      ['Max Teacher Hours Per Day', '6', 'Maximum hours a teacher can teach per day'],
      ['Max Teacher Hours Per Week', '24', 'Maximum hours a teacher can teach per week'],
      ['Min Gap Between Classes', '0', 'Minimum periods gap between same class subjects'],
      ['Max Consecutive Hours', '3', 'Maximum consecutive hours for same teacher'],
      ['Lab Session Duration', '2', 'Duration of lab sessions in periods'],
      ['Break Duration', '15', 'Break duration in minutes'],
      ['Lunch Break Duration', '45', 'Lunch break duration in minutes'],
      ['Allow Saturday Classes', 'Yes', 'Allow classes on Saturday for compensation'],
      ['Max Saturday Periods', '6', 'Maximum periods on Saturday'],
      ['Priority Subjects', 'Mathematics,Physics,Chemistry', 'High priority subjects for better slots'],
      ['Avoid Last Period', 'Yes', 'Avoid scheduling important subjects in last period'],
      ['Teacher Preference Weight', '0.3', 'Weight for teacher availability preferences (0-1)'],
      ['Room Utilization Weight', '0.2', 'Weight for optimal room utilization (0-1)'],
      ['Class Distribution Weight', '0.5', 'Weight for balanced class distribution (0-1)']
    ];
    
    constraints.forEach(constraint => worksheet.addRow(constraint));
    
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Style constraint types
    for (let i = 2; i <= constraints.length + 1; i++) {
      worksheet.getCell(`A${i}`).font = { bold: true };
    }
  }

  // Instructions Sheet
  async createInstructionsSheet() {
    const worksheet = this.workbook.addWorksheet('Instructions');
    
    worksheet.getCell('A1').value = 'ChronoGen Excel Template Instructions';
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: '2E86AB' } };
    
    const instructions = [
      '',
      '📋 GENERAL INSTRUCTIONS:',
      '• Fill all sheets with your institutional data',
      '• Fields marked with * are mandatory',
      '• Follow the sample data format provided',
      '• Do not modify sheet names or header structure',
      '• Use consistent naming across all sheets',
      '',
      '📊 SHEET DESCRIPTIONS:',
      '',
      '1. CLASSES Sheet:',
      '   • Define all classes with their subjects and teachers',
      '   • Each class can have up to 6 subjects',
      '   • Specify hours per week for each subject',
      '',
      '2. SUBJECTS Sheet:',
      '   • List all subjects offered',
      '   • Mark lab subjects appropriately',
      '   • Specify prerequisites if any',
      '',
      '3. TEACHERS Sheet:',
      '   • Define teacher availability by periods',
      '   • List subjects each teacher can handle',
      '   • Set working hour limits',
      '',
      '4. CLASSROOMS Sheet:',
      '   • Define all available rooms',
      '   • Specify capacity and lab facilities',
      '   • Mark lab rooms appropriately',
      '',
      '5. TIMESLOTS Sheet:',
      '   • Define daily time structure',
      '   • Mark break periods',
      '   • Ensure no overlapping times',
      '',
      '6. HOLIDAYS Sheet:',
      '   • List all holidays in the semester',
      '   • Use YYYY-MM-DD date format',
      '   • Specify holiday types',
      '',
      '7. CONSTRAINTS Sheet:',
      '   • Configure generation parameters',
      '   • Adjust weights for optimization',
      '   • Set institutional policies',
      '',
      '⚠️ VALIDATION RULES:',
      '• Teacher names must match across sheets',
      '• Subject names must be consistent',
      '• Room capacities should accommodate class strength',
      '• Time slots should not exceed 2 hours duration',
      '• Teacher availability periods must exist in TimeSlots',
      '• Lab subjects should be assigned to lab rooms',
      '',
      '🚀 AFTER FILLING:',
      '1. Save the file as .xlsx format',
      '2. Upload through ChronoGen import feature',
      '3. Review validation results',
      '4. Generate optimized timetable',
      '',
      '💡 TIPS FOR BEST RESULTS:',
      '• Provide realistic teacher availability',
      '• Balance subject hours across the week',
      '• Consider room capacity vs class strength',
      '• Mark lab subjects and rooms correctly',
      '• Set appropriate constraints for your institution'
    ];
    
    instructions.forEach((instruction, index) => {
      const cell = worksheet.getCell(`A${index + 2}`);
      cell.value = instruction;
      
      if (instruction.includes('📋') || instruction.includes('📊') || instruction.includes('⚠️') || 
          instruction.includes('🚀') || instruction.includes('💡')) {
        cell.font = { bold: true, color: { argb: '2E86AB' } };
      } else if (instruction.includes('Sheet:')) {
        cell.font = { bold: true, color: { argb: '28A745' } };
      }
    });
    
    worksheet.getColumn('A').width = 80;
  }

  // Parse uploaded Excel file
  async parseExcelFile(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const parsedData = {
      classes: [],
      subjects: [],
      teachers: [],
      classrooms: [],
      timeSlots: [],
      holidays: [],
      constraints: {},
      errors: [],
      warnings: []
    };
    
    try {
      // Parse each sheet
      parsedData.classes = await this.parseClassesSheet(workbook);
      parsedData.subjects = await this.parseSubjectsSheet(workbook);
      parsedData.teachers = await this.parseTeachersSheet(workbook);
      parsedData.classrooms = await this.parseClassroomsSheet(workbook);
      parsedData.timeSlots = await this.parseTimeSlotsSheet(workbook);
      parsedData.holidays = await this.parseHolidaysSheet(workbook);
      parsedData.constraints = await this.parseConstraintsSheet(workbook);
      
      // Validate data integrity
      await this.validateDataIntegrity(parsedData);
      
    } catch (error) {
      parsedData.errors.push(`Parsing error: ${error.message}`);
    }
    
    return parsedData;
  }

  // Parse Classes sheet
  async parseClassesSheet(workbook) {
    const worksheet = workbook.getWorksheet('Classes');
    if (!worksheet) throw new Error('Classes sheet not found');
    
    const classes = [];
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue; // Skip empty rows
      
      const classData = {
        name: row[1],
        section: row[2] || '',
        strength: parseInt(row[3]) || 30,
        course: row[4] || '',
        semester: row[5] || '',
        subjects: []
      };
      
      // Parse subjects (up to 6 subjects)
      for (let j = 0; j < 6; j++) {
        const subjectIndex = 6 + (j * 3);
        const subject = row[subjectIndex];
        const teacher = row[subjectIndex + 1];
        const hours = parseInt(row[subjectIndex + 2]);
        
        if (subject && teacher && hours) {
          classData.subjects.push({
            subject: subject,
            teacher: teacher,
            hoursPerWeek: hours
          });
        }
      }
      
      classes.push(classData);
    }
    
    return classes;
  }

  // Parse Subjects sheet
  async parseSubjectsSheet(workbook) {
    const worksheet = workbook.getWorksheet('Subjects');
    if (!worksheet) throw new Error('Subjects sheet not found');
    
    const subjects = [];
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      subjects.push({
        name: row[1],
        code: row[2] || '',
        course: row[3] || '',
        semester: row[4] || '',
        hoursPerWeek: parseInt(row[5]) || 3,
        isLab: (row[6] || '').toLowerCase() === 'yes',
        labDuration: parseInt(row[7]) || 1,
        prerequisites: row[8] || ''
      });
    }
    
    return subjects;
  }

  // Parse Teachers sheet
  async parseTeachersSheet(workbook) {
    const worksheet = workbook.getWorksheet('Teachers');
    if (!worksheet) throw new Error('Teachers sheet not found');
    
    const teachers = [];
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      const teacher = {
        name: row[1],
        email: row[2] || '',
        department: row[3] || '',
        designation: row[4] || '',
        maxHoursPerDay: parseInt(row[5]) || 6,
        maxHoursPerWeek: parseInt(row[6]) || 24,
        subjects: (row[7] || '').split(',').map(s => s.trim()).filter(s => s),
        availability: []
      };
      
      // Parse availability for each day
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (let d = 0; d < days.length; d++) {
        const periodsStr = row[8 + d];
        if (periodsStr) {
          const periods = periodsStr.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
          if (periods.length > 0) {
            teacher.availability.push({
              day: days[d],
              periods: periods
            });
          }
        }
      }
      
      teachers.push(teacher);
    }
    
    return teachers;
  }

  // Parse Classrooms sheet
  async parseClassroomsSheet(workbook) {
    const worksheet = workbook.getWorksheet('Classrooms');
    if (!worksheet) throw new Error('Classrooms sheet not found');
    
    const classrooms = [];
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      classrooms.push({
        name: row[1],
        building: row[2] || '',
        floor: row[3] || '',
        capacity: parseInt(row[4]) || 30,
        isLab: (row[5] || '').toLowerCase() === 'yes',
        labType: row[6] || '',
        equipment: row[7] || '',
        availability: row[8] || 'All Days'
      });
    }
    
    return classrooms;
  }

  // Parse TimeSlots sheet
  async parseTimeSlotsSheet(workbook) {
    const worksheet = workbook.getWorksheet('TimeSlots');
    if (!worksheet) throw new Error('TimeSlots sheet not found');
    
    const timeSlots = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      periods: []
    };
    
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      timeSlots.periods.push({
        periodNumber: parseInt(row[1]),
        startTime: row[2],
        endTime: row[3],
        isBreak: (row[4] || '').toLowerCase() === 'yes',
        breakName: row[5] || ''
      });
    }
    
    return timeSlots;
  }

  // Parse Holidays sheet
  async parseHolidaysSheet(workbook) {
    const worksheet = workbook.getWorksheet('Holidays');
    if (!worksheet) throw new Error('Holidays sheet not found');
    
    const holidays = [];
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      holidays.push({
        name: row[1],
        startDate: row[2],
        endDate: row[3],
        type: row[4] || 'institutional',
        description: row[5] || ''
      });
    }
    
    return holidays;
  }

  // Parse Constraints sheet
  async parseConstraintsSheet(workbook) {
    const worksheet = workbook.getWorksheet('Constraints');
    if (!worksheet) throw new Error('Constraints sheet not found');
    
    const constraints = {};
    const rows = worksheet.getSheetValues();
    
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[1]) continue;
      
      const key = row[1].replace(/\s+/g, '').toLowerCase();
      let value = row[2];
      
      // Parse different value types
      if (typeof value === 'string') {
        if (value.includes(',')) {
          value = value.split(',').map(v => v.trim());
        } else if (value.toLowerCase() === 'yes') {
          value = true;
        } else if (value.toLowerCase() === 'no') {
          value = false;
        } else if (!isNaN(parseFloat(value))) {
          value = parseFloat(value);
        }
      }
      
      constraints[key] = value;
    }
    
    return constraints;
  }

  // Validate data integrity
  async validateDataIntegrity(parsedData) {
    const { classes, subjects, teachers, classrooms, timeSlots, holidays, errors, warnings } = parsedData;
    
    // Validate required fields
    classes.forEach((cls, index) => {
      if (!cls.name) errors.push(`Class ${index + 1}: Name is required`);
      if (cls.subjects.length === 0) errors.push(`Class ${cls.name}: At least one subject is required`);
    });
    
    subjects.forEach((subject, index) => {
      if (!subject.name) errors.push(`Subject ${index + 1}: Name is required`);
      if (!subject.hoursPerWeek || subject.hoursPerWeek < 1) {
        errors.push(`Subject ${subject.name}: Valid hours per week is required`);
      }
    });
    
    teachers.forEach((teacher, index) => {
      if (!teacher.name) errors.push(`Teacher ${index + 1}: Name is required`);
      if (teacher.subjects.length === 0) {
        warnings.push(`Teacher ${teacher.name}: No subjects assigned`);
      }
    });
    
    classrooms.forEach((room, index) => {
      if (!room.name) errors.push(`Classroom ${index + 1}: Name is required`);
      if (!room.capacity || room.capacity < 1) {
        errors.push(`Classroom ${room.name}: Valid capacity is required`);
      }
    });
    
    // Cross-reference validation
    const subjectNames = new Set(subjects.map(s => s.name));
    const teacherNames = new Set(teachers.map(t => t.name));
    const roomNames = new Set(classrooms.map(r => r.name));
    
    // Validate class-subject-teacher relationships
    classes.forEach(cls => {
      cls.subjects.forEach(assignment => {
        if (!subjectNames.has(assignment.subject)) {
          errors.push(`Class ${cls.name}: Subject '${assignment.subject}' not found in Subjects sheet`);
        }
        if (!teacherNames.has(assignment.teacher)) {
          errors.push(`Class ${cls.name}: Teacher '${assignment.teacher}' not found in Teachers sheet`);
        }
      });
    });
    
    // Validate teacher-subject relationships
    teachers.forEach(teacher => {
      teacher.subjects.forEach(subject => {
        if (!subjectNames.has(subject)) {
          warnings.push(`Teacher ${teacher.name}: Subject '${subject}' not found in Subjects sheet`);
        }
      });
    });
    
    // Validate time slots
    if (timeSlots.periods.length === 0) {
      errors.push('No time periods defined');
    } else {
      timeSlots.periods.forEach(period => {
        if (!period.startTime || !period.endTime) {
          errors.push(`Period ${period.periodNumber}: Start and end times are required`);
        }
        
        // Check for overlapping periods
        const startTime = new Date(`1970-01-01T${period.startTime}:00`);
        const endTime = new Date(`1970-01-01T${period.endTime}:00`);
        
        if (endTime <= startTime) {
          errors.push(`Period ${period.periodNumber}: End time must be after start time`);
        }
        
        const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
        if (duration > 2) {
          warnings.push(`Period ${period.periodNumber}: Duration exceeds 2 hours (${duration.toFixed(1)}h)`);
        }
      });
    }
    
    // Validate holidays
    holidays.forEach(holiday => {
      if (!holiday.startDate || !holiday.endDate) {
        errors.push(`Holiday ${holiday.name}: Start and end dates are required`);
      }
    });
  }
}

module.exports = ExcelTemplateService;