import React, { useState, useCallback } from 'react';
import { Sparkles, Target, CheckCircle, Flame, TrendingUp } from 'lucide-react';
import useRoadmapState from './hooks/useRoadmapState.js';
import { TRACK_LABELS } from './utils/roadmapData.js';
import { generateAIRoadmap } from './utils/roadmapGenerator.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import RoadmapForm from './components/RoadmapForm.jsx';
import EmptyState from './components/EmptyState.jsx';
import RoadmapOutput from './components/RoadmapOutput.jsx';
import '../../styles/AdvancedLearningPathPage.css';

export default function AdvancedLearningPathPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const state = useRoadmapState();

  const {
    activeTrack, setActiveTrack,
    weeklyGoal, weekDone,
    streakDays,
    aiSelectedTracks, setAiSelectedTracks,
    aiLastPlanWeeks,
    aiDaysPerWeek, setAiDaysPerWeek,
    aiCompanyMode, setAiCompanyMode,
    aiDailyBlockMin, setAiDailyBlockMin,
    aiTaskDone, setAiTaskDone,
    toggleAIDayTask,
    computeProgress, computeConfidence,
    setAIRoadmapResult,
  } = state;

  const [localSelectedTracks, setLocalSelectedTracks] = useState(aiSelectedTracks);
  const [localDaysPerWeek, setLocalDaysPerWeek] = useState(aiDaysPerWeek);
  const [localCompanyMode, setLocalCompanyMode] = useState(aiCompanyMode);
  const [localDailyBlockMin, setLocalDailyBlockMin] = useState(aiDailyBlockMin);
  const [localWeeks, setLocalWeeks] = useState(aiLastPlanWeeks);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(Array.isArray(aiLastPlanWeeks) && aiLastPlanWeeks.length > 0);

  const handleGenerate = useCallback((opts) => {
    setIsGenerating(true);
    setAiSelectedTracks(opts.selectedTracks);
    setAiDaysPerWeek(opts.daysPerWeek);
    setAiCompanyMode(opts.companyMode);
    setAiDailyBlockMin(opts.dailyBlockMin);

    setTimeout(() => {
      try {
        const result = generateAIRoadmap({
          selectedTracks: opts.selectedTracks,
          months: opts.months,
          baseDate: opts.baseDate,
          deadlineInput: opts.deadlineInput,
          intensity: opts.intensity,
          bufferPct: opts.bufferPct,
          daysPerWeek: opts.daysPerWeek,
          companyMode: opts.companyMode,
          dailyBlockMin: opts.dailyBlockMin,
        });

        if (!result) {
          console.error('Roadmap generation returned null (deadline in past?)');
          setIsGenerating(false);
          return;
        }

        const { weeks, revisionWeeks, totalWeeks } = result;

        setLocalWeeks(weeks);
        setLocalSelectedTracks(opts.selectedTracks);
        setLocalDaysPerWeek(opts.daysPerWeek);
        setLocalCompanyMode(opts.companyMode);
        setLocalDailyBlockMin(opts.dailyBlockMin);
        setAiTaskDone({});
        setHasGenerated(true);
        setAIRoadmapResult(`AI Generated Prep Plan (${opts.months} months)`, weeks);
      } catch (e) {
        console.error('Roadmap generation failed:', e);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  }, [setAiSelectedTracks, setAiDaysPerWeek, setAiCompanyMode, setAiDailyBlockMin, setAIRoadmapResult]);

  const handleExport = useCallback((fmt) => {
    if (!localWeeks || localWeeks.length === 0) return;
    let body, name, mime;

    if (fmt === 'ics') {
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Preploop//Advanced Learning Path//EN'];
      localWeeks.forEach(w => {
        w.dayPlan.forEach(d => {
          lines.push('BEGIN:VEVENT');
          lines.push(`DTSTART;VALUE=DATE:${d.dateISO.replace(/-/g, '')}`);
          const end = new Date(new Date(d.dateISO + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10).replace(/-/g, '');
          lines.push(`DTEND;VALUE=DATE:${end}`);
          lines.push(`SUMMARY:Study: ${d.task}`);
          lines.push('END:VEVENT');
        });
      });
      lines.push('END:VCALENDAR');
      body = lines.join('\r\n');
      name = 'roadmap.ics';
      mime = 'text/calendar';
    } else if (fmt === 'csv') {
      const rows = [['Subject', 'Start Date', 'End Date', 'Description']];
      localWeeks.forEach(w => {
        w.dayPlan.forEach(d => {
          rows.push([`Study: ${d.task} (${d.topic})`, d.dateISO, d.dateISO, `Week ${w.week} - ${w.chunk.map(c => c.title).join(', ')}`]);
        });
      });
      body = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      name = 'roadmap.csv';
      mime = 'text/csv';
    } else {
      const data = localWeeks.map(w => ({
        week: w.week, track: w.track, confidence: w.confidence, startISO: w.startISO, endISO: w.endISO,
        chunk: w.chunk.map(c => ({ title: c.title, diff: c.diff })),
        dayPlan: w.dayPlan.map(d => ({ dateISO: d.dateISO, task: d.task, topic: d.topic })),
      }));
      body = JSON.stringify(data, null, 2);
      name = 'roadmap.json';
      mime = 'application/json';
    }

    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }, [localWeeks]);

  const progress = computeProgress();
  const confidences = computeConfidence();

  return (
    <div className={`alp-page ${isLight ? 'alp-light' : ''}`}>
      <div className="alp-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
        <div className="alp-hero" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="alp-hero-badge">
            <Sparkles size={14} />
            <span style={{ marginLeft: 6 }}>Learning Path</span>
          </div>
          <h1 className="alp-hero-title">
            Advanced <span className="alp-gradient">Learning Path</span>
          </h1>
          <p className="alp-hero-sub">
            AI-powered roadmap for DSA, Aptitude, SQL & System Design
          </p>

          <div className="alp-dashboard" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14,
            maxWidth: 800, margin: '32px auto 0',
          }}>
            <div className="alp-stat-card">
              <div className="alp-stat-icon" style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>
                <Target size={18} />
              </div>
              <div className="alp-stat-value">{progress.globalDone}/{progress.globalTotal}</div>
              <div className="alp-stat-label">Topics Covered</div>
            </div>
            <div className="alp-stat-card">
              <div className="alp-stat-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                <TrendingUp size={18} />
              </div>
              <div className="alp-stat-value">{progress.overallPct}%</div>
              <div className="alp-stat-label">Overall Progress</div>
            </div>
            <div className="alp-stat-card">
              <div className="alp-stat-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                <CheckCircle size={18} />
              </div>
              <div className="alp-stat-value">{Math.round(weekDone / Math.max(weeklyGoal, 1) * 100)}%</div>
              <div className="alp-stat-label">Weekly Goal</div>
            </div>
            <div className="alp-stat-card">
              <div className="alp-stat-icon" style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}>
                <Flame size={18} />
              </div>
              <div className="alp-stat-value">{streakDays}</div>
              <div className="alp-stat-label">Day Streak</div>
            </div>
          </div>

          <div className="alp-confidence-row" style={{
            display: 'flex', gap: 16, maxWidth: 800, margin: '24px auto 0',
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {confidences.map(c => (
              <div key={c.trackKey} className="alp-confidence-bar" style={{ flex: '1 1 160px', minWidth: 140 }}>
                <div className="alp-confidence-label">{c.label}</div>
                <div className="alp-confidence-track">
                  <div className="alp-confidence-fill" style={{ width: `${c.confidence}%` }} />
                </div>
                <div className="alp-confidence-value">{c.confidence}%</div>
              </div>
            ))}
          </div>
        </div>

        <nav className="alp-tabs" style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {['dsa', 'apt', 'sql', 'sys'].map(k => (
            <button
              key={k}
              className={`alp-tab ${activeTrack === k ? 'active' : ''}`}
              onClick={() => setActiveTrack(k)}
              style={{
                padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                background: activeTrack === k ? 'rgba(129,140,248,0.12)' : 'rgba(255,255,255,0.02)',
                color: activeTrack === k ? '#818cf8' : '#a1a1aa', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
              }}
            >
              {TRACK_LABELS[k]} {progress.trackPcts[k] !== undefined && `(${progress.trackPcts[k]}%)`}
            </button>
          ))}
        </nav>

        <RoadmapForm
          selectedTracks={localSelectedTracks}
          setSelectedTracks={setLocalSelectedTracks}
          aiDaysPerWeek={localDaysPerWeek}
          setAiDaysPerWeek={setLocalDaysPerWeek}
          aiCompanyMode={localCompanyMode}
          setAiCompanyMode={setLocalCompanyMode}
          aiDailyBlockMin={localDailyBlockMin}
          setAiDailyBlockMin={setLocalDailyBlockMin}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {!hasGenerated && localWeeks.length === 0 && <EmptyState />}

        {localWeeks.length > 0 && (
          <RoadmapOutput
            weeks={localWeeks}
            aiTaskDone={aiTaskDone}
            onToggleTask={toggleAIDayTask}
            onExport={handleExport}
            trackLabels={TRACK_LABELS}
          />
        )}
      </div>
    </div>
  );
}
