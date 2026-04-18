import React, { useState } from 'react';
import { Server, CheckCircle, AlertTriangle, Download, Upload } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SystemDebug() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runSystemTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Basic API connectivity
    try {
      addResult('API Base URL', 'info', `Testing: ${api.defaults.baseURL}`);
      const response = await api.get('/health');
      addResult('Health Check', 'success', 'Backend is accessible', response.data);
    } catch (error) {
      addResult('Health Check', 'error', 'Backend not accessible', error.message);
      setTesting(false);
      return;
    }

    // Test 2: Authentication
    try {
      const token = localStorage.getItem('token');
      if (token) {
        addResult('Authentication', 'info', 'Token found in localStorage');
        const response = await api.get('/teachers');
        addResult('Auth Test', 'success', 'Authentication working');
      } else {
        addResult('Authentication', 'warning', 'No token found - may need login');
      }
    } catch (error) {
      addResult('Auth Test', 'error', 'Authentication failed', error.response?.status);
    }

    // Test 3: Excel route basic test
    try {
      const response = await api.get('/excel/test');
      addResult('Excel Route Test', 'success', 'Excel routes are accessible', response.data);
    } catch (error) {
      addResult('Excel Route Test', 'error', 'Excel routes not working', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });
    }

    // Test 4: Template download (no auth)
    try {
      addResult('Template Download', 'info', 'Attempting template download...');
      const response = await api.get('/excel/template', { 
        responseType: 'blob',
        timeout: 10000
      });
      
      addResult('Template Download', 'success', `Downloaded ${response.data.size} bytes`, {
        contentType: response.headers['content-type'],
        size: response.data.size
      });

      // Try to create download
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'debug-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addResult('File Creation', 'success', 'File download triggered successfully');
    } catch (error) {
      addResult('Template Download', 'error', 'Template download failed', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data || error.message,
        code: error.code
      });
    }

    // Test 5: Upload test
    try {
      const response = await api.post('/excel/upload', { test: 'data' });
      addResult('Upload Test', 'success', 'Upload endpoint working', response.data);
    } catch (error) {
      addResult('Upload Test', 'error', 'Upload endpoint failed', error.response?.data || error.message);
    }

    setTesting(false);
  };

  const testDirectDownload = async () => {
    try {
      // Test direct fetch without axios
      const baseURL = api.defaults.baseURL.replace('/api', '');
      const url = `${baseURL}/api/excel/template`;
      
      addResult('Direct Fetch', 'info', `Testing direct fetch: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        addResult('Direct Fetch', 'success', `Direct fetch successful: ${blob.size} bytes`);
        
        // Download the file
        const url2 = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url2;
        link.download = 'direct-template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url2);
        
        toast.success('Direct download successful!');
      } else {
        addResult('Direct Fetch', 'error', `Direct fetch failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addResult('Direct Fetch', 'error', 'Direct fetch error', error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} style={{ color: '#16a34a' }} />;
      case 'error': return <AlertTriangle size={16} style={{ color: '#dc2626' }} />;
      case 'warning': return <AlertTriangle size={16} style={{ color: '#ea580c' }} />;
      default: return <Server size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#f0f9ff';
      case 'error': return '#fef2f2';
      case 'warning': return '#fef3c7';
      default: return '#f8fafc';
    }
  };

  return (
    <div className="card" style={{ margin: '20px 0' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={20} />
          <span className="card-title">System Debug - Step by Step</span>
        </div>
      </div>
      
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-primary" 
            onClick={runSystemTests}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Run Complete System Test'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={testDirectDownload}
          >
            <Download size={16} /> Test Direct Download
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>Current Configuration:</strong>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
            <div>API Base URL: <code>{api.defaults.baseURL}</code></div>
            <div>Token Present: {localStorage.getItem('token') ? '✅ Yes' : '❌ No'}</div>
            <div>User Agent: <code>{navigator.userAgent.substring(0, 50)}...</code></div>
          </div>
        </div>

        {results.length > 0 && (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <h4 style={{ marginBottom: 12 }}>Test Results:</h4>
            
            {results.map((result, index) => (
              <div key={index} style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 8,
                background: getStatusColor(result.status),
                border: `1px solid ${result.status === 'success' ? '#bae6fd' : result.status === 'error' ? '#fecaca' : '#fed7aa'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {getStatusIcon(result.status)}
                  <strong>{result.test}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>
                  {result.message}
                </div>
                
                {result.details && (
                  <details style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    <summary style={{ cursor: 'pointer' }}>Details</summary>
                    <pre style={{ 
                      background: '#f8fafc', 
                      padding: 8, 
                      borderRadius: 4, 
                      marginTop: 4,
                      overflow: 'auto',
                      maxHeight: 100
                    }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#6b7280',
            background: '#f8fafc',
            borderRadius: 8
          }}>
            Click "Run Complete System Test" to diagnose all issues step by step
          </div>
        )}
      </div>
    </div>
  );
}