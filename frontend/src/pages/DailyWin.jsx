import React, { useState, useEffect } from 'react';
import { Star, Plus, Clock, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const TOPIC_COLORS = {
  DSA: '#6366f1', 'System Design': '#f59e0b', Behavioral: '#22c55e',
  SQL: '#06b6d4', Frontend: '#a855f7', Backend: '#f97316',
  Resume: '#ec4899', 'Mock Interview': '#ef4444', Other: '#94a3b8',
};

const MINUTE_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function DailyWin() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [topics, setTopics] = useState([]);
  const [todayWins, setTodayWins] = useState([]);
  const [recent, setRecent] = useState([]);
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  const load = async () => {
    const [t, today, rec] = await Promise.all([
      apiFetch.get('/api/daily-win/topics').catch(() => ({ topics: [] })),
      apiFetch.get('/api/daily-win/today').catch(() => ({ wins: [] })),
      apiFetch.get('/api/daily-win/recent').catch(() => ({ wins: [] })),
    ]);
    setTopics(t.topics || []);
    setTodayWins(today.wins || []);
    setRecent(rec.wins || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      await apiFetch.post('/api/daily-win', { topic, note, minutes });
      setSaved(true);
      setNote('');
      setTopic('');
      await load();
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const totalMinutesToday = todayWins.reduce((s, w) => s + (w.minutes || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'grid', placeItems: 'center' }}>
            <Star size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Today's Win</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Log what you practiced today — takes 30 seconds</p>
          </div>
        </div>

        {/* Today summary */}
        {todayWins.length > 0 && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={20} color="#22c55e" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                {todayWins.length} win{todayWins.length > 1 ? 's' : ''} logged today · {totalMinutesToday} min total
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: muted }}>
                {todayWins.map(w => w.topic).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Log form */}
        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 12 }}>WHAT DID YOU PRACTICE?</p>

          {/* Topic grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {topics.map(t => {
              const color = TOPIC_COLORS[t] || '#94a3b8';
              const isSelected = topic === t;
              return (
                <button key={t} onClick={() => setTopic(isSelected ? '' : t)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: isSelected ? `2px solid ${color}` : border, background: isSelected ? `${color}18` : card, color: isSelected ? color : muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {t}
                </button>
              );
            })}
          </div>

          {/* Time spent */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>TIME SPENT</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {MINUTE_OPTIONS.map(m => (
              <button key={m} onClick={() => setMinutes(m)}
                style={{ padding: '6px 14px', borderRadius: 10, border: minutes === m ? '2px solid #6366f1' : border, background: minutes === m ? 'rgba(99,102,241,0.12)' : card, color: minutes === m ? '#818cf8' : muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {m}m
              </button>
            ))}
          </div>

          {/* Optional note */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 6 }}>QUICK NOTE <span style={{ fontWeight: 400 }}>(optional)</span></p>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Solved 2 graph problems, reviewed BFS..."
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 13, boxSizing: 'border-box', marginBottom: 16 }} />

          <button onClick={submit} disabled={!topic || loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: topic ? 'linear-gradient(135deg,#f59e0b,#f97316)' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'), color: topic ? 'white' : muted, border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 700, cursor: topic ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {saved ? <><CheckCircle size={18} /> Win Logged!</> : loading ? 'Saving...' : <><Plus size={18} /> Log Today's Win</>}
          </button>
        </div>

        {/* Recent wins */}
        {recent.length > 0 && (
          <div style={{ background: card, border, borderRadius: 20, padding: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 16 }}>RECENT WINS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.slice(0, 15).map(w => {
                const color = TOPIC_COLORS[w.topic] || '#94a3b8';
                return (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{w.topic}</span>
                      {w.note && <span style={{ fontSize: 12, color: muted, marginLeft: 8 }}>{w.note}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: muted }}>
                      <Clock size={11} /> {w.minutes}m · {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
