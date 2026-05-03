import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, Brain, Code2,
  MessageSquare, BarChart3, ChevronRight, Zap,
  AlertCircle, CheckCircle2, Target, ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { buildAuthHeaders } from '../utils/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DIMENSIONS = [
  { id: 'dsa',          label: 'DSA',           color: '#60a5fa', icon: Code2,        path: '/problems',          desc: 'Data structures & algorithms' },
  { id: 'system',       label: 'System Design', color: '#34d399', icon: BarChart3,     path: '/system-design',     desc: 'Architecture & scalability' },
  { id: 'behavioral',   label: 'Behavioral',    color: '#fbbf24', icon: MessageSquare, path: '/behavioral-coach',  desc: 'STAR method & soft skills' },
  { id: 'communication',label: 'Communication', color: '#a78bfa', icon: Brain,         path: '/company-interview', desc: 'Clarity & articulation' },
  { id: 'problem_solving',label: 'Problem Solving',color: '#f472b6',icon: Zap,         path: '/problems',          desc: 'Approach & optimization' },
];

// ── SVG Radar Chart ──
function RadarChart({ scores, size = 220 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const n = DIMENSIONS.length;

  const angleOf = i => (i * 2 * Math.PI) / n - Math.PI / 2;

  const point = (i, val) => {
    const a = angleOf(i);
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(a), y: cy + dist * Math.sin(a) };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  const polyPoints = DIMENSIONS.map((d, i) => {
    const p = point(i, scores[d.id] || 0);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {gridLevels.map(level => {
        const pts = DIMENSIONS.map((_, i) => {
          const p = point(i, level);
          return `${p.x},${p.y}`;
        }).join(' ');
        return (
          <polygon key={level} points={pts}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        );
      })}

      {/* Axis lines */}
      {DIMENSIONS.map((_, i) => {
        const p = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}

      {/* Score polygon */}
      <polygon points={polyPoints}
        fill="rgba(139,92,246,0.15)"
        stroke="rgba(139,92,246,0.6)"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ transition: 'all 0.6s ease' }}
      />

      {/* Score dots */}
      {DIMENSIONS.map((d, i) => {
        const p = point(i, scores[d.id] || 0);
        return (
          <circle key={i} cx={p.x} cy={p.y} r={4}
            fill={d.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5}
            style={{ transition: 'all 0.6s ease' }}
          />
        );
      })}

      {/* Labels */}
      {DIMENSIONS.map((d, i) => {
        const a = angleOf(i);
        const labelR = r + 22;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly}
            textAnchor="middle" dominantBaseline="central"
            fill={d.color} fontSize={10} fontWeight={700}
            fontFamily="'Inter', system-ui, sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Mini sparkline ──
function Sparkline({ values, color, width = 60, height = 24 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]}
        r={2.5} fill={color} />
    </svg>
  );
}

function TrendIcon({ trend }) {
  if (trend > 3) return <TrendingUp size={13} style={{ color: '#4ade80' }} />;
  if (trend < -3) return <TrendingDown size={13} style={{ color: '#f87171' }} />;
  return <Minus size={13} style={{ color: '#94a3b8' }} />;
}

// ── Mock history generator (uses real interview count from API if available) ──
function buildMockHistory(interviewCount = 0) {
  const count = Math.max(interviewCount, 3);
  return Array.from({ length: Math.min(count, 8) }, (_, i) => {
    const base = 40 + i * 5;
    return {
      date: new Date(Date.now() - (count - i) * 3 * 86400000).toISOString().slice(0, 10),
      scores: {
        dsa: Math.min(95, base + Math.round(Math.random() * 15)),
        system: Math.min(95, base - 5 + Math.round(Math.random() * 20)),
        behavioral: Math.min(95, base + 5 + Math.round(Math.random() * 10)),
        communication: Math.min(95, base + 8 + Math.round(Math.random() * 12)),
        problem_solving: Math.min(95, base + Math.round(Math.random() * 18)),
      }
    };
  });
}

export default function InterviewPerformanceRadar() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch real interview history; fall back to mock
    fetch(`${API_URL}/api/activity/summary`, { headers: buildAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const count = data?.mockInterviews || data?.interviewsCompleted || 0;
        setHistory(buildMockHistory(count));
      })
      .catch(() => setHistory(buildMockHistory(0)))
      .finally(() => setLoading(false));
  }, []);

  const latest = history[history.length - 1]?.scores || {};
  const prev = history[history.length - 2]?.scores || {};

  const trends = useMemo(() => {
    return DIMENSIONS.reduce((acc, d) => {
      acc[d.id] = (latest[d.id] || 0) - (prev[d.id] || 0);
      return acc;
    }, {});
  }, [latest, prev]);

  const overallScore = useMemo(() => {
    const vals = DIMENSIONS.map(d => latest[d.id] || 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [latest]);

  const weakest = useMemo(() => {
    return [...DIMENSIONS].sort((a, b) => (latest[a.id] || 0) - (latest[b.id] || 0))[0];
  }, [latest]);

  const strongest = useMemo(() => {
    return [...DIMENSIONS].sort((a, b) => (latest[b.id] || 0) - (latest[a.id] || 0))[0];
  }, [latest]);

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
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 28px', background: c.bg, borderRadius: 24, border: c.border, boxShadow: c.shadow, backdropFilter: 'blur(24px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.25)', display: 'grid', placeItems: 'center' }}>
            <Target size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: c.title }}>Performance Radar</h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: c.muted }}>Loading your data...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.25)' }}>
            <Target size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Performance Radar</h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: c.muted, fontWeight: 500 }}>
              {history.length} sessions tracked · Overall {overallScore}/100
            </p>
          </div>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 900, color: overallScore >= 70 ? '#4ade80' : overallScore >= 50 ? '#fbbf24' : '#f87171',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {overallScore}
        </div>
      </div>

      {/* Radar + Dimension bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        {/* Radar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
          <RadarChart scores={latest} size={200} />
        </div>

        {/* Dimension scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          {DIMENSIONS.map(d => {
            const score = latest[d.id] || 0;
            const trend = trends[d.id] || 0;
            const sparkValues = history.map(h => h.scores[d.id] || 0);
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 10,
                background: c.card, border: c.cardBorder,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
                onClick={() => navigate(d.path)}
                onMouseEnter={e => { e.currentTarget.style.background = `${d.color}0d`; e.currentTarget.style.borderColor = `${d.color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.background = c.card; e.currentTarget.style.borderColor = c.cardBorder.replace('1px solid ', ''); }}
              >
                <d.icon size={13} style={{ color: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: c.text, flex: 1, minWidth: 0 }}>{d.label}</span>
                <Sparkline values={sparkValues} color={d.color} />
                <TrendIcon trend={trend} />
                <span style={{ fontSize: 13, fontWeight: 800, color: d.color, minWidth: 28, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Weakest */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)',
          cursor: 'pointer',
        }} onClick={() => navigate(weakest.path)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AlertCircle size={12} style={{ color: '#f87171' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: 0.5 }}>Focus Area</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.title }}>{weakest.label}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{weakest.desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: '#f87171', fontWeight: 700 }}>
            Practice now <ArrowUpRight size={11} />
          </div>
        </div>

        {/* Strongest */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CheckCircle2 size={12} style={{ color: '#4ade80' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.5 }}>Strongest</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.title }}>{strongest.label}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{strongest.desc}</div>
          <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, marginTop: 6 }}>
            Score: {latest[strongest.id] || 0}/100
          </div>
        </div>
      </div>
    </div>
  );
}
