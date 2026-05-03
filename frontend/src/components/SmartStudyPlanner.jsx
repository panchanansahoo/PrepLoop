import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Calendar, ChevronRight, Check, RefreshCw,
  Clock, Target, Zap, BookOpen, Code2, MessageSquare,
  BarChart3, Flame, Plus, X, ChevronDown, ChevronUp,
  Sparkles, AlertCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PROBLEMS, TOPICS } from '../data/problemsDatabase';

const PLAN_KEY = 'preploop_study_plan';
const PROGRESS_KEY = 'preploop_study_progress';

// ── Topic weakness detection from localStorage solved set ──
function detectWeakTopics() {
  try {
    const solved = new Set(JSON.parse(localStorage.getItem('cl_solved') || '[]'));
    return TOPICS.map(topic => {
      const total = PROBLEMS.filter(p => p.topics.includes(topic)).length;
      const done = PROBLEMS.filter(p => p.topics.includes(topic) && solved.has(p.id)).length;
      const pct = total > 0 ? done / total : 0;
      return { topic, pct, total, done };
    })
      .filter(t => t.total >= 3)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 6)
      .map(t => t.topic);
  } catch { return ['Arrays', 'Dynamic Programming', 'Graphs', 'Trees', 'Binary Search']; }
}

const TASK_TYPES = [
  { id: 'dsa',      label: 'DSA Problem',       icon: Code2,        color: '#60a5fa', path: '/problems',          mins: 45 },
  { id: 'mock',     label: 'Mock Interview',     icon: Brain,        color: '#a78bfa', path: '/company-interview', mins: 60 },
  { id: 'review',   label: 'Flashcard Review',   icon: BookOpen,     color: '#f472b6', path: '/flashcards',        mins: 20 },
  { id: 'system',   label: 'System Design',      icon: BarChart3,    color: '#34d399', path: '/system-design',     mins: 40 },
  { id: 'behavioral',label: 'Behavioral Prep',   icon: MessageSquare,color: '#fbbf24', path: '/behavioral-coach',  mins: 30 },
  { id: 'quiz',     label: 'Quiz Arena',         icon: Zap,          color: '#fb923c', path: '/quiz-arena',        mins: 25 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Generate a smart weekly plan ──
function generatePlan({ hoursPerDay, focusTopics, targetDate, level }) {
  const minsPerDay = hoursPerDay * 60;
  const daysLeft = targetDate
    ? Math.max(1, Math.ceil((new Date(targetDate + 'T00:00:00') - new Date()) / 86400000))
    : 30;

  const isIntensive = daysLeft <= 14;

  return DAYS.map((day, idx) => {
    const tasks = [];
    let remaining = minsPerDay;
    const isWeekend = idx >= 5;

    // Weekend: heavier mock + system design
    if (isWeekend) {
      if (remaining >= 60) { tasks.push({ ...TASK_TYPES[1], topic: null }); remaining -= 60; }
      if (remaining >= 40) { tasks.push({ ...TASK_TYPES[3], topic: focusTopics[idx % focusTopics.length] || null }); remaining -= 40; }
    } else {
      // Weekday: DSA + review + behavioral rotation
      const topic = focusTopics[idx % focusTopics.length];
      if (remaining >= 45) { tasks.push({ ...TASK_TYPES[0], topic, label: `DSA: ${topic || 'Practice'}` }); remaining -= 45; }
      if (remaining >= 20) { tasks.push({ ...TASK_TYPES[2], topic: null }); remaining -= 20; }
      if (isIntensive && remaining >= 30 && idx % 2 === 0) {
        tasks.push({ ...TASK_TYPES[4], topic: null }); remaining -= 30;
      }
      if (remaining >= 25 && idx % 3 === 0) {
        tasks.push({ ...TASK_TYPES[5], topic: null }); remaining -= 25;
      }
    }

    return {
      day,
      tasks: tasks.map((t, i) => ({ ...t, id: `${day}-${i}`, done: false })),
      totalMins: tasks.reduce((s, t) => s + t.mins, 0),
    };
  });
}

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function getTodayDayIdx() { return (new Date().getDay() + 6) % 7; } // Mon=0

export default function SmartStudyPlanner() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY) || 'null'); } catch { return null; }
  });
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
  });
  const [showSetup, setShowSetup] = useState(!plan);
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(getTodayDayIdx());
  const [config, setConfig] = useState({
    hoursPerDay: plan?.config?.hoursPerDay || 2,
    targetDate: plan?.config?.targetDate || '',
    level: plan?.config?.level || 'intermediate',
    focusTopics: plan?.config?.focusTopics || detectWeakTopics(),
  });

  const todayKey = getTodayKey();
  const todayIdx = getTodayDayIdx();

  // Persist progress
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const generate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const schedule = generatePlan(config);
      const newPlan = { schedule, config, generatedAt: Date.now() };
      setPlan(newPlan);
      localStorage.setItem(PLAN_KEY, JSON.stringify(newPlan));
      setShowSetup(false);
      setGenerating(false);
    }, 800);
  }, [config]);

  const toggleTask = useCallback((dayIdx, taskId) => {
    const key = `${todayKey}-${dayIdx}-${taskId}`;
    setProgress(prev => ({ ...prev, [key]: !prev[key] }));
  }, [todayKey]);

  const isTaskDone = (dayIdx, taskId) => !!progress[`${todayKey}-${dayIdx}-${taskId}`];

  const todayStats = useMemo(() => {
    if (!plan) return { done: 0, total: 0, mins: 0 };
    const day = plan.schedule[todayIdx];
    if (!day) return { done: 0, total: 0, mins: 0 };
    const done = day.tasks.filter(t => isTaskDone(todayIdx, t.id)).length;
    const doneMins = day.tasks.filter(t => isTaskDone(todayIdx, t.id)).reduce((s, t) => s + t.mins, 0);
    return { done, total: day.tasks.length, mins: doneMins };
  }, [plan, progress, todayIdx, todayKey]);

  const c = {
    bg: isLight
      ? 'linear-gradient(135deg,rgba(255,255,255,.95),rgba(248,250,252,.9))'
      : 'linear-gradient(135deg,rgba(18,18,24,.6),rgba(20,20,28,.4))',
    border: isLight ? '1px solid rgba(15,23,42,.08)' : '1px solid rgba(255,255,255,.08)',
    shadow: isLight ? '0 12px 32px rgba(0,0,0,.06)' : '0 24px 64px -20px rgba(0,0,0,.6)',
    title: isLight ? '#0f172a' : '#f8fafc',
    text: isLight ? '#475569' : '#cbd5e1',
    muted: isLight ? '#94a3b8' : '#64748b',
    card: isLight ? 'rgba(15,23,42,.02)' : 'rgba(255,255,255,.03)',
    cardBorder: isLight ? '1px solid rgba(15,23,42,.05)' : '1px solid rgba(255,255,255,.06)',
    input: isLight ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.25)',
    inputBorder: isLight ? '1px solid rgba(15,23,42,.1)' : '1px solid rgba(255,255,255,.1)',
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: c.input, border: c.inputBorder,
    color: c.title, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    colorScheme: isLight ? 'light' : 'dark',
  };

  return (
    <div style={{
      padding: '24px 28px', background: c.bg, borderRadius: 24,
      border: c.border, boxShadow: c.shadow,
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.25)',
          }}>
            <Brain size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>
              Smart Study Planner
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: c.muted, fontWeight: 500 }}>
              {plan ? `Today: ${todayStats.done}/${todayStats.total} tasks · ${todayStats.mins}m done` : 'AI-personalized weekly schedule'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {plan && (
            <button onClick={() => setShowSetup(s => !s)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
              background: c.card, border: c.cardBorder,
              color: c.muted, fontSize: 11, fontWeight: 700,
            }}>
              <RefreshCw size={12} /> Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Setup Panel */}
      {showSetup && (
        <div style={{
          background: c.card, border: c.cardBorder, borderRadius: 16,
          padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: 5 }} />
            Configure Your Plan
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: 'block', marginBottom: 5 }}>
                Hours per day
              </label>
              <select value={config.hoursPerDay} onChange={e => setConfig(c => ({ ...c, hoursPerDay: +e.target.value }))} style={{ ...inputStyle }}>
                {[1, 1.5, 2, 2.5, 3, 4].map(h => <option key={h} value={h}>{h}h / day</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: 'block', marginBottom: 5 }}>
                Experience level
              </label>
              <select value={config.level} onChange={e => setConfig(c => ({ ...c, level: e.target.value }))} style={{ ...inputStyle }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: 'block', marginBottom: 5 }}>
              Target interview date (optional)
            </label>
            <input type="date" value={config.targetDate} min={new Date().toISOString().slice(0, 10)}
              onChange={e => setConfig(c => ({ ...c, targetDate: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: 'block', marginBottom: 6 }}>
              Focus topics (auto-detected from your weak areas)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {config.focusTopics.map(t => (
                <span key={t} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.2)',
                  color: '#c084fc', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {t}
                  <button onClick={() => setConfig(c => ({ ...c, focusTopics: c.focusTopics.filter(x => x !== t) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c084fc', padding: 0, display: 'flex' }}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={generating} style={{
            width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
            background: generating ? 'rgba(139,92,246,.2)' : 'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color: '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {generating ? (
              <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating plan...</>
            ) : (
              <><Sparkles size={14} /> Generate My Study Plan</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Weekly Schedule */}
      {plan && !showSetup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {plan.schedule.map((day, dayIdx) => {
            const isToday = dayIdx === todayIdx;
            const isExpanded = expandedDay === dayIdx;
            const doneTasks = day.tasks.filter(t => isTaskDone(dayIdx, t.id)).length;
            const allDone = doneTasks === day.tasks.length && day.tasks.length > 0;

            return (
              <div key={day.day} style={{
                borderRadius: 12,
                background: isToday ? 'rgba(139,92,246,.06)' : c.card,
                border: isToday ? '1px solid rgba(139,92,246,.2)' : c.cardBorder,
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}>
                {/* Day header */}
                <div
                  onClick={() => setExpandedDay(isExpanded ? -1 : dayIdx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isToday ? 'rgba(139,92,246,.2)' : 'rgba(255,255,255,.04)',
                    border: `1px solid ${isToday ? 'rgba(139,92,246,.3)' : 'rgba(255,255,255,.06)'}`,
                    display: 'grid', placeItems: 'center',
                    fontSize: 11, fontWeight: 800,
                    color: isToday ? '#c084fc' : c.muted,
                  }}>
                    {day.day}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : c.text }}>
                        {isToday ? "Today's Plan" : day.day === 'Sat' || day.day === 'Sun' ? 'Weekend Session' : 'Study Session'}
                      </span>
                      {isToday && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,.2)', color: '#c084fc', textTransform: 'uppercase' }}>TODAY</span>}
                      {allDone && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,.15)', color: '#4ade80', textTransform: 'uppercase' }}>✓ Done</span>}
                    </div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 1 }}>
                      {day.tasks.length} tasks · {day.totalMins}m
                      {isToday && doneTasks > 0 && ` · ${doneTasks}/${day.tasks.length} completed`}
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {day.tasks.map((t, i) => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isTaskDone(dayIdx, t.id) ? t.color : 'rgba(255,255,255,.1)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>

                  {isExpanded ? <ChevronUp size={14} style={{ color: c.muted, flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: c.muted, flexShrink: 0 }} />}
                </div>

                {/* Expanded tasks */}
                {isExpanded && (
                  <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {day.tasks.map(task => {
                      const done = isTaskDone(dayIdx, task.id);
                      const Icon = task.icon;
                      return (
                        <div key={task.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 10,
                          background: done ? `${task.color}0d` : 'rgba(255,255,255,.02)',
                          border: done ? `1px solid ${task.color}25` : '1px solid rgba(255,255,255,.04)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                          onClick={() => toggleTask(dayIdx, task.id)}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                            background: done ? task.color : 'transparent',
                            border: `2px solid ${done ? task.color : c.muted}`,
                            display: 'grid', placeItems: 'center', transition: 'all 0.2s',
                          }}>
                            {done && <Check size={11} color="#fff" strokeWidth={3} />}
                          </div>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: `${task.color}15`, display: 'grid', placeItems: 'center',
                          }}>
                            <Icon size={14} style={{ color: task.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: done ? c.muted : c.text, textDecoration: done ? 'line-through' : 'none' }}>
                              {task.label}
                            </div>
                            <div style={{ fontSize: 10, color: c.muted }}>{task.mins}m</div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(task.path); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: done ? task.color : c.muted, padding: 2, display: 'flex' }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
