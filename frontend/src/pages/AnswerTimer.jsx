import React, { useState, useEffect, useRef } from 'react';
import { Timer, RefreshCw, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const TYPE_COLORS = { dsa: '#6366f1', behavioral: '#22c55e', 'system-design': '#f59e0b', 'concept-explain': '#06b6d4', hr: '#a855f7' };
const TYPE_LABELS = { dsa: 'DSA', behavioral: 'Behavioral', 'system-design': 'System Design', 'concept-explain': 'Concept Explain', hr: 'HR' };

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function RadialTimer({ remaining, total, color }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 1;
  const dash = progress * circ;
  const isLow = remaining <= 30 && remaining > 0;
  return (
    <svg width={180} height={180}>
      <circle cx={90} cy={90} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle cx={90} cy={90} r={r} fill="none" stroke={isLow ? '#ef4444' : color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 90 90)" style={{ transition: 'stroke-dasharray 1s linear' }} />
      <text x={90} y={84} textAnchor="middle" fill={isLow ? '#ef4444' : 'white'} fontSize={32} fontWeight={800} fontFamily="monospace">
        {formatTime(remaining)}
      </text>
      <text x={90} y={106} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={12} fontWeight={600}>remaining</text>
    </svg>
  );
}

export default function AnswerTimer() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [qType, setQType] = useState('dsa');
  const [question, setQuestion] = useState(null);
  const [config, setConfig] = useState(null);
  const [types, setTypes] = useState([]);
  const [phase, setPhase] = useState('setup'); // setup | active | done
  const [remaining, setRemaining] = useState(0);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  const loadQuestion = async (type) => {
    try {
      const data = await apiFetch.get(`/api/answer-timer/question?type=${type}`);
      setQuestion(data);
      setConfig(data);
      setTypes(data.types || []);
    } catch { /* ignore */ }
  };

  const loadStats = async () => {
    try { const d = await apiFetch.get('/api/answer-timer/stats'); setStats(d); } catch { /* ignore */ }
  };

  useEffect(() => { loadQuestion(qType); loadStats(); }, []);

  const start = () => {
    if (!config) return;
    setRemaining(config.seconds);
    startTimeRef.current = Date.now();
    setPhase('active');
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setPhase('done');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const finish = (completed) => {
    clearInterval(intervalRef.current);
    const timeTaken = config.seconds - remaining;
    apiFetch.post('/api/answer-timer/complete', { type: qType, question: question?.question, timeTaken, completed }).catch(() => {});
    setPhase('done');
    loadStats();
  };

  const next = async () => {
    clearInterval(intervalRef.current);
    setPhase('setup');
    await loadQuestion(qType);
  };

  const switchType = async (t) => {
    clearInterval(intervalRef.current);
    setQType(t);
    setPhase('setup');
    await loadQuestion(t);
  };

  const color = TYPE_COLORS[qType] || '#6366f1';
  const pct = config ? Math.round((remaining / config.seconds) * 100) : 100;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${color},#6366f1)`, display: 'grid', placeItems: 'center' }}>
            <Timer size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Answer Timer</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Train yourself to answer within real interview time limits</p>
          </div>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(types.length ? types : Object.keys(TYPE_LABELS)).map(t => (
            <button key={t} onClick={() => switchType(t)}
              style={{ padding: '8px 16px', borderRadius: 10, border: qType === t ? `2px solid ${TYPE_COLORS[t] || '#6366f1'}` : border, background: qType === t ? `${TYPE_COLORS[t] || '#6366f1'}18` : card, color: qType === t ? (TYPE_COLORS[t] || '#6366f1') : muted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {TYPE_LABELS[t] || t} {config && qType === t ? `· ${config.label}` : ''}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Attempts', value: stats.total },
              { label: 'In Time', value: stats.completed },
              { label: 'Success Rate', value: `${stats.rate}%` },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: card, border, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: muted, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main card */}
        <div style={{ background: card, border, borderRadius: 24, padding: 32, textAlign: 'center' }}>
          {question && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: `${color}18`, color, fontWeight: 700 }}>
                {TYPE_LABELS[qType]} · {config?.label}
              </span>
              <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6, margin: '16px 0 0' }}>{question.question}</p>
              {config?.description && <p style={{ fontSize: 12, color: muted, margin: '6px 0 0' }}>{config.description}</p>}
            </div>
          )}

          {phase === 'setup' && (
            <button onClick={start} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${color},#6366f1)`, color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              <Timer size={18} /> Start Timer
            </button>
          )}

          {phase === 'active' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <RadialTimer remaining={remaining} total={config?.seconds || 1} color={color} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => finish(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <CheckCircle size={16} /> Done Early
                </button>
                <button onClick={() => finish(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <XCircle size={16} /> Give Up
                </button>
              </div>
            </>
          )}

          {phase === 'done' && (
            <>
              <div style={{ marginBottom: 20 }}>
                {remaining > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={48} color="#22c55e" />
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', margin: 0 }}>Finished with {formatTime(remaining)} to spare!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <XCircle size={48} color="#ef4444" />
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', margin: 0 }}>Time's up! Keep practicing.</p>
                  </div>
                )}
              </div>
              <button onClick={next} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${color},#6366f1)`, color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <RefreshCw size={16} /> Next Question
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
