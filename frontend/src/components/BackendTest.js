import React, { useState } from 'react';
import { Server, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import api from '../api/axios';

export default function BackendTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test health endpoint
      const response = await api.get('/health');
      setResult({
        success: true,
        message: 'Backend connected successfully!',
        data: response.data,
        url: api.defaults.baseURL
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Backend connection failed',
        error: error.message,
        url: api.defaults.baseURL,
        details: error.response?.data || 'Network error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="card" style={{ margin: '20px 0' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={20} />
          <span className="card-title">Backend Connection Test</span>
        </div>
      </div>
      
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#64748b', marginBottom: 12 }}>
            Current API URL: <code>{api.defaults.baseURL}</code>
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Backend Connection'}
          </button>
        </div>

        {result && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: result.success ? '#f0f9ff' : '#fef2f2',
            border: `1px solid ${result.success ? '#bae6fd' : '#fecaca'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {result.success ? (
                <CheckCircle size={16} style={{ color: '#16a34a' }} />
              ) : (
                <AlertTriangle size={16} style={{ color: '#dc2626' }} />
              )}
              <span style={{ 
                fontWeight: 600, 
                color: result.success ? '#16a34a' : '#dc2626' 
              }}>
                {result.message}
              </span>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div>URL: {result.url}</div>
              {result.success && result.data && (
                <div>Status: {result.data.status} | Time: {result.data.timestamp}</div>
              )}
              {!result.success && (
                <div style={{ color: '#dc2626', marginTop: 4 }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          </div>
        )}

        {result && !result.success && (
          <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 8 }}>
              How to fix:
            </div>
            <ol style={{ color: '#92400e', fontSize: '0.85rem', paddingLeft: 20 }}>
              <li>Make sure your backend is deployed and running</li>
              <li>Set REACT_APP_API_URL in Vercel environment variables</li>
              <li>Redeploy your frontend after setting the variable</li>
              <li>Check that your backend URL is accessible</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}