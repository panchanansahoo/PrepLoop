import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Target, ChevronRight, X, Check,
  Flame, Clock, Edit3, Trash2, Plus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'preploop_interview_countdown';

const DAILY_TASKS = [
  { id: 'dsa',       label: 'Solve 2 DSA problems',    path: '/problems',          color: '#60a5fa' },
  { id: 'mock',      label: 'Do a mock interview',      path: '/company-interview', color: '#a78bfa' },
  { id: 'review',    label: 'Review flashcards',        path: '/flashcards',        color: '#f472b6' },
  { id: 'system',    label: 'Study system design',      path: '/system-design',     color: '#34d399' },
  { id: 'behavioral',label: 'Practice behavioral Q',   path: '/behavioral-coach',  color: '#fbbf24' },
];

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getUrgencyColor(days) {
  if (days === null) return '#8b5cf6';
  if (days <= 3) return '#ef4444';
  if (days <= 7) return '#f59e0b';
  if (days <= 14) return '#60a5fa';
  return '#34d399';
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function InterviewCountdownWidget() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  });
  const [editing, setEditing] = useState(!data);
  const [form, setForm] = useState({
    company: data?.company || '',
    role: data?.role || '',
    date: data?.date || '',
  });
  const [checkedTasks, setCheckedTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      const todayKey = getTodayKey();
      return saved?.dailyChecks?.[todayKey] || [];
    } catch { return []; }
  });

  // Persist daily checks
  useEffect(() => {
    if (!data) return;
    const todayKey = getTodayKey();
    const updated = { ...data, dailyChecks: { ...(data.dailyChecks || {}), [todayKey]: checkedTasks } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [checkedTasks, data]);

  const save = useCallback(() => {
    if (!form.date) return;
    const newData = { ...form, dailyChecks: data?.dailyChecks || {} };
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setEditing(false);
  }, [form, data]);

  const clear = useCallback(() => {
    setData(null);
    localStorage.removeItem(STORAGE_KEY);
    setForm({ company: '', role: '', date: '' });
    setEditing(true);
  }, []);

  const toggleTask = (id) => {
    setCheckedTasks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const daysLeft = data ? getDaysLeft(data.date) : null;
  const urgencyColor = getUrgencyColor(daysLeft);
  const completedToday = checkedTasks.length;
  const totalTasks = DAILY_TASKS.length;

  const c = {
    bg: isLight
      ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
      : 'linear-gradient(135deg, rgba(18,18,24,0.6), rgba(20,20,28,0.4))',
    border: isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.08)',
    shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06)' : '0 24px 64px -20px rgba(0,0,0,0.6)',
    title: isLight ? '#0f172a' : '#f8fafc',
    text: isLight ? '#475569' : '#cbd5e1',
    muted: isLight ? '#94a3b8' : '#64748b',
    inputBg: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.25)',
    inputBorder: isLight ? '1px solid rgba(15,23,42,0.1)' : '1px solid rgba(255,255,255,0.1)',
    cardBg: isLight ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.03)',
    cardBorder: isLight ? '1px solid rgba(15,23,42,0.05)' : '1px solid rgba(255,255,255,0.06)',
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    background: c.inputBg, border: c.inputBorder,
    color: c.title, fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
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
            background: `${urgencyColor}18`, border: `1px solid ${urgencyColor}30`,
          }}>
            <Target size={18} style={{ color: urgencyColor }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>
              Interview Countdown
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: c.muted, fontWeight: 500 }}>
              {data ? `${completedToday}/${totalTasks} tasks today` : 'Set your target date'}
            </p>
          </div>
        </div>
        {data && !editing && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditing(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.muted, padding: 4, borderRadius: 6,
            }} title="Edit">
              <Edit3 size={15} />
            </button>
            <button onClick={clear} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.muted, padding: 4, borderRadius: 6,
            }} title="Clear">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Setup form */}
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            style={inputStyle}
            placeholder="Company (e.g. Google)"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
          />
          <input
            style={inputStyle}
            placeholder="Role (e.g. SDE-2)"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={15} style={{ color: c.muted, flexShrink: 0 }} />
            <input
              type="date"
              style={{ ...inputStyle, flex: 1 }}
              value={form.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={save}
              disabled={!form.date}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                background: form.date ? `linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}cc)` : c.cardBg,
                color: form.date ? '#fff' : c.muted,
                fontSize: 13, fontWeight: 700, cursor: form.date ? 'pointer' : 'not-allowed',
              }}
            >
              Set Countdown
            </button>
            {data && (
              <button onClick={() => setEditing(false)} style={{
                padding: '9px 16px', borderRadius: 10, border: c.cardBorder,
                background: c.cardBg, color: c.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Countdown display */}
      {data && !editing && (
        <>
          {/* Big countdown */}
          <div style={{
            textAlign: 'center', padding: '20px 0 16px',
            borderBottom: c.cardBorder, marginBottom: 16,
          }}>
            {daysLeft === null ? (
              <p style={{ color: c.muted, fontSize: 13 }}>Invalid date</p>
            ) : daysLeft < 0 ? (
              <p style={{ color: '#ef4444', fontSize: 15, fontWeight: 700 }}>Interview date passed</p>
            ) : daysLeft === 0 ? (
              <p style={{ color: '#f59e0b', fontSize: 20, fontWeight: 900 }}>🎯 Interview Day!</p>
            ) : (
              <>
                <div style={{
                  fontSize: 56, fontWeight: 900, lineHeight: 1,
                  color: urgencyColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: `0 0 40px ${urgencyColor}40`,
                }}>
                  {daysLeft}
                </div>
                <div style={{ fontSize: 13, color: c.muted, fontWeight: 600, marginTop: 4 }}>
                  days until {data.company || 'interview'}{data.role ? ` · ${data.role}` : ''}
                </div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                  {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </>
            )}
          </div>

          {/* Daily prep checklist */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Today's Prep
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DAILY_TASKS.map(task => {
                const done = checkedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: done ? `${task.color}0d` : c.cardBg,
                      border: done ? `1px solid ${task.color}25` : c.cardBorder,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: done ? task.color : 'transparent',
                      border: `2px solid ${done ? task.color : c.muted}`,
                      display: 'grid', placeItems: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {done && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{
                      flex: 1, fontSize: 12, fontWeight: 600,
                      color: done ? c.muted : c.text,
                      textDecoration: done ? 'line-through' : 'none',
                    }}>
                      {task.label}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(task.path); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: done ? task.color : c.muted, padding: 2,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            {completedToday > 0 && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(completedToday / totalTasks) * 100}%`,
                    background: urgencyColor,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: urgencyColor }}>
                  {completedToday === totalTasks ? '🎉 All done!' : `${completedToday}/${totalTasks}`}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
