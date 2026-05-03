import { useState, useEffect } from 'react';
import { Flame, X, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const DISMISS_KEY = 'preploop_streak_banner_dismissed';

const MESSAGES = [
  { min: 3,  max: 6,  emoji: '🔥', text: 'You\'re on a {n}-day streak!', sub: 'Keep the momentum going.', cta: 'Solve a problem', path: '/problems' },
  { min: 7,  max: 13, emoji: '⚡', text: '{n}-day streak — you\'re unstoppable!', sub: 'One week of consistency. Keep pushing.', cta: 'Mock interview', path: '/company-interview' },
  { min: 14, max: 29, emoji: '🚀', text: '{n} days straight — elite level!', sub: 'You\'re in the top 5% of consistent learners.', cta: 'Check your progress', path: '/skill-heatmap' },
  { min: 30, max: Infinity, emoji: '👑', text: '{n}-day legend streak!', sub: 'Incredible dedication. You\'re interview-ready.', cta: 'View your stats', path: '/dashboard/analytics' },
];

function getMessage(streak) {
  return MESSAGES.find(m => streak >= m.min && streak <= m.max) || null;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function StreakMotivationBanner({ streak = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (streak < 3) return;
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || 'null');
      if (dismissed?.date === getTodayKey() && dismissed?.streak === streak) return;
    } catch { /* ignore */ }
    setVisible(true);
  }, [streak]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ date: getTodayKey(), streak }));
  };

  if (!visible || streak < 3) return null;

  const msg = getMessage(streak);
  if (!msg) return null;

  const text = msg.text.replace('{n}', streak);

  // Color gradient based on streak length
  const gradient = streak >= 30
    ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))'
    : streak >= 14
    ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))'
    : streak >= 7
    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(34,211,238,0.08))'
    : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.08))';

  const borderColor = streak >= 30
    ? 'rgba(251,191,36,0.2)'
    : streak >= 14
    ? 'rgba(139,92,246,0.2)'
    : streak >= 7
    ? 'rgba(59,130,246,0.2)'
    : 'rgba(239,68,68,0.18)';

  const accentColor = streak >= 30 ? '#fbbf24' : streak >= 14 ? '#a78bfa' : streak >= 7 ? '#60a5fa' : '#f87171';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 18px', borderRadius: 14, marginBottom: 20,
      background: gradient,
      border: `1px solid ${borderColor}`,
      animation: 'sbSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Shimmer */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent 0%, ${accentColor}08 50%, transparent 100%)`,
        backgroundSize: '200% 100%',
        animation: 'sbShimmer 4s ease infinite',
      }} />

      {/* Emoji */}
      <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{msg.emoji}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
          {text}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
          {msg.sub}
        </div>
      </div>

      {/* CTA */}
      <Link
        to={msg.path}
        onClick={dismiss}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', borderRadius: 8, flexShrink: 0,
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}35`,
          color: accentColor, fontSize: 12, fontWeight: 700,
          textDecoration: 'none', transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}30`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${accentColor}20`; }}
      >
        {msg.cta} <ArrowRight size={12} />
      </Link>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center', flexShrink: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        title="Dismiss"
      >
        <X size={15} />
      </button>

      <style>{`
        @keyframes sbSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sbShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
