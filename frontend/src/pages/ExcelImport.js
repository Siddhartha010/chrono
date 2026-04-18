import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, 
  Database, Wand2, FileText, Users, MapPin, Clock, Loader, Eye
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import SystemDebug from '../components/SystemDebug';

export default function ExcelImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const downloadTemplate = async () => {
    try {
      toast.loading('Generating template...', { id: 'download' });
      
      const response = await api.get('/excel/template', { 
        responseType: 'blob',
        timeout: 30000
      });
      
      console.log('Response received:', response.headers['content-type']);
      
      if (response.data.size === 0) {
        throw new Error('Empty file received');
      }
      
      // Determine file type and name based on content-type
      const contentType = response.headers['content-type'];
      let fileName = 'ChronoGen_Template.csv';
      let mimeType = 'text/csv';
      
      if (contentType && contentType.includes('spreadsheet')) {
        fileName = 'ChronoGen_Template.xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Template downloaded successfully as ${fileName}!`, { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login to download template', { id: 'download' });
      } else if (error.response?.status === 500) {
        toast.error('Server error generating template', { id: 'download' });
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Download timeout - please try again', { id: 'download' });
      } else {
        toast.error('Failed to download template', { id: 'download' });
      }
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
      setImportResults(null);
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

  const importData = async () => {
    if (!parsedData || parsedData.errors.length > 0) {
      toast.error('Cannot import data with errors');
      return;
    }

    setImporting(true);
    try {
      const response = await api.post('/excel/import', { data: parsedData });
      setImportResults(response.data.results);
      toast.success('Data imported successfully!');
    } catch (error) {
      toast.error('Import failed');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const generateTimetable = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/excel/generate');
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

  const renderImportResults = () => {
    if (!importResults) return null;

    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
            <span className="card-title">Import Results</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          <div className="stat-card">
            <div className="stat-icon green"><FileText size={16} /></div>
            <div>
              <div className="stat-value">{importResults.subjects}</div>
              <div className="stat-label">Subjects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Users size={16} /></div>
            <div>
              <div className="stat-value">{importResults.teachers}</div>
              <div className="stat-label">Teachers</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><MapPin size={16} /></div>
            <div>
              <div className="stat-value">{importResults.classrooms}</div>
              <div className="stat-label">Classrooms</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><Users size={16} /></div>
            <div>
              <div className="stat-value">{importResults.classes}</div>
              <div className="stat-label">Classes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal"><Clock size={16} /></div>
            <div>
              <div className="stat-value">{importResults.timeslots}</div>
              <div className="stat-label">Timeslots</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="topbar">
        <h2>Excel Import/Export</h2>
      </div>

      <div style={{ marginTop: 24, maxWidth: 1000 }}>
        <SystemDebug />
        
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

        {/* Step 3: Import Data */}
        {parsedData && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Step 3: Import to Database</span>
            </div>
            <div>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Import the parsed data into your ChronoGen database.
              </p>
              
              <button 
                className="btn btn-success" 
                onClick={importData}
                disabled={parsedData.errors.length > 0 || importing}
              >
                {importing ? <Loader size={16} className="spinner" /> : <Database size={16} />}
                {importing ? 'Importing...' : 'Import Data'}
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
                  Cannot import data with errors. Please fix errors and re-upload.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Results */}
        {renderImportResults()}

        {/* Step 4: Generate Timetable */}
        {importResults && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title">Step 4: Generate Timetable</span>
            </div>
            <div>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Generate an optimized timetable using the imported data.
              </p>
              
              <button 
                className="btn btn-success" 
                onClick={generateTimetable}
                disabled={generating}
              >
                {generating ? <Loader size={16} className="spinner" /> : <Wand2 size={16} />}
                {generating ? 'Generating...' : 'Generate Timetable'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}