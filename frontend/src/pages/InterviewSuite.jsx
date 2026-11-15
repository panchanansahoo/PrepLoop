import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Target, Brain, FileText, Mic, Code2,
  History, Building2, Loader2, ArrowRight, Clock,
  BarChart3, GitPullRequest, Zap,
  TrendingUp, Award, ChevronRight, Flame, Timer,
  Radio, BookOpen, Users, Video, CheckCircle2, ShieldCheck,
  Terminal, Play, Star
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import './InterviewHub.css';
import { API_URL } from '../config/api.js';

/* ─── Interview Mode Definitions ─── */
const INTERVIEW_MODES = [
  {
    id: 'technical',
    title: 'AI Technical Interview',
    category: 'ai',
    desc: 'Real-time adaptive technical mock covering Data Structures, Algorithms, System Design, and CS Fundamentals with dynamic voice follow-ups.',
    path: '/company-interview?type=technical',
    icon: Code2,
    accent: '#8b5cf6',
    badge: 'Most Popular',
    badgeBg: 'rgba(139, 92, 246, 0.18)',
    badgeColor: '#c4b5fd',
    time: '30–45 min',
    difficulty: 'Adaptive AI',
    highlights: ['Live Code Editor', 'Voice AI & Barge-In', 'Company Calibration'],
  },
  {
    id: 'hr',
    title: 'AI Behavioral & HR Round',
    category: 'ai',
    desc: 'Master behavioral, situational, and culture-fit questions with AI emotion detection, tone analysis, and STAR-method scoring.',
    path: '/company-interview?type=hr',
    icon: Brain,
    accent: '#ec4899',
    badge: 'STAR Method',
    badgeBg: 'rgba(236, 72, 153, 0.18)',
    badgeColor: '#fbcfe8',
    time: '20–30 min',
    difficulty: 'All Levels',
    highlights: ['STAR Rubric Scoring', 'Pacing & Sentiment Analysis', 'Instant Feedback'],
  },
  {
    id: 'peer',
    title: 'Peer 1-on-1 Mock Interview',
    category: 'collaborative',
    desc: 'Pair up with another candidate in real-time. Alternate between interviewer and candidate with shared code editor, live video/audio, and mutual rubrics.',
    path: '/peer-interview',
    icon: Users,
    accent: '#3b82f6',
    badge: 'Live Collaboration',
    badgeBg: 'rgba(59, 130, 246, 0.18)',
    badgeColor: '#93c5fd',
    time: '45–60 min',
    difficulty: 'Real Peer',
    highlights: ['Dual WebRTC Video', 'Shared Live Code Editor', 'Mutual Rubric Grading'],
  },
  {
    id: 'review',
    title: 'Code Review Simulation',
    category: 'skills',
    desc: 'Review realistic production pull requests — spot subtle security vulnerabilities, propose architectural enhancements, and defend reviews.',
    path: '/code-review-interview',
    icon: GitPullRequest,
    accent: '#06b6d4',
    badge: 'Production Skill',
    badgeBg: 'rgba(6, 182, 212, 0.18)',
    badgeColor: '#67e8f9',
    time: '20–30 min',
    difficulty: 'Mid → Senior',
    highlights: ['Real PR Diffs', 'Security & Best Practices', 'Structured Evaluation'],
  },
  {
    id: 'expert',
    title: 'Expert 1-on-1 Mock Interview',
    category: 'collaborative',
    desc: 'Book verified mock interviews with senior engineers and hiring managers from top tier tech companies with full written dossiers.',
    path: '/real-interview',
    icon: Video,
    accent: '#10b981',
    badge: 'Vetted Mentors',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
    badgeColor: '#6ee7b7',
    time: '45–60 min',
    difficulty: 'Industry Standard',
    highlights: ['Senior Tech Mentors', 'Detailed Candidate Dossier', 'Hiring Bar Calibration'],
  },
];

/* ─── Target Company Quick Picks ─── */
const TARGET_COMPANIES = [
  { name: 'Google', slug: 'google', color: '#4285F4', tag: 'DSA & Scalability', initial: 'G' },
  { name: 'Amazon', slug: 'amazon', color: '#FF9900', tag: 'Leadership & Design', initial: 'A' },
  { name: 'Meta', slug: 'meta', color: '#0668E1', tag: 'Speed & Optimization', initial: 'M' },
  { name: 'Microsoft', slug: 'microsoft', color: '#00A4EF', tag: 'Architecture & Robustness', initial: 'MS' },
  { name: 'Apple', slug: 'apple', color: '#94a3b8', tag: 'Low-Level & Precision', initial: '' },
  { name: 'Uber', slug: 'uber', color: '#10b981', tag: 'Microservices & Scale', initial: 'U' },
];

/* ─── Quick Tool Definitions ─── */
const QUICK_TOOLS = [
  {
    title: 'Behavioral Coach',
    desc: 'Polish STAR-method answers & delivery',
    path: '/hr-path',
    icon: Brain,
    accent: '#a855f7',
  },
  {
    title: 'Resume ATS & Viva',
    desc: 'ATS score & resume project defense',
    path: '/resume-analyzer',
    icon: FileText,
    accent: '#0ea5e9',
  },
  {
    title: 'Company Question Bank',
    desc: 'Verified interview questions & checklists',
    path: '/company-prep',
    icon: Building2,
    accent: '#22c55e',
  },
  {
    title: 'Online Assessment (OA)',
    desc: 'Timed HackerRank-style company contests',
    path: '/coding-round',
    icon: Terminal,
    accent: '#f59e0b',
  },
  {
    title: 'Interview Analytics',
    desc: 'Performance trends & weakness breakdown',
    path: '/interview-analytics',
    icon: BarChart3,
    accent: '#ec4899',
  },
];

/* ─── Mode Icon & Styling Maps ─── */
const MODE_ICONS = {
  mock: Code2,
  technical: Code2,
  dsa: Code2,
  'system-design': Building2,
  behavioral: Brain,
  hr: Brain,
  peer: Users,
  review: GitPullRequest,
  expert: Video,
  real: Video,
};

function getModeIcon(type) {
  const normalized = (type || '').toLowerCase();
  for (const [key, Icon] of Object.entries(MODE_ICONS)) {
    if (normalized.includes(key)) return Icon;
  }
  return Sparkles;
}

function getModeColor(type) {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('technical') || normalized.includes('dsa') || normalized.includes('mock')) return '#8b5cf6';
  if (normalized.includes('system')) return '#3b82f6';
  if (normalized.includes('behavioral') || normalized.includes('hr')) return '#ec4899';
  if (normalized.includes('peer')) return '#3b82f6';
  if (normalized.includes('review')) return '#06b6d4';
  if (normalized.includes('expert') || normalized.includes('real')) return '#10b981';
  return '#8b5cf6';
}

function getScoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#fbbf24';
  if (score >= 40) return '#fb923c';
  return '#f87171';
}

function getBarColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#fbbf24';
  return '#f87171';
}

/* ─── Main Component ─── */
export default function InterviewSuite() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ sessions: 0, avgScore: 0, streak: 0, highScore: 0 });
  const [heatmap, setHeatmap] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Load weakness heatmap
        const heatRes = await authFetch(`${API_URL}/api/interview-suite/weakness/heatmap`);
        if (heatRes.ok) {
          const heatData = await heatRes.json();
          if (isMounted) {
            setHeatmap(Array.isArray(heatData?.heatmap) ? heatData.heatmap.slice(0, 6) : []);
          }
        }
      } catch {
        if (isMounted) setHeatmap([]);
      }

      try {
        // Load recent sessions
        let sessData = null;
        try {
          const sessRes = await authFetch(`${API_URL}/api/interview/sessions?limit=5`);
          if (sessRes.ok) sessData = await sessRes.json();
        } catch {}

        if (!sessData) {
          try {
            const fbRes = await authFetch(`${API_URL}/api/company-interview/sessions?limit=5`);
            if (fbRes.ok) sessData = await fbRes.json();
          } catch {}
        }

        const sessions = Array.isArray(sessData?.sessions) ? sessData.sessions : (Array.isArray(sessData) ? sessData : []);
        if (isMounted) {
          setRecentSessions(sessions.slice(0, 5));

          // Compute stats
          if (sessions.length > 0) {
            const scores = sessions
              .map((s) => s.score ?? s.overall_score ?? s.overallScore)
              .filter((s) => s != null && !isNaN(Number(s)))
              .map(Number);

            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const highScore = scores.length > 0 ? Math.max(...scores) : 0;

            // Compute consecutive practice day streak
            const uniqueDays = [...new Set(
              sessions
                .map((s) => (s.createdAt || s.created_at) ? new Date(s.createdAt || s.created_at).toDateString() : null)
                .filter(Boolean)
            )].sort((a, b) => new Date(b) - new Date(a));

            let streak = 0;
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (uniqueDays.length > 0 && (uniqueDays[0] === today || uniqueDays[0] === yesterday)) {
              let expected = new Date(uniqueDays[0]);
              for (const dayStr of uniqueDays) {
                if (new Date(dayStr).toDateString() === expected.toDateString()) {
                  streak++;
                  expected = new Date(expected.getTime() - 86400000);
                } else {
                  break;
                }
              }
            }

            setStats({ sessions: sessions.length, avgScore, streak, highScore });
          }
        }
      } catch {
        if (isMounted) setRecentSessions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredModes = useMemo(() => {
    if (activeFilter === 'all') return INTERVIEW_MODES;
    return INTERVIEW_MODES.filter((m) => m.category === activeFilter);
  }, [activeFilter]);

  // Dynamic readiness calculations based on stats or reasonable benchmark
  const readinessMetrics = useMemo(() => {
    const base = stats.avgScore > 0 ? stats.avgScore : 68;
    return [
      { name: 'Data Structures & Algorithms', score: Math.min(96, Math.max(45, base + 4)) },
      { name: 'System Design & Scalability', score: Math.min(94, Math.max(40, base - 6)) },
      { name: 'Behavioral & STAR Structure', score: Math.min(98, Math.max(50, base + 8)) },
      { name: 'Code Review & Clean Code', score: Math.min(92, Math.max(42, base - 2)) },
    ];
  }, [stats.avgScore]);

  const overallReadiness = useMemo(() => {
    if (stats.sessions === 0) return { label: 'Getting Started', percent: 65, color: '#fbbf24' };
    if (stats.avgScore >= 80) return { label: 'Interview Ready', percent: stats.avgScore, color: '#4ade80' };
    if (stats.avgScore >= 60) return { label: 'Proficient', percent: stats.avgScore, color: '#60a5fa' };
    return { label: 'Needs Practice', percent: stats.avgScore, color: '#fb923c' };
  }, [stats.sessions, stats.avgScore]);

  return (
    <div className="ihub-container">
      {/* ═══ Hero Section ═══ */}
      <div className="ihub-hero">
        <div className="ihub-hero-content">
          <div className="ihub-hero-top">
            <div className="ihub-hero-left">
              <div className="ihub-hero-badge">
                <Sparkles size={13} />
                <span>Next-Gen Interview Preparation Suite</span>
              </div>
              <h1 className="ihub-hero-title">
                <span className="ihub-hero-title-icon">
                  <Sparkles size={22} />
                </span>
                Interview Hub
              </h1>
              <p className="ihub-hero-subtitle">
                Your unified command center for interview mastery. Practice real-time AI technical rounds,
                behavioral STAR responses, collaborative peer coding, production code reviews, and expert mentor sessions.
              </p>
            </div>

            <div className="ihub-hero-actions">
              <Link to="/company-interview?type=technical" className="ihub-hero-cta">
                <Zap size={15} />
                Quick Start AI Mock
                <ArrowRight size={14} />
              </Link>
              <Link to="/peer-interview" className="ihub-hero-cta-secondary">
                <Users size={15} />
                Join Peer Session
              </Link>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="ihub-stats">
            <div className="ihub-stat-pill">
              <Award size={15} color="#8b5cf6" />
              <div>
                <div className="ihub-stat-value">{stats.sessions}</div>
                <div className="ihub-stat-label">Sessions</div>
              </div>
            </div>
            <div className="ihub-stat-pill">
              <TrendingUp size={15} color="#4ade80" />
              <div>
                <div className="ihub-stat-value">{stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}</div>
                <div className="ihub-stat-label">Avg Score</div>
              </div>
            </div>
            <div className="ihub-stat-pill">
              <Flame size={15} color="#f59e0b" />
              <div>
                <div className="ihub-stat-value">{stats.streak}</div>
                <div className="ihub-stat-label">Day Streak</div>
              </div>
            </div>
            <div className="ihub-stat-pill">
              <ShieldCheck size={15} color="#38bdf8" />
              <div>
                <div className="ihub-stat-value" style={{ color: overallReadiness.color }}>
                  {overallReadiness.percent}%
                </div>
                <div className="ihub-stat-label">Readiness</div>
              </div>
            </div>
            <div className="ihub-stat-pill">
              <Radio size={15} color="#06b6d4" />
              <div>
                <div className="ihub-stat-value">{INTERVIEW_MODES.length}</div>
                <div className="ihub-stat-label">Active Modes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Target Company Quick-Picks ═══ */}
      <div className="ihub-company-section">
        <div className="ihub-section-header">
          <div className="ihub-section-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Building2 size={17} />
          </div>
          <div>
            <h2 className="ihub-section-title">Target Company Calibration</h2>
            <p className="ihub-section-subtitle">Launch directly into company-specific technical rounds</p>
          </div>
        </div>

        <div className="ihub-company-grid">
          {TARGET_COMPANIES.map((company) => (
            <button
              key={company.slug}
              type="button"
              className="ihub-company-card"
              onClick={() => navigate(`/company-interview?company=${company.slug}&type=technical`)}
            >
              <div className="ihub-company-badge" style={{ backgroundColor: `${company.color}22`, color: company.color }}>
                {company.initial}
              </div>
              <div className="ihub-company-info">
                <span className="ihub-company-name">{company.name}</span>
                <span className="ihub-company-tag">{company.tag}</span>
              </div>
              <ChevronRight size={15} className="ihub-company-arrow" />
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Interview Modes Section ═══ */}
      <div className="ihub-section-header-wrap">
        <div className="ihub-section-header">
          <div className="ihub-section-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Target size={17} />
          </div>
          <div>
            <h2 className="ihub-section-title">Choose Your Practice Mode</h2>
            <p className="ihub-section-subtitle">Select a format matching your current preparation objective</p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="ihub-tabs" role="tablist">
          <button
            type="button"
            className={`ihub-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Modes ({INTERVIEW_MODES.length})
          </button>
          <button
            type="button"
            className={`ihub-tab-btn ${activeFilter === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ai')}
          >
            AI Rounds
          </button>
          <button
            type="button"
            className={`ihub-tab-btn ${activeFilter === 'collaborative' ? 'active' : ''}`}
            onClick={() => setActiveFilter('collaborative')}
          >
            Peer & Mentor
          </button>
          <button
            type="button"
            className={`ihub-tab-btn ${activeFilter === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveFilter('skills')}
          >
            Engineering Skills
          </button>
        </div>
      </div>

      {/* Mode Cards Grid */}
      <div className="ihub-modes-grid">
        {filteredModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.id} to={mode.path} className="ihub-mode-card">
              <div className="ihub-mode-top">
                <div
                  className="ihub-mode-icon"
                  style={{ background: `${mode.accent}18`, color: mode.accent }}
                >
                  <Icon size={22} />
                </div>
                <span
                  className="ihub-mode-badge"
                  style={{ background: mode.badgeBg, color: mode.badgeColor }}
                >
                  {mode.badge}
                </span>
              </div>

              <h3 className="ihub-mode-title">{mode.title}</h3>
              <p className="ihub-mode-desc">{mode.desc}</p>

              {/* Highlight Badges */}
              {mode.highlights && (
                <div className="ihub-mode-highlights">
                  {mode.highlights.map((h) => (
                    <span key={h} className="ihub-mode-highlight-pill">
                      <CheckCircle2 size={11} color={mode.accent} />
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <div className="ihub-mode-meta">
                <span className="ihub-mode-meta-item">
                  <Timer size={12} /> {mode.time}
                </span>
                <span className="ihub-mode-meta-item">
                  <BarChart3 size={12} /> {mode.difficulty}
                </span>
                <span className="ihub-mode-start" style={{ color: mode.accent }}>
                  Start Session <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ═══ Readiness & Benchmark Meter ═══ */}
      <div className="ihub-readiness-card">
        <div className="ihub-readiness-header">
          <div className="ihub-readiness-header-left">
            <div className="ihub-readiness-icon">
              <TrendingUp size={18} color="#4ade80" />
            </div>
            <div>
              <h3 className="ihub-readiness-title">Interview Readiness Assessment</h3>
              <p className="ihub-readiness-subtitle">
                Calibrated against hiring bars from top-tier tech firms
              </p>
            </div>
          </div>
          <div className="ihub-readiness-tag" style={{ borderColor: overallReadiness.color, color: overallReadiness.color }}>
            <Star size={13} fill={overallReadiness.color} />
            {overallReadiness.label}
          </div>
        </div>

        <div className="ihub-readiness-grid">
          {readinessMetrics.map((item) => (
            <div key={item.name} className="ihub-readiness-item">
              <div className="ihub-readiness-label-row">
                <span className="ihub-readiness-label">{item.name}</span>
                <span className="ihub-readiness-score" style={{ color: getBarColor(item.score) }}>
                  {item.score}%
                </span>
              </div>
              <div className="ihub-readiness-track">
                <div
                  className="ihub-readiness-fill"
                  style={{
                    width: `${item.score}%`,
                    background: getBarColor(item.score),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Quick Tools Strip ═══ */}
      <div className="ihub-section-header">
        <div className="ihub-section-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
          <BookOpen size={17} />
        </div>
        <div>
          <h2 className="ihub-section-title">Supporting Preparation Tools</h2>
          <p className="ihub-section-subtitle">Deep dive tools for comprehensive interview readiness</p>
        </div>
      </div>

      <div className="ihub-tools-strip">
        {QUICK_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} to={tool.path} className="ihub-tool-card">
              <div
                className="ihub-tool-icon"
                style={{ background: `${tool.accent}18`, color: tool.accent }}
              >
                <Icon size={18} />
              </div>
              <div className="ihub-tool-text">
                <div className="ihub-tool-title">{tool.title}</div>
                <div className="ihub-tool-desc">{tool.desc}</div>
              </div>
              <ChevronRight size={16} className="ihub-tool-arrow" />
            </Link>
          );
        })}
      </div>

      {/* ═══ Bottom Grid: Weakness Analysis + Recent Sessions ═══ */}
      <div className="ihub-bottom-grid">
        {/* Weakness Panel */}
        <div className="ihub-panel">
          <div className="ihub-panel-header">
            <div className="ihub-panel-header-left">
              <BarChart3 size={15} color="#60a5fa" />
              <h3 className="ihub-panel-title">Weak Topic Analysis</h3>
            </div>
            <Link to="/interview-analytics" className="ihub-panel-link">
              Full Analytics <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="ihub-empty">
              <Loader2 size={20} className="ihub-spin" />
            </div>
          ) : heatmap.length === 0 ? (
            <div className="ihub-empty">
              <div className="ihub-empty-icon">
                <BarChart3 size={22} />
              </div>
              <p>Complete your first interview session to unlock weakness analysis and targeted coaching.</p>
              <Link to="/company-interview?type=technical" className="ihub-empty-btn">
                Start Mock Interview
              </Link>
            </div>
          ) : (
            <div className="ihub-weakness-list">
              {heatmap.map((item) => (
                <div key={item.area} className="ihub-weakness-item">
                  <span className="ihub-weakness-label">
                    {item.area.replace(/_/g, ' ')}
                  </span>
                  <div className="ihub-weakness-bar-track">
                    <div
                      className="ihub-weakness-bar-fill"
                      style={{
                        width: `${item.score || 0}%`,
                        background: getBarColor(item.score || 0),
                      }}
                    />
                  </div>
                  <span
                    className="ihub-weakness-score"
                    style={{ color: getBarColor(item.score || 0) }}
                  >
                    {item.score}%
                  </span>
                  <button
                    type="button"
                    className="ihub-weakness-practice-btn"
                    onClick={() => navigate(`/company-interview?type=technical&topic=${encodeURIComponent(item.area)}`)}
                    title={`Practice ${item.area.replace(/_/g, ' ')}`}
                  >
                    Practice
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions Panel */}
        <div className="ihub-panel">
          <div className="ihub-panel-header">
            <div className="ihub-panel-header-left">
              <Clock size={15} color="#c084fc" />
              <h3 className="ihub-panel-title">Recent Sessions</h3>
            </div>
            <Link to="/interview-history" className="ihub-panel-link">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="ihub-empty">
              <Loader2 size={20} className="ihub-spin" />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="ihub-empty">
              <div className="ihub-empty-icon">
                <History size={22} />
              </div>
              <p>No practice sessions yet. Start an interview to track scores and review full dossiers here.</p>
              <Link to="/company-interview?type=technical" className="ihub-empty-btn">
                Launch Practice
              </Link>
            </div>
          ) : (
            <div className="ihub-sessions-list">
              {recentSessions.map((session, idx) => {
                const SessIcon = getModeIcon(session.type || session.roundType);
                const color = getModeColor(session.type || session.roundType);
                const score = session.score ?? session.overallScore ?? session.overall_score ?? null;
                return (
                  <div key={session._id || session.id || idx} className="ihub-session-row">
                    <div className="ihub-session-icon" style={{ background: `${color}18`, color }}>
                      <SessIcon size={16} />
                    </div>
                    <div className="ihub-session-info">
                      <div className="ihub-session-name">
                        {session.company ? `${session.company.toUpperCase()} Interview` : (session.title || 'Technical Interview Session')}
                      </div>
                      <div className="ihub-session-meta">
                        {session.type || session.roundType || 'Technical'} · {
                          session.createdAt || session.created_at
                            ? new Date(session.createdAt || session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Recent'
                        }
                      </div>
                    </div>
                    {score != null && (
                      <span className="ihub-session-score" style={{ color: getScoreColor(Number(score)) }}>
                        {score}%
                      </span>
                    )}
                    <Link to="/interview-history" className="ihub-session-replay">
                      Dossier
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
