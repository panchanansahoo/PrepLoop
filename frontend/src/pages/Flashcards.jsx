import React, { useState, useEffect } from 'react';
import { Brain, RotateCcw, ChevronRight, BarChart2, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const QUALITY_LABELS = [
  { q: 0, label: 'Blackout', color: '#ef4444' },
  { q: 2, label: 'Hard', color: '#f97316' },
  { q: 3, label: 'Good', color: '#eab308' },
  { q: 4, label: 'Easy', color: '#22c55e' },
  { q: 5, label: 'Perfect', color: '#6366f1' },
];

export default function Flashcards() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [data, setData] = useState(null);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('review'); // 'review' | 'stats'

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  useEffect(() => {
    apiFetch.get('/api/flashcards').then(d => {
      setData(d);
      setQueue(d.due || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const submitReview = async (quality) => {
    if (submitting) return;
    setSubmitting(true);
    const card = queue[current];
    try {
      await apiFetch.post('/api/flashcards/review', { cardId: card.id, quality });
    } catch { /* non-blocking */ }
    setSubmitting(false);
    setFlipped(false);
    if (current + 1 >= queue.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
    }
  };

  const restart = () => {
    setCurrent(0);
    setFlipped(false);
    setDone(false);
    setQueue(data?.due || []);
  };

  const topicColor = t => ({ complexity: '#6366f1', patterns: '#a855f7', 'data-structures': '#06b6d4', 'dynamic-programming': '#f59e0b', graphs: '#22c55e', 'system-design': '#f97316' }[t] || '#6366f1');

  if (loading) return <div style={{ minHeight: '100vh', background: bg, display: 'grid', placeItems: 'center', color: text }}>Loading flashcards...</div>;

  const currentCard = queue[current];
  const stats = data?.stats;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'grid', placeItems: 'center' }}>
              <Brain size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Flashcards</h1>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>Spaced repetition · SM-2 algorithm</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['review', 'stats'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 10, border, background: tab === t ? 'linear-gradient(135deg,#6366f1,#a855f7)' : card, color: tab === t ? 'white' : text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {t === 'review' ? 'Review' : 'Stats'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'stats' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
            {[
              { label: 'Total Cards', value: stats.total, icon: <Brain size={18} />, color: '#6366f1' },
              { label: 'Due Today', value: stats.dueToday, icon: <Clock size={18} />, color: '#f59e0b' },
              { label: 'Mastered', value: stats.retention?.mastered || 0, icon: <CheckCircle size={18} />, color: '#22c55e' },
              { label: 'Retention %', value: `${stats.retention?.rate || 0}%`, icon: <BarChart2 size={18} />, color: '#a855f7' },
            ].map(s => (
              <div key={s.label} style={{ background: card, border, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: muted, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'review' && (
          <>
            {queue.length === 0 && (
              <div style={{ background: card, border, borderRadius: 20, padding: 48, textAlign: 'center' }}>
                <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>All caught up!</h2>
                <p style={{ color: muted, margin: 0 }}>No cards due for review right now. Check back tomorrow.</p>
              </div>
            )}

            {queue.length > 0 && !done && currentCard && (
              <>
                {/* Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: muted, fontWeight: 600 }}>{current + 1} / {queue.length} cards</span>
                  <div style={{ height: 6, flex: 1, margin: '0 16px', background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${((current) / queue.length) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${topicColor(currentCard.topic)}22`, color: topicColor(currentCard.topic), fontWeight: 700 }}>{currentCard.topic}</span>
                </div>

                {/* Card */}
                <div
                  onClick={() => setFlipped(f => !f)}
                  style={{ background: card, border, borderRadius: 24, padding: 48, textAlign: 'center', cursor: 'pointer', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, transition: 'transform 0.2s', userSelect: 'none' }}
                >
                  {!flipped ? (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: 1 }}>QUESTION — tap to reveal</p>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>{currentCard.front}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: 1 }}>ANSWER</p>
                      <p style={{ fontSize: 16, margin: 0, lineHeight: 1.7, color: muted }}>{currentCard.back}</p>
                    </>
                  )}
                </div>

                {/* Rating buttons */}
                {flipped && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <p style={{ width: '100%', textAlign: 'center', fontSize: 12, color: muted, fontWeight: 600, margin: '0 0 8px' }}>How well did you know this?</p>
                    {QUALITY_LABELS.map(({ q, label, color }) => (
                      <button key={q} onClick={() => submitReview(q)} disabled={submitting}
                        style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid ${color}44`, background: `${color}18`, color, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {!flipped && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <p style={{ fontSize: 12, color: muted }}>Tap the card to reveal the answer</p>
                  </div>
                )}
              </>
            )}

            {done && (
              <div style={{ background: card, border, borderRadius: 20, padding: 48, textAlign: 'center' }}>
                <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
                <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>Session complete!</h2>
                <p style={{ color: muted, margin: '0 0 24px' }}>You reviewed {queue.length} cards. Great work!</p>
                <button onClick={restart} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <RotateCcw size={16} /> Review Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
