import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConflictNotification({ conflicts, onProceed, onCancel }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="conflict-notification" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: '#fef2f2',
      border: '2px solid #fca5a5',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '400px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <AlertTriangle size={20} style={{ color: '#dc2626' }} />
        <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '1rem' }}>
          Scheduling Conflicts Detected
        </span>
        <button 
          onClick={onCancel}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px'
          }}
        >
          <X size={16} />
        </button>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        {conflicts.map((conflict, i) => (
          <div key={i} style={{
            fontSize: '0.85rem',
            color: '#7f1d1d',
            marginBottom: '6px',
            paddingLeft: '8px',
            borderLeft: '3px solid #fca5a5'
          }}>
            • {conflict.message}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onCancel}
          style={{ fontSize: '0.8rem' }}
        >
          Cancel
        </button>
        <button 
          className="btn btn-danger btn-sm"
          onClick={onProceed}
          style={{ fontSize: '0.8rem' }}
        >
          Proceed Anyway
        </button>
      </div>
    </div>
  );
}