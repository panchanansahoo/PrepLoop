import React, { useState } from 'react';
import { Settings, ChevronDown, Layers, Target, Brain, Database, BarChart3 } from 'lucide-react';
import { COMPANY_PRESETS } from '../utils/roadmapData.js';
import { todayISO } from '../utils/roadmapDateUtils.js';

const TRACK_OPTIONS = [
  { id: 'dsa', icon: Brain, label: 'DSA', desc: 'Core coding interviews', color: 'var(--dsa)' },
  { id: 'apt', icon: Zap, label: 'Aptitude', desc: 'Quantitative & logical', color: 'var(--apt)' },
  { id: 'sql', icon: Database, label: 'SQL', desc: 'Database queries', color: 'var(--sql)' },
  { id: 'sys', icon: Layers, label: 'System Design', desc: 'Architecture & scaling', color: 'var(--sys)' },
];

function Zap(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export default function RoadmapForm({
  selectedTracks, setSelectedTracks,
  aiDaysPerWeek, setAiDaysPerWeek,
  aiCompanyMode, setAiCompanyMode,
  aiDailyBlockMin, setAiDailyBlockMin,
  onGenerate, isGenerating,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [months, setMonths] = useState(4);
  const [startDate, setStartDate] = useState(todayISO());
  const [intensity, setIntensity] = useState('standard');
  const [bufferPct, setBufferPct] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [blockMin, setBlockMin] = useState(aiDailyBlockMin || 90);

  const toggleTrack = (id) => {
    setSelectedTracks(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(t => t !== id);
        return next.length ? next : ['dsa'];
      }
      return [...prev, id];
    });
  };

  const handleGenerate = () => {
    onGenerate({
      months: Math.max(1, Math.min(24, months)),
      baseDate: startDate ? new Date(startDate + 'T00:00:00') : new Date(),
      deadlineInput: deadline,
      intensity,
      bufferPct: bufferPct / 100,
      daysPerWeek: aiDaysPerWeek,
      companyMode: aiCompanyMode,
      dailyBlockMin: blockMin,
      selectedTracks: selectedTracks.length ? selectedTracks : ['dsa', 'apt', 'sql', 'sys'],
    });
  };

  return (
    <div className="alp-config" style={{ marginBottom: 28 }}>
      <div className="alp-config-inner">
        <div
          className="alp-config-header"
          onClick={() => setShowAdvanced(v => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAdvanced(v => !v); } }}
          style={{ cursor: 'pointer' }}
        >
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 18, fontWeight: 700 }}>
            <Settings size={20} />
            Configuration
          </h2>
          <div className={`alp-config-toggle ${showAdvanced ? 'open' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="alp-form-grid" style={{ marginTop: 20 }}>
          <div className="alp-field">
            <label className="alp-field-label">Preparation Duration</label>
            <input type="number" min="1" max="24" value={months} onChange={e => setMonths(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }} />
          </div>
          {showAdvanced && (
            <div className="alp-field">
              <label className="alp-field-label">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }} />
            </div>
          )}
          <div className="alp-field">
            <label className="alp-field-label">Weekly Intensity</label>
            <select value={intensity} onChange={e => { setIntensity(e.target.value); if (!showAdvanced) setMonths(e.target.value === 'light' ? 6 : e.target.value === 'intense' ? 3 : 4); }} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }}>
              <option value="light">Light - 2 topics/week</option>
              <option value="standard">Standard - 3 topics/week</option>
              <option value="intense">Intense - 4 topics/week</option>
            </select>
          </div>
          <div className="alp-field">
            <label className="alp-field-label">Study Days / Week</label>
            <select value={aiDaysPerWeek} onChange={e => setAiDaysPerWeek(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }}>
              {[4, 5, 6, 7].map(d => (
                <option key={d} value={d}>{d} days - {['', '', '', 'Light', 'Standard', 'Dedicated', 'Intensive'][d]}</option>
              ))}
            </select>
          </div>
          <div className="alp-field">
            <label className="alp-field-label">Company Focus</label>
            <select value={aiCompanyMode} onChange={e => setAiCompanyMode(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }}>
              {COMPANY_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {showAdvanced && (
            <div className="alp-field">
              <label className="alp-field-label">Revision Buffer</label>
              <select value={bufferPct} onChange={e => setBufferPct(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }}>
                <option value={10}>10% - Minimal</option>
                <option value={15}>15% - Recommended</option>
                <option value={20}>20% - Conservative</option>
                <option value={25}>25% - Maximum</option>
              </select>
            </div>
          )}
          {showAdvanced && (
            <div className="alp-field">
              <label className="alp-field-label">Target Interview Date</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }} />
            </div>
          )}
          {showAdvanced && (
            <div className="alp-field">
              <label className="alp-field-label">Daily Study Block</label>
              <select value={blockMin} onChange={e => setBlockMin(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'inherit', fontSize: 14 }}>
                {[60, 90, 120, 150].map(b => (
                  <option key={b} value={b}>{b} min - {b <= 60 ? 'Quick' : b === 90 ? 'Optimal' : b === 120 ? 'Deep work' : 'Extended'}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="alp-tracks-section" style={{ marginTop: 24 }}>
          <div className="alp-tracks-label" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 12 }}>
            <Target size={14} style={{ marginRight: 6, display: 'inline' }} />
            Select Learning Tracks
          </div>
          <div className="alp-tracks-grid">
            {TRACK_OPTIONS.map(opt => {
              const isActive = selectedTracks.includes(opt.id);
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  className={`alp-track-card ${isActive ? 'active' : ''}`}
                  style={{
                    '--track-color': opt.color,
                    '--track-color-alpha': `${opt.color}16`,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleTrack(opt.id)}
                  role="checkbox"
                  aria-checked={isActive}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTrack(opt.id); } }}
                >
                  <div className="alp-track-icon">
                    <Icon size={22} />
                  </div>
                  <div className="alp-track-name">{opt.label}</div>
                  <div className="alp-track-count">{opt.desc}</div>
                  <div className="alp-track-check">
                    {isActive && <CheckIcon />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="alp-action-bar" style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            className="alp-btn alp-btn-primary"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '14px 36px', fontSize: 16, fontWeight: 700, borderRadius: 14,
              border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <LoaderIcon /> Generating...
              </>
            ) : (
              <>
                <BarChart3 size={20} />
                <span style={{ marginLeft: 10 }}>Generate My Roadmap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'alp-spin 1s linear infinite', marginRight: 10, verticalAlign: 'middle' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
