import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, 
  X, Eye, Database, Wand2, FileText, Users, Calendar, 
  MapPin, Clock, AlertCircle, Loader, Server, ExternalLink
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ExcelImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');
  const [importResult, setImportResult] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null);

  useEffect(() => {
    checkBackendAvailability();
  }, []);

  const checkBackendAvailability = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.status === 'ok') {
        setBackendAvailable(true);
      } else {
        setBackendAvailable(false);
      }
    } catch (error) {
      console.log('Backend not available:', error.message);
      setBackendAvailable(false);
    }
  };

  const downloadTemplate = async () => {
    if (!backendAvailable) {
      toast.error('Backend server required for Excel functionality');
      return;
    }

    try {
      const response = await api.get('/excel/template', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ChronoGen_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Download error:', error);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast.error('Please select a valid .xlsx file');
        return;
      }
      setFile(selectedFile);
      setParsedData(null);
      setValidationResult(null);
      setImportResult(null);
    }
  };

  const validateFile = async () => {
    if (!backendAvailable) {
      toast.error('Backend server required for validation');
      return;
    }

    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setValidating(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await api.post('/excel/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setValidationResult(response.data);
      
      if (response.data.isValid) {
        toast.success('File validation passed!');
      } else {
        toast.error(`Validation failed with ${response.data.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Validation failed');
      console.error('Validation error:', error);
    } finally {
      setValidating(false);
    }
  };

  const uploadFile = async () => {
    if (!backendAvailable) {
      toast.error('Backend server required for file upload');
      return;
    }

    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await api.post('/excel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setParsedData(response.data.data);
      toast.success('File uploaded and parsed successfully!');
      
      if (response.data.hasErrors) {
        toast.error(`Found ${response.data.data.errors.length} errors that need to be fixed`);
      }
      
      if (response.data.hasWarnings) {
        toast.warning(`Found ${response.data.data.warnings.length} warnings`);
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const importData = async () => {
    if (!backendAvailable) {
      toast.error('Backend server required for data import');
      return;
    }

    if (!parsedData) {
      toast.error('No data to import');
      return;
    }

    if (parsedData.errors.length > 0) {
      toast.error('Cannot import data with errors. Please fix errors and re-upload.');
      return;
    }

    setImporting(true);
    try {
      const response = await api.post('/excel/import');
      setImportResult(response.data.results);
      toast.success('Data imported successfully!');
      
      if (response.data.warnings.length > 0) {
        toast.warning(`Import completed with ${response.data.warnings.length} warnings`);
      }
    } catch (error) {
      toast.error('Import failed');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const generateTimetable = async () => {
    if (!backendAvailable) {
      toast.error('Backend server required for timetable generation');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/excel/generate-timetable');
      toast.success('Timetable generated successfully!');
      navigate(`/timetable/${response.data.timetable._id}`);
    } catch (error) {
      toast.error('Timetable generation failed');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const renderBackendNotAvailable = () => (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={20} style={{ color: '#dc2626' }} />
          <span className="card-title">Backend Server Required</span>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: 600, color: '#dc2626' }}>Excel Import/Export requires a backend server</span>
          </div>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', marginBottom: 12 }}>
            This feature needs server-side processing for Excel file handling, data validation, 
            and timetable generation. Your current deployment (Vercel) only hosts the frontend.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12, color: '#374151' }}>Excel Template Structure:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="stat-card">
              <div className="stat-icon blue"><Users size={16} /></div>
              <div>
                <div className="stat-label">Classes Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Class name, section, strength, subjects</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FileText size={16} /></div>
              <div>
                <div className="stat-label">Subjects Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Subject name, code, hours/week, lab flag</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><Users size={16} /></div>
              <div>
                <div className="stat-label">Teachers Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Name, email, subjects, availability</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><MapPin size={16} /></div>
              <div>
                <div className="stat-label">Classrooms Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Room name, capacity, lab flag, building</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal"><Clock size={16} /></div>
              <div>
                <div className="stat-label">TimeSlots Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Days, periods, start/end times</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><Calendar size={16} /></div>
              <div>
                <div className="stat-label">Holidays Sheet</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Holiday dates, names, types</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12, color: '#374151' }}>Constraints Included:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • Teacher availability and max hours per day
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • Classroom capacity and lab requirements
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • Subject hours per week distribution
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • No teacher/class/room conflicts
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • Holiday and break considerations
            </div>
            <div style={{ padding: 8, background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem' }}>
              • Lab subject classroom matching
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #bae6fd', 
          borderRadius: 8, 
          padding: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Database size={16} style={{ color: '#0369a1' }} />
            <span style={{ fontWeight: 600, color: '#0369a1' }}>To enable this feature:</span>
          </div>
          <ol style={{ color: '#0c4a6e', fontSize: '0.9rem', paddingLeft: 20 }}>
            <li>Deploy your backend to Railway, Render, or Heroku</li>
            <li>Set REACT_APP_API_URL environment variable in Vercel</li>
            <li>Redeploy your frontend</li>
          </ol>
          <div style={{ marginTop: 12 }}>
            <a 
              href="https://railway.app" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                color: '#0369a1', 
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              Deploy Backend on Railway <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataPreview = () => {
    if (!parsedData) return null;

    const tabs = [
      { id: 'classes', label: 'Classes', icon: Users, count: parsedData.classes.length },
      { id: 'subjects', label: 'Subjects', icon: FileText, count: parsedData.subjects.length },
      { id: 'teachers', label: 'Teachers', icon: Users, count: parsedData.teachers.length },
      { id: 'classrooms', label: 'Classrooms', icon: MapPin, count: parsedData.classrooms.length },
      { id: 'timeSlots', label: 'Time Slots', icon: Clock, count: parsedData.timeSlots.periods?.length || 0 },
      { id: 'holidays', label: 'Holidays', icon: Calendar, count: parsedData.holidays.length }
    ];

    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Data Preview</span>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={14} /> {showPreview ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <div key={tab.id} className="stat-card" style={{ padding: 12 }}>
                <div className="stat-icon blue"><Icon size={16} /></div>
                <div>
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>{tab.count}</div>
                  <div className="stat-label" style={{ fontSize: '0.7rem' }}>{tab.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {showPreview && (
          <>
            <div className="tabs">
              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label} ({tab.count})
                </div>
              ))}
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              {activeTab === 'classes' && (
                <table style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: 8 }}>Class</th>
                      <th style={{ padding: 8 }}>Section</th>
                      <th style={{ padding: 8 }}>Strength</th>
                      <th style={{ padding: 8 }}>Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.classes.map((cls, index) => (
                      <tr key={index}>
                        <td style={{ padding: 8 }}>{cls.name}</td>
                        <td style={{ padding: 8 }}>{cls.section}</td>
                        <td style={{ padding: 8 }}>{cls.strength}</td>
                        <td style={{ padding: 8 }}>{cls.subjects.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderValidationResults = () => {
    if (!validationResult && !parsedData) return null;

    const result = validationResult || parsedData;
    const hasErrors = result.errors && result.errors.length > 0;
    const hasWarnings = result.warnings && result.warnings.length > 0;

    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Validation Results</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hasErrors && (
              <span className="badge badge-red">
                {result.errors.length} Errors
              </span>
            )}
            {hasWarnings && (
              <span className="badge badge-yellow">
                {result.warnings.length} Warnings
              </span>
            )}
            {!hasErrors && !hasWarnings && (
              <span className="badge badge-green">
                <CheckCircle size={14} /> Valid
              </span>
            )}
          </div>
        </div>
        
        {hasErrors && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <AlertTriangle size={16} style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: 600, color: '#dc2626' }}>Errors (must be fixed):</span>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: 8, padding: 12 }}>
              {result.errors.map((error, index) => (
                <div key={index} style={{ fontSize: '0.85rem', color: '#7f1d1d', marginBottom: 4 }}>
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (backendAvailable === null) {
    return (
      <div className="page">
        <div className="topbar">
          <h2>Excel Import/Export</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Loader size={24} className="spinner" />
          <span style={{ marginLeft: 12 }}>Checking backend availability...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <h2>Excel Import/Export</h2>
      </div>

      <div style={{ marginTop: 24, maxWidth: 1000 }}>
        {!backendAvailable && renderBackendNotAvailable()}
        
        {backendAvailable && (
          <>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Step 1: Download Template</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#64748b', marginBottom: 12 }}>
                  Download the Excel template with pre-configured sheets for Classes, Subjects, Teachers, 
                  Classrooms, Time Slots, Holidays, and Constraints.
                </p>
                <button className="btn btn-primary" onClick={downloadTemplate}>
                  <Download size={16} /> Download Excel Template
                </button>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <span className="card-title">Step 2: Upload Filled Template</span>
              </div>
              <div>
                <div style={{ marginBottom: 16 }}>
                  <input 
                    type="file" 
                    accept=".xlsx" 
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
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={validateFile}
                    disabled={!file || validating}
                  >
                    {validating ? <Loader size={16} className="spinner" /> : <CheckCircle size={16} />}
                    {validating ? 'Validating...' : 'Validate Only'}
                  </button>
                  
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
            </div>

            {renderValidationResults()}
            {renderDataPreview()}

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
                    disabled={parsedData.errors?.length > 0 || importing}
                  >
                    {importing ? <Loader size={16} className="spinner" /> : <Database size={16} />}
                    {importing ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
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
          </>
        )}
      </div>
    </div>
  );
}