import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, 
  Database, Wand2, FileText, Users, MapPin, Clock, Loader, Eye
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function ExcelImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const downloadTemplate = () => {
    try {
      toast.loading('Generating template...', { id: 'download' });
      
      const wb = XLSX.utils.book_new();

      // 1. Classes Sheet
      const classesData = [
        ['Class Name', 'Section', 'Strength', 'Course'],
        ['BTech CSE', 'A', 60, 'BTech'],
        ['BTech CSE', 'B', 58, 'BTech'],
        ['BCS', 'A', 45, 'BCS']
      ];
      const classesWs = XLSX.utils.aoa_to_sheet(classesData);
      XLSX.utils.book_append_sheet(wb, classesWs, 'Classes');

      // 2. Subjects Sheet
      const subjectsData = [
        ['Subject Name', 'Subject Code', 'Hours Per Week', 'Is Lab', 'Course'],
        ['Data Structures', 'CS201', 4, 'No', 'BTech'],
        ['Database Systems', 'CS301', 3, 'No', 'BTech'],
        ['Database Lab', 'CS301L', 2, 'Yes', 'BTech']
      ];
      const subjectsWs = XLSX.utils.aoa_to_sheet(subjectsData);
      XLSX.utils.book_append_sheet(wb, subjectsWs, 'Subjects');

      // 3. Teachers Sheet
      const teachersData = [
        ['Teacher Name', 'Email', 'Subjects (comma separated)', 'Max Hours Per Day', 'Max Hours Per Week', 'Course'],
        ['Dr. John Smith', 'john@college.edu', 'Data Structures,Algorithms', 6, 24, 'BTech'],
        ['Prof. Jane Doe', 'jane@college.edu', 'Database Systems,Database Lab', 5, 20, 'BTech']
      ];
      const teachersWs = XLSX.utils.aoa_to_sheet(teachersData);
      XLSX.utils.book_append_sheet(wb, teachersWs, 'Teachers');

      // 4. Classrooms Sheet
      const classroomsData = [
        ['Room Name', 'Capacity', 'Is Lab', 'Building'],
        ['Room 101', 60, 'No', 'Main Block'],
        ['Lab 201', 30, 'Yes', 'CS Block'],
        ['Room 102', 50, 'No', 'Main Block']
      ];
      const classroomsWs = XLSX.utils.aoa_to_sheet(classroomsData);
      XLSX.utils.book_append_sheet(wb, classroomsWs, 'Classrooms');

      // 5. Time Slots Sheet
      const timeSlotsData = [
        ['Days (comma separated)', 'Period Number', 'Start Time', 'End Time', 'Is Break'],
        ['Monday,Tuesday,Wednesday,Thursday,Friday', 1, '09:00', '10:00', 'No'],
        ['Monday,Tuesday,Wednesday,Thursday,Friday', 2, '10:00', '11:00', 'No'],
        ['Monday,Tuesday,Wednesday,Thursday,Friday', 3, '11:00', '11:15', 'Yes'],
        ['Monday,Tuesday,Wednesday,Thursday,Friday', 4, '11:15', '12:15', 'No'],
        ['Monday,Tuesday,Wednesday,Thursday,Friday', 5, '12:15', '13:15', 'No']
      ];
      const timeSlotsWs = XLSX.utils.aoa_to_sheet(timeSlotsData);
      XLSX.utils.book_append_sheet(wb, timeSlotsWs, 'TimeSlots');

      // 6. Class-Subject Assignments Sheet
      const assignmentsData = [
        ['Class Name', 'Section', 'Subject Name', 'Teacher Name'],
        ['BTech CSE', 'A', 'Data Structures', 'Dr. John Smith'],
        ['BTech CSE', 'A', 'Database Systems', 'Prof. Jane Doe'],
        ['BTech CSE', 'B', 'Data Structures', 'Dr. John Smith']
      ];
      const assignmentsWs = XLSX.utils.aoa_to_sheet(assignmentsData);
      XLSX.utils.book_append_sheet(wb, assignmentsWs, 'Assignments');

      // 7. Instructions Sheet
      const instructionsData = [
        ['Sheet', 'Instructions'],
        ['Classes', 'Add all classes with their sections and student strength. Course field helps organize classes by program.'],
        ['Subjects', 'List all subjects with codes and weekly hours. Mark lab subjects as "Yes" in Is Lab column.'],
        ['Teachers', 'Add teacher details with subjects they can teach (comma separated). Set realistic hour limits.'],
        ['Classrooms', 'List all available rooms with capacity. Mark lab rooms as "Yes" for lab subjects.'],
        ['TimeSlots', 'Define your weekly schedule with periods and breaks. Use 24-hour format for times.'],
        ['Assignments', 'Assign subjects to classes with specific teachers. Each row creates a class-subject-teacher mapping.'],
        ['General', 'Fill all sheets completely. Ensure teacher names, subject names match exactly across sheets.']
      ];
      const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
      XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

      // Write and download
      XLSX.writeFile(wb, 'ChronoGen_Template.xlsx');
      
      toast.success('Template downloaded successfully!', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate template: ' + error.message, { id: 'download' });
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Accept both .xlsx and .csv files
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a .xlsx or .csv file');
        return;
      }
      setFile(selectedFile);
      setParsedData(null);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    
    try {
      // Simple upload without FormData for now
      const response = await api.post('/excel/upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      setParsedData(response.data.data);
      toast.success('File uploaded and parsed successfully!');
      
      if (response.data.data.errors.length > 0) {
        toast.error(`Found ${response.data.data.errors.length} errors`);
      }
      if (response.data.data.warnings.length > 0) {
        toast.warning(`Found ${response.data.data.warnings.length} warnings`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const generateTimetable = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/excel/generate', { data: parsedData });
      toast.success('Timetable generated successfully!');
      navigate(`/timetable/${response.data.timetable._id}`);
    } catch (error) {
      toast.error('Timetable generation failed');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const renderSummary = () => {
    if (!parsedData) return null;

    const summaryItems = [
      { label: 'Classes', count: parsedData.classes.length, icon: Users, color: 'blue' },
      { label: 'Subjects', count: parsedData.subjects.length, icon: FileText, color: 'green' },
      { label: 'Teachers', count: parsedData.teachers.length, icon: Users, color: 'orange' },
      { label: 'Classrooms', count: parsedData.classrooms.length, icon: MapPin, color: 'purple' },
      { label: 'Time Slots', count: parsedData.timeSlots.periods.length, icon: Clock, color: 'teal' },
      { label: 'Assignments', count: parsedData.assignments.length, icon: FileText, color: 'pink' }
    ];

    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Data Summary</span>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={14} /> {showPreview ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          {summaryItems.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="stat-card">
                <div className={`stat-icon ${item.color}`}><Icon size={16} /></div>
                <div>
                  <div className="stat-value">{item.count}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {showPreview && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Sample Data Preview:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {parsedData.classes.length > 0 && (
                <div>
                  <strong>Classes:</strong>
                  <ul style={{ fontSize: '0.85rem', marginTop: 4 }}>
                    {parsedData.classes.slice(0, 3).map((cls, i) => (
                      <li key={i}>{cls.name} {cls.section} ({cls.strength} students)</li>
                    ))}
                    {parsedData.classes.length > 3 && <li>...and {parsedData.classes.length - 3} more</li>}
                  </ul>
                </div>
              )}
              
              {parsedData.subjects.length > 0 && (
                <div>
                  <strong>Subjects:</strong>
                  <ul style={{ fontSize: '0.85rem', marginTop: 4 }}>
                    {parsedData.subjects.slice(0, 3).map((subject, i) => (
                      <li key={i}>{subject.name} ({subject.hoursPerWeek}h/week)</li>
                    ))}
                    {parsedData.subjects.length > 3 && <li>...and {parsedData.subjects.length - 3} more</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderValidation = () => {
    if (!parsedData || (parsedData.errors.length === 0 && parsedData.warnings.length === 0)) return null;

    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Validation Results</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {parsedData.errors.length > 0 && (
              <span className="badge badge-red">{parsedData.errors.length} Errors</span>
            )}
            {parsedData.warnings.length > 0 && (
              <span className="badge badge-yellow">{parsedData.warnings.length} Warnings</span>
            )}
          </div>
        </div>
        
        {parsedData.errors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={16} style={{ color: '#dc2626' }} />
              <strong style={{ color: '#dc2626' }}>Errors (must be fixed):</strong>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: 8, padding: 12 }}>
              {parsedData.errors.map((error, index) => (
                <div key={index} style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: 4 }}>
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {parsedData.warnings.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={16} style={{ color: '#ea580c' }} />
              <strong style={{ color: '#ea580c' }}>Warnings:</strong>
            </div>
            <div style={{ background: '#fef3c7', borderRadius: 8, padding: 12 }}>
              {parsedData.warnings.map((warning, index) => (
                <div key={index} style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: 4 }}>
                  • {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="page">
      <div className="topbar">
        <h2>Excel Import/Export</h2>
      </div>

      <div style={{ marginTop: 24, maxWidth: 1000 }}>
        {/* Step 1: Download Template */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Step 1: Download Template</span>
          </div>
          <div>
            <p style={{ color: '#64748b', marginBottom: 12 }}>
              Download the Excel template with pre-configured sheets for all your timetable data.
            </p>
            <button className="btn btn-primary" onClick={downloadTemplate}>
              <Download size={16} /> Download Excel Template
            </button>
          </div>
        </div>

        {/* Step 2: Upload File */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span className="card-title">Step 2: Upload Filled Template</span>
          </div>
          <div>
            <div style={{ marginBottom: 16 }}>
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                onChange={handleFileSelect}
                style={{ marginBottom: 12 }}
              />
              {file && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: 8, 
                  background: '#f0f9ff', 
                  borderRadius: 6,
                  fontSize: '0.9rem'
                }}>
                  <FileSpreadsheet size={16} style={{ color: '#2563eb' }} />
                  <span>{file.name}</span>
                  <span style={{ color: '#64748b' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={uploadFile}
              disabled={!file || uploading}
            >
              {uploading ? <Loader size={16} className="spinner" /> : <Upload size={16} />}
              {uploading ? 'Uploading...' : 'Upload & Parse'}
            </button>
          </div>
        </div>

        {/* Data Summary */}
        {renderSummary()}

        {/* Validation Results */}
        {renderValidation()}

        {/* Step 3: Generate Timetable */}
        {parsedData && parsedData.errors.length === 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Step 3: Generate Timetable</span>
            </div>
            <div>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Generate an optimized timetable using the parsed data.
              </p>
              
              <button 
                className="btn btn-success" 
                onClick={generateTimetable}
                disabled={generating}
              >
                {generating ? <Loader size={16} className="spinner" /> : <Wand2 size={16} />}
                {generating ? 'Generating...' : 'Generate Timetable'}
              </button>
              
              {parsedData.errors.length > 0 && (
                <div style={{ 
                  marginTop: 8, 
                  padding: 8, 
                  background: '#fee2e2', 
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  color: '#dc2626'
                }}>
                  Cannot generate timetable with errors. Please fix errors and re-upload.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}