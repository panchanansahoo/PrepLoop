import React, { useState, useCallback, useMemo } from 'react';
import { TRACKS, TRACK_LABELS, TRACK_COLORS, TIMELINE_DATA, DIFF_COLORS } from '../data/advancedLearningPathData';
import { useAdvancedLearningPath, generateRoadmap, exportICS, exportJSON, exportGoogleCSV } from '../hooks/useAdvancedLearningPath';
import '../styles/AdvancedLearningPathPage.css';

const TABS = [
  { key: 'overview', label: 'Overview', color: 'var(--color-text-primary)' },
  { key: 'dsa', label: 'DSA', color: 'var(--dsa)' },
  { key: 'apt', label: 'Aptitude', color: 'var(--apt)' },
  { key: 'sql', label: 'SQL', color: 'var(--sql)' },
  { key: 'sys', label: 'System Design', color: 'var(--sys)' },
  { key: 'timeline', label: 'Roadmap', color: 'var(--color-text-muted)' },
  { key: 'planner', label: 'AI Planner', color: '#ef4444' },
];

const SUB_TABS = {
  dsa: [{ key: 'fundamentals', label: 'Fundamentals' }, { key: 'advanced', label: 'Advanced' }, { key: 'competitive', label: 'Competitive' }],
  apt: [{ key: 'quant', label: 'Quantitative' }, { key: 'logical', label: 'Logical' }, { key: 'verbal', label: 'Verbal' }],
  sql: [{ key: 'core', label: 'Core SQL' }, { key: 'advanced', label: 'Advanced' }, { key: 'performance', label: 'Performance' }],
  sys: [{ key: 'concepts', label: 'Concepts' }, { key: 'patterns', label: 'Patterns' }, { key: 'case', label: 'Case Studies' }],
};

export default function AdvancedLearningPathPage() {
  const { state, save, toggleCheck, adjustGoal, resetWeek, toggleAITrack, toggleAITaskDone, progress, confidence, globalTotal, globalDone, globalPct } = useAdvancedLearningPath();
  const [activeTab, setActiveTab] = useState('overview');
  const [subTabs, setSubTabs] = useState({ dsa: 'fundamentals', apt: 'quant', sql: 'core', sys: 'concepts' });
  const [expanded, setExpanded] = useState({});

  // AI Planner form state
  const [aiForm, setAiForm] = useState({
    months: 4, startDate: new Date().toISOString().slice(0, 10), intensity: 'standard',
    buffer: 10, days: state.aiDaysPerWeek || 5, deadline: '', company: state.aiCompanyMode || 'balanced', block: state.aiDailyBlockMin || 90,
  });

  const switchTab = useCallback((key) => {
    setActiveTab(key);
    if (key !== 'overview' && key !== 'timeline' && key !== 'planner') {
      save({ activeTrack: key });
    }
  }, [save]);

  const toggleExpand = useCallback((id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleGenerate = useCallback(() => {
    const result = generateRoadmap({
      months: aiForm.months, startDate: aiForm.startDate, intensity: aiForm.intensity,
      bufferPct: aiForm.buffer, daysPerWeek: aiForm.days, deadline: aiForm.deadline,
      companyMode: aiForm.company, dailyBlockMin: aiForm.block, selectedTracks: state.aiSelectedTracks,
    });
    save({ aiLastPlanWeeks: result.weeks, aiLastPlanText: result.planText, aiDaysPerWeek: aiForm.days, aiCompanyMode: aiForm.company, aiDailyBlockMin: aiForm.block });
  }, [aiForm, state.aiSelectedTracks, save]);

  const sendPrompt = useCallback((msg) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).then(() => alert('Prompt copied! Paste it into your AI chat.')).catch(() => alert('Prompt: ' + msg));
    } else { alert('Prompt: ' + msg); }
  }, []);

  // Render topic row
  const renderTopicRow = (topic, trackColor) => {
    const dc = DIFF_COLORS[topic.diff] || DIFF_COLORS.Medium;
    const total = topic.subtopics.length + topic.problems.length;
    const done = topic.subtopics.filter((_, i) => state.checked[topic.id + '-s' + i]).length + topic.problems.filter((_, i) => state.checked[topic.id + '-p' + i]).length;
    const isExpanded = expanded[topic.id];

    return (
      <div key={topic.id} className={`alp-topic-row ${isExpanded ? 'expanded' : ''}`} style={{ '--track-color': trackColor }} onClick={() => toggleExpand(topic.id)}>
        <div className="alp-tr-icon">{topic.icon}</div>
        <div className="alp-tr-body">
          <div className="alp-tr-title">{topic.title}</div>
          <div className="alp-tr-meta">{topic.subtopics.length} subtopics · {topic.problems.length} problems · {done}/{total} done</div>
          {isExpanded && (
            <div className="alp-topic-detail" onClick={e => e.stopPropagation()}>
              <div className="alp-detail-cols">
                <div>
                  <div className="alp-dc-label">Subtopics</div>
                  {topic.subtopics.map((s, i) => {
                    const k = topic.id + '-s' + i;
                    return (
                      <div key={k} className="alp-dc-item">
                        <div className={`alp-dc-check ${state.checked[k] ? 'checked' : ''}`} onClick={() => toggleCheck(k)}>{state.checked[k] ? '✓' : ''}</div>
                        <span>{s}</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="alp-dc-label">Practice Problems</div>
                  {topic.problems.map((p, i) => {
                    const k = topic.id + '-p' + i;
                    return (
                      <div key={k} className="alp-dc-item">
                        <div className={`alp-dc-check ${state.checked[k] ? 'checked' : ''}`} onClick={() => toggleCheck(k)}>{state.checked[k] ? '✓' : ''}</div>
                        <span>{p}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="alp-action-row">
                <button className="alp-action-btn primary" onClick={() => sendPrompt(`Teach me ${topic.title} with examples and common interview patterns`)}>Study →</button>
                <button className="alp-action-btn" onClick={() => sendPrompt(`Give me 3 hard ${topic.title} problems with hints`)}>Problems</button>
                <button className="alp-action-btn" onClick={() => sendPrompt(`Quiz me on ${topic.title}: ask 5 questions`)}>Quiz me</button>
              </div>
            </div>
          )}
        </div>
        <div className="alp-tr-right">
          <div className="alp-diff-badge" style={{ background: dc.bg, color: dc.color }}>{topic.diff}</div>
          <div className="alp-prog-dots">
            {Array.from({ length: Math.min(total, 6) }, (_, i) => (
              <div key={i} className={`alp-prog-dot ${i < done ? 'done' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Track panel
  const renderTrackPanel = (trackKey) => {
    const track = TRACKS[trackKey];
    const subs = SUB_TABS[trackKey];
    const activeSub = subTabs[trackKey];
    const topics = track.subs[activeSub] || [];
    const color = TRACK_COLORS[trackKey].main;

    return (
      <div>
        <div className="alp-pill-tabs">
          {subs.map(s => (
            <button key={s.key} className={`alp-pill-tab ${activeSub === s.key ? 'active' : ''}`}
              style={{ '--pill-color': color }}
              onClick={() => setSubTabs(prev => ({ ...prev, [trackKey]: s.key }))}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="alp-topic-grid">
          {topics.map(t => renderTopicRow(t, color))}
        </div>
      </div>
    );
  };

  const goalPct = Math.min(100, Math.round((state.weekDone / Math.max(1, state.weeklyGoal)) * 100));

  return (
    <div className="alp-page">
      {/* Hero */}
      <div className="alp-hero">
        <div className="alp-hero-badge">✦ AI-Powered Learning Path</div>
        <h1>Master <span className="alp-gradient">Interview Prep</span></h1>
        <p className="alp-hero-sub">Build depth across DSA, Aptitude, SQL, and System Design with your personal AI roadmap planner.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Topics', value: globalTotal, icon: '📚' },
            { label: 'Tracks', value: '4', icon: '🛤️' },
            { label: 'AI-Powered', value: '✓', icon: '🤖' },
            { label: 'Exportable', value: '✓', icon: '📅' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <span>{s.icon}</span> {s.value} <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="alp-tabs">
        {TABS.map(tab => (
          <button key={tab.key} className={`alp-tab ${activeTab === tab.key ? 'active' : ''}`}
            style={{ '--tab-color': tab.color }} onClick={() => switchTab(tab.key)}>
            <span className="alp-tab-dot" style={{ background: tab.color }} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Intro Grid (always visible) */}
      <div className="alp-intro-grid">
        <div className="alp-intro-main">
          <div className="alp-intro-kicker">Advanced Learning Command Center</div>
          <div className="alp-intro-title">Build interview depth across DSA, Aptitude, SQL, and System Design.</div>
          <div className="alp-intro-sub-text">Expand any topic, mark completed concepts, and launch study prompts from each card.</div>
        </div>
        <div className="alp-intro-side">
          <div className="alp-stats-grid">
            <div className="alp-stat-chip"><div className="alp-stat-label">Total Items</div><div className="alp-stat-value">{globalTotal}</div></div>
            <div className="alp-stat-chip"><div className="alp-stat-label">Completed</div><div className="alp-stat-value">{globalDone}</div></div>
            <div className="alp-stat-chip"><div className="alp-stat-label">Overall</div><div className="alp-stat-value">{globalPct}%</div></div>
            <div className="alp-stat-chip"><div className="alp-stat-label">Focus</div><div className="alp-stat-value">{TRACK_LABELS[state.activeTrack] || 'DSA'}</div></div>
          </div>
          <div className="alp-goal-card">
            <div className="alp-goal-head">
              <div className="alp-goal-title">Weekly Goal</div>
              <div className="alp-streak-pill">{state.streakDays}d streak</div>
            </div>
            <div className="alp-goal-meta">
              <span>{state.weekDone} / {state.weeklyGoal} done</span>
              <span>from {state.weekStartISO}</span>
            </div>
            <div className="alp-goal-bar"><div className="alp-goal-fill" style={{ width: goalPct + '%' }} /></div>
            <div className="alp-goal-actions">
              <button className="alp-goal-btn" onClick={() => adjustGoal(-1)}>− goal</button>
              <button className="alp-goal-btn" onClick={() => adjustGoal(1)}>+ goal</button>
              <button className="alp-goal-btn" onClick={resetWeek}>reset week</button>
            </div>
            <div className="alp-confidence-bars">
              {['dsa','apt','sql','sys'].map(tk => (
                <div key={tk} className="alp-conf-row">
                  <div className="alp-conf-label">{TRACK_LABELS[tk]}</div>
                  <div className="alp-conf-track"><div className="alp-conf-fill" style={{ width: confidence[tk] + '%', background: TRACK_COLORS[tk].main }} /></div>
                  <div className="alp-conf-val">{confidence[tk]}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Overall progress summary */}
          <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 6 }}>Overall Mastery Progress</div>
              <div style={{ height: 8, borderRadius: 99, background: 'var(--color-bg-tertiary)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6, #f43f5e)', width: globalPct + '%', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
            <div style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1 }}>{globalPct}%</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{globalDone}/{globalTotal}</div>
            </div>
          </div>

          <div className="alp-hero-cards">
            {['dsa','apt','sql','sys'].map((tk, i) => {
              const r = 22, c = 2 * Math.PI * r, offset = c - (progress[tk].pct / 100) * c;
              const DESCS = { dsa: 'Arrays → Graphs → DP → Advanced Trees', apt: 'Quant · Logical · Verbal Reasoning', sql: 'Queries → Joins → Indexing → Optimization', sys: 'Scalability · CAP · Distributed Systems' };
              return (
                <div key={tk} className={`alp-hero-card alp-stagger-${i + 1}`} style={{ background: TRACK_COLORS[tk].bg, borderColor: TRACK_COLORS[tk].main, color: TRACK_COLORS[tk].dark, '--card-glow': TRACK_COLORS[tk].main }} onClick={() => switchTab(tk)}>
                  <div className="alp-hc-top">
                    <div>
                      <div className="alp-hc-label">Track {i + 1}</div>
                      <div className="alp-hc-title">{TRACK_LABELS[tk]}</div>
                    </div>
                    <div className="alp-ring-wrap">
                      <svg className="alp-ring-svg" width="52" height="52" viewBox="0 0 52 52" style={{ '--ring-color': TRACK_COLORS[tk].main }}>
                        <circle className="alp-ring-bg" cx="26" cy="26" r={r} />
                        <circle className="alp-ring-fill" cx="26" cy="26" r={r} stroke={TRACK_COLORS[tk].main} strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 26 26)" />
                        <text className="alp-ring-text" x="26" y="26">{progress[tk].pct}%</text>
                      </svg>
                    </div>
                  </div>
                  <div className="alp-hc-sub">{DESCS[tk]}</div>
                  <div className="alp-hc-bar"><div className="alp-hc-fill" style={{ width: progress[tk].pct + '%', background: TRACK_COLORS[tk].main }} /></div>
                  <div className="alp-hc-pct">{progress[tk].done}/{progress[tk].total} items · {Object.keys(TRACKS[tk].subs).length} sections</div>
                </div>
              );
            })}
          </div>

          <div className="alp-sec-hdr">
            <div className="alp-sec-dot" style={{ background: 'var(--color-text-muted)' }} />
            <h2>Practice Modes</h2>
            <span className="alp-sec-badge" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>Quick Launch</span>
          </div>
          <div className="alp-practice-grid">
            <div className="alp-prac-card" onClick={() => sendPrompt('Give me a hard DSA problem to solve — arrays or graphs')}>
              <div className="alp-prac-icon">🧩</div><div className="alp-prac-title">Daily Challenge</div><div className="alp-prac-sub">Random advanced problem from any track</div>
            </div>
            <div className="alp-prac-card" onClick={() => sendPrompt('Quiz me on SQL: write 3 medium-hard SQL questions with answers')}>
              <div className="alp-prac-icon">⚡</div><div className="alp-prac-title">Flash Quiz</div><div className="alp-prac-sub">Rapid-fire questions for any topic</div>
            </div>
            <div className="alp-prac-card" onClick={() => sendPrompt('Give me a mock system design interview for a URL shortener')}>
              <div className="alp-prac-icon">🎯</div><div className="alp-prac-title">Mock Interview</div><div className="alp-prac-sub">Full simulated interview session</div>
            </div>
            <div className="alp-prac-card" onClick={() => sendPrompt('Give me a timed aptitude test: 5 questions — 30 sec each')}>
              <div className="alp-prac-icon">⏱</div><div className="alp-prac-title">Timed Test</div><div className="alp-prac-sub">Speed drills for aptitude mastery</div>
            </div>
          </div>
        </div>
      )}

      {/* Track Tabs */}
      {['dsa','apt','sql','sys'].includes(activeTab) && renderTrackPanel(activeTab)}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div>
          <div className="alp-sec-hdr">
            <div className="alp-sec-dot" style={{ background: 'var(--color-text-muted)' }} />
            <h2>16-Week Mastery Roadmap</h2>
            <span className="alp-sec-badge" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}>Advanced Path</span>
          </div>
          <div className="alp-timeline">
            {TIMELINE_DATA.map((item, i) => {
              const tk = item.track === 'all' ? 'dsa' : item.track;
              return (
                <div key={i} className="alp-tl-item">
                  <div className="alp-tl-line-col">
                    <div className="alp-tl-circle" style={{ borderColor: TRACK_COLORS[tk].main, color: TRACK_COLORS[tk].main, background: TRACK_COLORS[tk].bg }}>{i + 1}</div>
                    {i < TIMELINE_DATA.length - 1 && <div className="alp-tl-vline" />}
                  </div>
                  <div className="alp-tl-content">
                    <div className="alp-tl-week">{item.week}</div>
                    <div className="alp-tl-title">{item.title}</div>
                    <div className="alp-tl-tags">
                      {item.tags.map(t => <span key={t} className="alp-tl-tag" style={{ background: TRACK_COLORS[tk].bg, color: TRACK_COLORS[tk].dark }}>{t}</span>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Planner Tab */}
      {activeTab === 'planner' && (
        <div>
          <div className="alp-sec-hdr">
            <div className="alp-sec-dot" style={{ background: '#ef4444' }} />
            <h2>AI Roadmap Generator</h2>
            <span className="alp-sec-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Date-aware</span>
          </div>
          <div className="alp-ai-plan">
            <div className="alp-intro-sub-text" style={{ marginBottom: 12 }}>Enter your prep duration in months. The planner auto-generates a weekly track roadmap with exact date ranges.</div>
            <div className="alp-ai-grid">
              <div className="alp-ai-field">
                <label>Months</label>
                <input className="alp-ai-input" type="number" min="1" max="24" value={aiForm.months} onChange={e => setAiForm(f => ({ ...f, months: +e.target.value }))} />
              </div>
              <div className="alp-ai-field">
                <label>Start Date</label>
                <input className="alp-ai-input" type="date" value={aiForm.startDate} onChange={e => setAiForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="alp-ai-field">
                <label>Intensity</label>
                <select className="alp-ai-select" value={aiForm.intensity} onChange={e => setAiForm(f => ({ ...f, intensity: e.target.value }))}>
                  <option value="light">Light (2/week)</option>
                  <option value="standard">Standard (3/week)</option>
                  <option value="intense">Intense (4/week)</option>
                </select>
              </div>
              <div className="alp-ai-field">
                <label>Buffer</label>
                <select className="alp-ai-select" value={aiForm.buffer} onChange={e => setAiForm(f => ({ ...f, buffer: +e.target.value }))}>
                  <option value={10}>10%</option><option value={15}>15%</option><option value={20}>20%</option><option value={25}>25%</option>
                </select>
              </div>
              <div className="alp-ai-field">
                <label>Days/Week</label>
                <select className="alp-ai-select" value={aiForm.days} onChange={e => setAiForm(f => ({ ...f, days: +e.target.value }))}>
                  <option value={4}>4</option><option value={5}>5</option><option value={6}>6</option><option value={7}>7</option>
                </select>
              </div>
              <div className="alp-ai-field">
                <label>Interview Date</label>
                <input className="alp-ai-input" type="date" value={aiForm.deadline} onChange={e => setAiForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="alp-ai-field">
                <label>Company Mode</label>
                <select className="alp-ai-select" value={aiForm.company} onChange={e => setAiForm(f => ({ ...f, company: e.target.value }))}>
                  <option value="balanced">Balanced</option>
                  <option value="faang">FAANG Core</option>
                  <option value="data">Data/Analytics</option>
                  <option value="product">Product Startup</option>
                </select>
              </div>
              <div className="alp-ai-field">
                <label>Daily Block</label>
                <select className="alp-ai-select" value={aiForm.block} onChange={e => setAiForm(f => ({ ...f, block: +e.target.value }))}>
                  <option value={60}>60 min</option><option value={90}>90 min</option><option value={120}>120 min</option><option value={150}>150 min</option>
                </select>
              </div>
            </div>

            <div className="alp-ai-track-picks">
              {['dsa','apt','sql','sys'].map(tk => (
                <button key={tk} className={`alp-track-chip ${state.aiSelectedTracks.includes(tk) ? 'active' : ''}`} onClick={() => toggleAITrack(tk)}>
                  {TRACK_LABELS[tk]}
                </button>
              ))}
            </div>

            <div className="alp-ai-actions">
              <button className="alp-ai-btn primary" onClick={handleGenerate}>Generate AI Roadmap</button>
              <button className="alp-ai-btn" onClick={() => { if (!state.aiLastPlanText) handleGenerate(); sendPrompt(`Refine this roadmap:\n\n${state.aiLastPlanText}`); }}>Send to AI Mentor</button>
              <button className="alp-ai-btn" onClick={() => state.aiLastPlanWeeks?.length ? exportICS(state.aiLastPlanWeeks) : alert('Generate first')}>Export .ics</button>
              <button className="alp-ai-btn" onClick={() => state.aiLastPlanWeeks?.length ? exportGoogleCSV(state.aiLastPlanWeeks) : alert('Generate first')}>Google CSV</button>
              <button className="alp-ai-btn" onClick={() => state.aiLastPlanWeeks?.length ? exportJSON(state.aiLastPlanWeeks) : alert('Generate first')}>Export JSON</button>
              <button className="alp-ai-btn" onClick={() => state.aiLastPlanWeeks?.length ? window.print() : alert('Generate first')}>Print</button>
            </div>

            {state.aiLastPlanWeeks?.length > 0 && (
              <div className="alp-ai-output">
                {state.aiLastPlanWeeks.map((w, wi) => (
                  <div key={wi} className="alp-ai-week" style={{ borderLeftColor: TRACK_COLORS[w.track]?.main || '#ef4444' }}>
                    <div className="alp-ai-week-head">
                      <div className="alp-ai-week-title">Week {w.week} · {TRACK_LABELS[w.track]}</div>
                      <div className="alp-ai-week-date">{w.startISO} to {w.endISO}</div>
                    </div>
                    <div className="alp-ai-week-head">
                      <div className="alp-ai-week-body">{w.chunk.map(c => `${c.title} (${c.diff})`).join(' | ')}</div>
                      <div className="alp-ai-confidence">Confidence {w.confidence}%</div>
                    </div>
                    <div className="alp-ai-days">
                      {w.dayPlan.map((d, di) => {
                        const key = `${d.dateISO}::${d.task}`;
                        const done = !!state.aiTaskDone[key];
                        return (
                          <div key={di} className="alp-ai-day">
                            <div className="alp-ai-day-left">
                              <div className={`alp-dc-check ${done ? 'checked' : ''}`} onClick={() => toggleAITaskDone(key)}>{done ? '✓' : ''}</div>
                              <div className="alp-ai-day-date">{d.dateISO}</div>
                            </div>
                            <div className={`alp-ai-day-task ${done ? 'done' : ''}`}>{d.task}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
