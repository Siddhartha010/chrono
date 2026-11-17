import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Settings } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Generate() {
  const [params, setParams] = useState({
    populationSize: 50,
    maxGenerations: 200,
    mutationRate: 0.1,
    crossoverRate: 0.8
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const generate = async e => {
    e.preventDefault();
    setGenerating(true);
    setProgress(0);

    // Simulate progress while GA runs
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 90));
    }, 400);

    try {
      const { data } = await api.post('/timetable/generate', { constraints: params });
      clearInterval(interval);
      setProgress(100);
      toast.success(`Timetable generated! Fitness: ${data.fitnessScore}%`);
      setTimeout(() => navigate(`/timetable/${data._id}`), 600);
    } catch (err) {
      clearInterval(interval);
      toast.error(err.response?.data?.message || 'Generation failed');
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="page">
      <div className="topbar"><h2>Generate Timetable</h2></div>

      <div style={{ marginTop: 24, maxWidth: 560 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Settings size={16} style={{ display: 'inline', marginRight: 6 }} />GA Parameters</span>
          </div>

          {generating ? (
            <div className="generating-overlay">
              <div className="spinner" />
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Running Genetic Algorithm...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p>Evolving timetable population across generations</p>
            </div>
          ) : (
            <form onSubmit={generate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Population Size</label>
                  <input className="form-input" type="number" min={10} max={200} value={params.populationSize}
                    onChange={e => setParams({ ...params, populationSize: +e.target.value })} />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Number of timetables per generation</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Generations</label>
                  <input className="form-input" type="number" min={10} max={1000} value={params.maxGenerations}
                    onChange={e => setParams({ ...params, maxGenerations: +e.target.value })} />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Higher = better quality, slower</small>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mutation Rate ({(params.mutationRate * 100).toFixed(0)}%)</label>
                  <input type="range" min={0.01} max={0.5} step={0.01} value={params.mutationRate}
                    onChange={e => setParams({ ...params, mutationRate: +e.target.value })}
                    style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Crossover Rate ({(params.crossoverRate * 100).toFixed(0)}%)</label>
                  <input type="range" min={0.1} max={1} step={0.05} value={params.crossoverRate}
                    onChange={e => setParams({ ...params, crossoverRate: +e.target.value })}
                    style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '0.8rem', color: '#64748b' }}>
                <strong style={{ color: '#475569' }}>How it works:</strong>
                <ul style={{ marginTop: 6, paddingLeft: 16, lineHeight: 1.8 }}>
                  <li>Generates {params.populationSize} random timetables</li>
                  <li>Evaluates fitness: no clashes, balanced workload</li>
                  <li>Evolves over {params.maxGenerations} generations via selection, crossover & mutation</li>
                  <li>Returns the best conflict-free timetable</li>
                </ul>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                <Wand2 size={18} /> Generate Timetable
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
