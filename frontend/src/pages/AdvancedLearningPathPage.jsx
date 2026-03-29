import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles, Calendar, Download, FileJson, Printer, Clock,
  ChevronDown, Target, Zap, TrendingUp, BarChart3,
  Layers, BookOpen, Database, Server, Check, Settings2,
  CalendarDays, Timer, Briefcase, MapPin
} from 'lucide-react';
import '../styles/AdvancedLearningPathPage.css';

/* ═══════════════ DATA ═══════════════ */
const TRACK_CONFIG = {
  dsa: { label: 'DSA', icon: '⚡', color: '#818cf8', colorAlpha: 'rgba(129,140,248,0.1)' },
  apt: { label: 'Aptitude', icon: '🧠', color: '#f59e0b', colorAlpha: 'rgba(245,158,11,0.1)' },
  sql: { label: 'SQL', icon: '🗄️', color: '#06b6d4', colorAlpha: 'rgba(6,182,212,0.1)' },
  sys: { label: 'System Design', icon: '🏗️', color: '#10b981', colorAlpha: 'rgba(16,185,129,0.1)' },
};

const TRACK_TOPICS = {
  dsa: [
    { title: 'Arrays & Strings', diff: 'Medium' },
    { title: 'Linked Lists', diff: 'Medium' },
    { title: 'Stacks & Queues', diff: 'Medium' },
    { title: 'Hash Maps & Sets', diff: 'Medium' },
    { title: 'Trees & BST', diff: 'Hard' },
    { title: 'Heaps & Priority Queues', diff: 'Hard' },
    { title: 'Graph Algorithms', diff: 'Hard' },
    { title: 'Dynamic Programming', diff: 'Hard' },
    { title: 'Greedy Algorithms', diff: 'Hard' },
    { title: 'Advanced Data Structures', diff: 'Expert' },
  ],
  apt: [
    { title: 'Number Systems & HCF/LCM', diff: 'Medium' },
    { title: 'Percentages & Profit/Loss', diff: 'Medium' },
    { title: 'Algebra & Equations', diff: 'Hard' },
    { title: 'Permutation & Probability', diff: 'Hard' },
    { title: 'Logical Deductions', diff: 'Hard' },
    { title: 'Series & Patterns', diff: 'Medium' },
    { title: 'Data Interpretation', diff: 'Hard' },
    { title: 'Reading Comprehension', diff: 'Hard' },
  ],
  sql: [
    { title: 'SELECT Mastery', diff: 'Medium' },
    { title: 'WHERE, ORDER, GROUP BY', diff: 'Medium' },
    { title: 'Joins & Subqueries', diff: 'Hard' },
    { title: 'Window Functions', diff: 'Hard' },
    { title: 'CTEs & Recursive Queries', diff: 'Hard' },
    { title: 'Indexes & Execution Plans', diff: 'Hard' },
    { title: 'Transactions & Concurrency', diff: 'Expert' },
    { title: 'Query Optimization', diff: 'Expert' },
  ],
  sys: [
    { title: 'Scalability Fundamentals', diff: 'Hard' },
    { title: 'Load Balancing & Caching', diff: 'Hard' },
    { title: 'Storage Systems', diff: 'Hard' },
    { title: 'Networking & CDN', diff: 'Medium' },
    { title: 'Messaging & Event Streaming', diff: 'Hard' },
    { title: 'Database Sharding & Replication', diff: 'Expert' },
    { title: 'Reliability & Fault Tolerance', diff: 'Expert' },
    { title: 'Design Twitter / X', diff: 'Expert' },
  ],
};

const COMPANY_PRESETS = {
  balanced: { label: 'Balanced', desc: 'Equal focus', weights: { dsa: 1, apt: 1, sql: 1, sys: 1 } },
  faang: { label: 'FAANG', desc: 'DSA + System Design heavy', weights: { dsa: 3, apt: 1, sql: 1, sys: 2 } },
  data: { label: 'Data / Analytics', desc: 'SQL + Aptitude heavy', weights: { dsa: 1, apt: 2, sql: 3, sys: 1 } },
  product: { label: 'Product Startup', desc: 'DSA + SQL + System Design', weights: { dsa: 2, apt: 1, sql: 2, sys: 2 } },
};

const DIFF_COLORS = {
  Medium: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  Hard:   { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: 'rgba(249,115,22,0.2)' },
  Expert: { bg: 'rgba(239,68,68,0.1)',  text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

/* ═══════════════ HELPERS ═══════════════ */
function fmtISO(d) { return d.toISOString().slice(0, 10); }
function compact(iso) { return iso.replace(/-/g, ''); }
function nextDay(iso) { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + 1); return fmtISO(d); }
function toGCal(iso) { const d = new Date(`${iso}T00:00:00`); return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`; }
function csvEsc(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
function downloadText(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

function weekConfidence(chunk, studyDays, weeklyItems) {
  const total = chunk.length || 1;
  const hard = chunk.filter(c => c.diff === 'Hard').length;
  const expert = chunk.filter(c => c.diff === 'Expert').length;
  const mixScore = Math.max(0, 100 - ((hard * 1.25 + expert * 2.2) / total) * 18);
  const loadScore = Math.max(0, 100 - Math.max(0, weeklyItems - Math.max(2, studyDays)) * 14);
  return Math.max(35, Math.min(95, Math.round(mixScore * 0.6 + loadScore * 0.4)));
}

function getItemsPerWeek(intensity) { return intensity === 'light' ? 2 : intensity === 'intense' ? 4 : 3; }

function buildPlan(input) {
  const { months, startDate, intensity, revisionBuffer, studyDays, deadline, companyMode, dailyBlock, selectedTracks } = input;
  const profile = COMPANY_PRESETS[companyMode]?.weights || COMPANY_PRESETS.balanced.weights;
  const bag = [];
  selectedTracks.forEach(t => { for (let i = 0; i < Math.max(1, profile[t] || 1); i++) bag.push(t); });

  const queues = Object.fromEntries(selectedTracks.map(t => [t, [...TRACK_TOPICS[t]]]));
  const ptrs = Object.fromEntries(selectedTracks.map(t => [t, 0]));

  const base = new Date(`${startDate}T00:00:00`);
  let totalWeeks = Math.max(4, Math.round(months * 4.35));
  if (deadline) {
    const dd = new Date(`${deadline}T00:00:00`);
    const days = Math.ceil((dd - base) / 86400000);
    if (days > 0) totalWeeks = Math.max(1, Math.ceil(days / 7));
  }

  const effectiveWeeks = Math.max(1, Math.round(totalWeeks * (1 - revisionBuffer / 100)));
  const itemsPerWeek = getItemsPerWeek(intensity);
  const weeks = [];
  let rr = 0;

  for (let wn = 1; wn <= effectiveWeeks; wn++) {
    let track = bag[rr % bag.length];
    let guard = 0;
    while (ptrs[track] >= queues[track].length && guard < selectedTracks.length + 2) { rr++; track = bag[rr % bag.length]; guard++; }

    const chunk = [];
    for (let i = 0; i < itemsPerWeek; i++) {
      if (ptrs[track] < queues[track].length) { chunk.push(queues[track][ptrs[track]]); ptrs[track]++; }
    }
    if (!chunk.length) break;

    const ws = new Date(base); ws.setDate(base.getDate() + (wn - 1) * 7);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);

    const dayPlan = [];
    for (let i = 0; i < studyDays; i++) {
      const d = new Date(ws); d.setDate(ws.getDate() + i);
      const topic = chunk[i];
      if (topic) {
        dayPlan.push({ dateISO: fmtISO(d), task: `${topic.title} (${topic.diff})`, mins: dailyBlock });
      } else {
        const fallback = ['Topic revision + summary notes', 'Timed mock set + analysis', 'Weak-area drill + error log'][i % 3];
        dayPlan.push({ dateISO: fmtISO(d), task: fallback, mins: dailyBlock });
      }
    }

    weeks.push({
      week: wn, track,
      startISO: fmtISO(ws), endISO: fmtISO(we),
      confidence: weekConfidence(chunk, studyDays, itemsPerWeek),
      chunk, dayPlan,
    });
    rr++;
  }
  return weeks;
}

/* ═══════════════ CONFIDENCE RING ═══════════════ */
function ConfidenceRing({ percent, size = 48, stroke = 4, isLight = false }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 80 ? '#34d399' : percent >= 60 ? '#fbbf24' : '#f97316';
  const trackColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  return (
    <div className="alp-confidence-gauge">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="alp-confidence-text" style={{ color }}>{percent}%</div>
    </div>
  );
}

/* ═══════════════ WEEK CARD ═══════════════ */
function WeekCard({ week, index, isLight = false }) {
  const [open, setOpen] = useState(index < 3);
  const tc = TRACK_CONFIG[week.track];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="alp-week-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="alp-week-dot" style={{ borderColor: tc.color }}>
        <div className="alp-week-dot-inner" style={{ background: tc.color }} />
      </div>
      <div className="alp-week-body">
        <div className="alp-week-header" onClick={() => setOpen(p => !p)}>
          <div className="alp-week-meta">
            <div>
              <div className="alp-week-num" style={{ color: tc.color }}>Week {week.week} · {tc.label}</div>
              <div className="alp-week-title">{week.chunk.map(t => t.title).join(', ')}</div>
              <div className="alp-week-dates">{week.startISO} → {week.endISO}</div>
            </div>
          </div>
          <div className="alp-week-right">
            <div className="alp-week-topics-preview">
              {week.chunk.map((t, i) => {
                const dc = DIFF_COLORS[t.diff] || DIFF_COLORS.Medium;
                return (
                  <span key={i} className="alp-topic-pill"
                    style={{ background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>
                    {t.diff}
                  </span>
                );
              })}
            </div>
            <ConfidenceRing percent={week.confidence} isLight={isLight} />
            <ChevronDown size={18} className={`alp-week-chevron ${open ? 'open' : ''}`} />
          </div>
        </div>
        {open && (
          <div className="alp-day-grid">
            {week.dayPlan.map((day, di) => {
              const d = new Date(`${day.dateISO}T00:00:00`);
              return (
                <div key={di} className="alp-day-row">
                  <div className="alp-day-badge"
                    style={{ background: `${tc.color}15`, color: tc.color, border: `1px solid ${tc.color}25` }}>
                    {dayNames[d.getDay()]}
                  </div>
                  <div className="alp-day-task">{day.task}</div>
                  <div className="alp-day-time">
                    <Timer size={12} />
                    {day.mins}m
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function AdvancedLearningPathPage() {
  const [months, setMonths] = useState(4);
  const [startDate, setStartDate] = useState(fmtISO(new Date()));
  const [intensity, setIntensity] = useState('standard');
  const [revisionBuffer, setRevisionBuffer] = useState(10);
  const [studyDays, setStudyDays] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [companyMode, setCompanyMode] = useState('balanced');
  const [dailyBlock, setDailyBlock] = useState(90);
  const [selectedTracks, setSelectedTracks] = useState(['dsa', 'apt', 'sql', 'sys']);
  const [weeks, setWeeks] = useState([]);
  const [configOpen, setConfigOpen] = useState(true);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const hasPlan = weeks.length > 0;

  const summary = useMemo(() => {
    if (!hasPlan) return null;
    const totalTopics = weeks.reduce((a, w) => a + w.chunk.length, 0);
    const avgConf = Math.round(weeks.reduce((a, w) => a + w.confidence, 0) / weeks.length);
    const totalDays = weeks.reduce((a, w) => a + w.dayPlan.length, 0);
    const totalHours = Math.round(totalDays * dailyBlock / 60);
    return { totalWeeks: weeks.length, totalTopics, avgConf, totalDays, totalHours };
  }, [hasPlan, weeks, dailyBlock]);

  const toggleTrack = useCallback((track) => {
    setSelectedTracks(prev => {
      const has = prev.includes(track);
      if (has) { const next = prev.filter(t => t !== track); return next.length ? next : ['dsa']; }
      return [...prev, track];
    });
  }, []);

  const onGenerate = () => {
    setWeeks(buildPlan({
      months: Math.max(1, Math.min(24, Number(months) || 4)),
      startDate, intensity,
      revisionBuffer: Math.max(0, Math.min(40, Number(revisionBuffer) || 10)),
      studyDays: Math.max(1, Math.min(7, Number(studyDays) || 5)),
      deadline, companyMode,
      dailyBlock: Math.max(30, Math.min(240, Number(dailyBlock) || 90)),
      selectedTracks,
    }));
    setConfigOpen(false);
  };

  const exportIcs = () => {
    if (!hasPlan) return;
    const stamp = `${compact(fmtISO(new Date()))}T000000Z`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PrepLoop//Advanced Learning Path//EN', 'CALSCALE:GREGORIAN'];
    weeks.forEach((w, wi) => {
      w.dayPlan.forEach((day, di) => {
        lines.push('BEGIN:VEVENT', `UID:preploop-${wi+1}-${di+1}-${compact(day.dateISO)}@preploop.local`,
          `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${compact(day.dateISO)}`,
          `DTEND;VALUE=DATE:${compact(nextDay(day.dateISO))}`,
          `SUMMARY:PrepLoop ${TRACK_CONFIG[w.track].label} - ${day.task}`,
          `DESCRIPTION:Week ${w.week} (${w.startISO} to ${w.endISO})`, 'END:VEVENT');
      });
    });
    lines.push('END:VCALENDAR');
    downloadText('preploop-roadmap.ics', lines.join('\r\n'), 'text/calendar;charset=utf-8');
  };

  const exportGoogleCsv = () => {
    if (!hasPlan) return;
    const rows = [['Subject', 'Start Date', 'End Date', 'All Day Event', 'Description'].join(',')];
    weeks.forEach(w => {
      w.dayPlan.forEach(day => {
        rows.push([csvEsc(`PrepLoop ${TRACK_CONFIG[w.track].label}: ${day.task}`), csvEsc(toGCal(day.dateISO)), csvEsc(toGCal(day.dateISO)), csvEsc('True'), csvEsc(`Week ${w.week}`)].join(','));
      });
    });
    downloadText('preploop-roadmap-google.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  };

  const exportJson = () => {
    if (!hasPlan) return;
    downloadText('preploop-roadmap.json', JSON.stringify({ generatedOn: fmtISO(new Date()), companyMode, dailyBlockMinutes: dailyBlock, studyDays, weeks }, null, 2), 'application/json;charset=utf-8');
  };

  return (
    <div className={`alp-page ${isLight ? 'alp-light' : ''}`}>
      {/* ─── Hero ─── */}
      <div className="alp-hero no-print">
        <div className="alp-hero-badge">
          <Sparkles size={14} />
          AI-Powered Roadmap Generator
        </div>
        <h1>
          Advanced{' '}
          <span className="alp-gradient">Learning Path</span>
        </h1>
        <p className="alp-hero-sub">
          Generate a personalized week-by-week roadmap with confidence scoring,
          day-level scheduling, and one-click calendar exports.
        </p>
      </div>

      {/* ─── Summary Dashboard (shown after generation) ─── */}
      {summary && (
        <div className="alp-dashboard no-print">
          {[
            { label: 'Total Weeks', value: summary.totalWeeks, icon: <CalendarDays size={18} />, color: '#818cf8', glow: 'rgba(129,140,248,0.06)' },
            { label: 'Topics Covered', value: summary.totalTopics, icon: <Layers size={18} />, color: '#34d399', glow: 'rgba(52,211,153,0.06)' },
            { label: 'Avg Confidence', value: `${summary.avgConf}%`, icon: <TrendingUp size={18} />, color: '#fbbf24', glow: 'rgba(251,191,36,0.06)' },
            { label: 'Total Hours', value: summary.totalHours, icon: <Clock size={18} />, color: '#f472b6', glow: 'rgba(244,114,182,0.06)' },
          ].map((s, i) => (
            <div key={i} className="alp-stat-card" style={{ '--card-glow': s.glow }}>
              <div className="alp-stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
              <div className="alp-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="alp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Configuration Panel ─── */}
      <div className="alp-config no-print">
        <div className="alp-config-inner">
          <div className="alp-config-header" onClick={() => setConfigOpen(p => !p)}>
            <h2><Settings2 size={20} /> Plan Configuration</h2>
            <div className={`alp-config-toggle ${configOpen ? 'open' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>

          {configOpen && (
            <>
              {/* Form Grid */}
              <div className="alp-form-grid">
                <div className="alp-field">
                  <span className="alp-field-label">Duration</span>
                  <input type="number" min="1" max="24" value={months} onChange={e => setMonths(e.target.value)} placeholder="Months" />
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Start Date</span>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Interview Date</span>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Weekly Intensity</span>
                  <select value={intensity} onChange={e => setIntensity(e.target.value)}>
                    <option value="light">Light — 2 topics/week</option>
                    <option value="standard">Standard — 3 topics/week</option>
                    <option value="intense">Intense — 4 topics/week</option>
                  </select>
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Study Days / Week</span>
                  <select value={studyDays} onChange={e => setStudyDays(Number(e.target.value))}>
                    <option value={4}>4 days</option>
                    <option value={5}>5 days</option>
                    <option value={6}>6 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Daily Block</span>
                  <select value={dailyBlock} onChange={e => setDailyBlock(Number(e.target.value))}>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                    <option value={150}>150 min</option>
                    <option value={180}>180 min</option>
                  </select>
                </div>
                <div className="alp-field">
                  <span className="alp-field-label">Revision Buffer</span>
                  <select value={revisionBuffer} onChange={e => setRevisionBuffer(Number(e.target.value))}>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                    <option value={25}>25%</option>
                  </select>
                </div>
              </div>

              {/* Company Presets */}
              <div className="alp-tracks-section">
                <div className="alp-tracks-label">Company Focus</div>
                <div className="alp-presets-row">
                  {Object.entries(COMPANY_PRESETS).map(([key, preset]) => (
                    <button key={key}
                      className={`alp-preset ${companyMode === key ? 'active' : ''}`}
                      onClick={() => setCompanyMode(key)}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Track Selection */}
              <div className="alp-tracks-section">
                <div className="alp-tracks-label">Study Tracks</div>
                <div className="alp-tracks-grid">
                  {Object.entries(TRACK_CONFIG).map(([key, tc]) => (
                    <div key={key}
                      className={`alp-track-card ${selectedTracks.includes(key) ? 'active' : ''}`}
                      style={{ '--track-color': tc.color, '--track-color-alpha': tc.colorAlpha }}
                      onClick={() => toggleTrack(key)}>
                      <div className="alp-track-check">
                        {selectedTracks.includes(key) && <Check size={12} />}
                      </div>
                      <div className="alp-track-icon">{tc.icon}</div>
                      <div className="alp-track-name">{tc.label}</div>
                      <div className="alp-track-count">{TRACK_TOPICS[key].length} topics</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="alp-action-bar">
                <button className="alp-btn alp-btn-primary" onClick={onGenerate}>
                  <Sparkles size={16} /> Generate Roadmap
                </button>
                <button className="alp-btn" onClick={exportIcs} disabled={!hasPlan}>
                  <Calendar size={15} /> Export .ics
                </button>
                <button className="alp-btn" onClick={exportGoogleCsv} disabled={!hasPlan}>
                  <Download size={15} /> Google CSV
                </button>
                <button className="alp-btn" onClick={exportJson} disabled={!hasPlan}>
                  <FileJson size={15} /> JSON
                </button>
                <button className="alp-btn" onClick={() => hasPlan && window.print()} disabled={!hasPlan}>
                  <Printer size={15} /> Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Summary Pills ─── */}
      {summary && (
        <div className="alp-summary-bar no-print">
          <div className="alp-summary-pill">
            <MapPin size={14} style={{ color: '#818cf8' }} />
            <span style={{ color: '#a5b4fc' }}>{summary.totalWeeks} weeks</span>
          </div>
          <div className="alp-summary-pill">
            <Briefcase size={14} style={{ color: '#f59e0b' }} />
            <span style={{ color: '#fbbf24' }}>{COMPANY_PRESETS[companyMode]?.label} focus</span>
          </div>
          <div className="alp-summary-pill">
            <Target size={14} style={{ color: '#34d399' }} />
            <span style={{ color: '#6ee7b7' }}>{summary.avgConf}% avg confidence</span>
          </div>
          <div className="alp-summary-pill">
            <Zap size={14} style={{ color: '#f472b6' }} />
            <span style={{ color: '#f9a8d4' }}>{selectedTracks.length} active tracks</span>
          </div>
        </div>
      )}

      {/* ─── Timeline Roadmap ─── */}
      {hasPlan ? (
        <div className="alp-timeline print-area">
          <div className="alp-timeline-header no-print">
            <h2>
              <BarChart3 size={20} style={{ color: '#818cf8' }} />
              Your Roadmap
            </h2>
          </div>
          <div className="alp-timeline-line">
            {weeks.map((week, i) => (
              <WeekCard key={`${week.track}-${week.week}`} week={week} index={i} isLight={isLight} />
            ))}
          </div>
        </div>
      ) : (
        <div className="alp-empty-state">
          <div className="alp-empty-inner">
            <div className="alp-empty-icon">
              <Sparkles size={32} style={{ color: '#818cf8' }} />
            </div>
            <div className="alp-empty-title">No roadmap yet</div>
            <p className="alp-empty-desc">
              Configure your study preferences above and hit
              <strong> "Generate Roadmap"</strong> to create a personalized week-by-week plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
