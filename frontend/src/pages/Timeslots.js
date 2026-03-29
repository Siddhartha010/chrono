import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_PERIODS = [
  { periodNumber: 1, startTime: '08:00', endTime: '09:00', isBreak: false },
  { periodNumber: 2, startTime: '09:00', endTime: '10:00', isBreak: false },
  { periodNumber: 3, startTime: '10:00', endTime: '11:00', isBreak: false },
  { periodNumber: 4, startTime: '11:00', endTime: '11:15', isBreak: true },
  { periodNumber: 5, startTime: '11:15', endTime: '12:15', isBreak: false },
  { periodNumber: 6, startTime: '12:15', endTime: '13:15', isBreak: false },
  { periodNumber: 7, startTime: '14:00', endTime: '15:00', isBreak: false },
  { periodNumber: 8, startTime: '15:00', endTime: '16:00', isBreak: false },
];

export default function Timeslots() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ days: DEFAULT_DAYS, periods: DEFAULT_PERIODS });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/timeslots').then(r => {
      if (r.data.length > 0) { setConfig(r.data[0]); setForm({ days: r.data[0].days, periods: r.data[0].periods }); }
    });
  }, []);

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (config) await api.put(`/timeslots/${config._id}`, form);
      else { const r = await api.post('/timeslots', form); setConfig(r.data); }
      toast.success('Timeslot configuration saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleDay = day => {
    const days = form.days.includes(day) ? form.days.filter(d => d !== day) : [...form.days, day];
    setForm({ ...form, days });
  };

  const updatePeriod = (i, field, val) => {
    const periods = [...form.periods];
    periods[i] = { ...periods[i], [field]: field === 'periodNumber' ? +val : field === 'isBreak' ? val : val };
    setForm({ ...form, periods });
  };

  const addPeriod = () => setForm({
    ...form,
    periods: [...form.periods, { periodNumber: form.periods.length + 1, startTime: '', endTime: '', isBreak: false }]
  });

  const removePeriod = i => setForm({ ...form, periods: form.periods.filter((_, idx) => idx !== i) });

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="page">
      <div className="topbar"><h2>Time Slots Configuration</h2></div>

      <form onSubmit={save} style={{ marginTop: 24 }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><span className="card-title">Working Days</span></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ALL_DAYS.map(day => (
              <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.days.includes(day)} onChange={() => toggleDay(day)} />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Periods</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addPeriod}><Plus size={14} /> Add Period</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Start Time</th><th>End Time</th><th>Break?</th><th></th></tr>
              </thead>
              <tbody>
                {form.periods.map((p, i) => (
                  <tr key={i} style={{ background: p.isBreak ? '#fef9c3' : undefined }}>
                    <td>
                      <input className="form-input" type="number" value={p.periodNumber} style={{ width: 60 }}
                        onChange={e => updatePeriod(i, 'periodNumber', e.target.value)} />
                    </td>
                    <td>
                      <input className="form-input" type="time" value={p.startTime}
                        onChange={e => updatePeriod(i, 'startTime', e.target.value)} />
                    </td>
                    <td>
                      <input className="form-input" type="time" value={p.endTime}
                        onChange={e => updatePeriod(i, 'endTime', e.target.value)} />
                    </td>
                    <td>
                      <input type="checkbox" checked={p.isBreak} onChange={e => updatePeriod(i, 'isBreak', e.target.checked)} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removePeriod(i)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
