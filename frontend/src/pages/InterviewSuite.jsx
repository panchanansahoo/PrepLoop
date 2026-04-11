import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Target, Brain, FileText, Mic, Code2,
  History, Building2, Loader2, ArrowRight, Clock,
  BarChart3, Bug, GitPullRequest, Eye, Play, Zap,
  TrendingUp, Award, ChevronRight, Flame, Timer,
  Radio, BookOpen
} from 'lucide-react';
import './InterviewHub.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── Interview Mode Definitions ─── */
const INTERVIEW_MODES = [
  {
    id: 'mock',
    title: 'AI Mock Interview',
    desc: 'Company-specific mock interviews with real-time AI feedback, voice mode, and adaptive difficulty.',
    path: '/company-interview',
    icon: Mic,
    accent: '#8b5cf6',
    badge: 'Most Popular',
    badgeBg: 'rgba(139,92,246,0.2)',
    badgeColor: '#c4b5fd',
    time: '20–45 min',
    difficulty: 'Adaptive',
  },
  {
    id: 'loop',
    title: 'Full Interview Loop',
    desc: 'Multi-round simulation covering DSA, System Design, Behavioral, and HR — just like a real onsite.',
    path: '/multi-round-interview',
    icon: Play,
    accent: '#3b82f6',
    badge: 'Comprehensive',
    badgeBg: 'rgba(59,130,246,0.18)',
    badgeColor: '#93c5fd',
    time: '60–90 min',
    difficulty: 'All Levels',
  },
  {
    id: 'coding',
    title: 'Live Coding Copilot',
    desc: 'Write code in real-time while being scored on Communication, Complexity, Tests & Debugging.',
    path: '/live-coding',
    icon: Eye,
    accent: '#eab308',
    badge: 'Real-Time',
    badgeBg: 'rgba(234,179,8,0.15)',
    badgeColor: '#fde68a',
    time: '30–45 min',
    difficulty: 'Easy → Hard',
  },
  {
    id: 'debug',
    title: 'Debugging Challenge',
    desc: 'Find bugs, fix code, and explain your reasoning — a critical skill tested in modern interviews.',
    path: '/debugging-interview',
    icon: Bug,
    accent: '#ef4444',
    badge: 'Skill Builder',
    badgeBg: 'rgba(239,68,68,0.15)',
    badgeColor: '#fca5a5',
    time: '15–25 min',
    difficulty: 'Medium+',
  },
  {
    id: 'review',
    title: 'Code Review Sim',
    desc: 'Review realistic pull requests — spot issues, suggest improvements, and defend your approach.',
    path: '/code-review-interview',
    icon: GitPullRequest,
    accent: '#06b6d4',
    badge: 'New',
    badgeBg: 'rgba(6,182,212,0.15)',
    badgeColor: '#67e8f9',
    time: '20–30 min',
    difficulty: 'Medium',
  },
];

/* ─── Quick Tool Definitions ─── */
const QUICK_TOOLS = [
  {
    title: 'Behavioral Coach',
    desc: 'Polish STAR-method answers',
    path: '/hr-path',
    icon: Brain,
    accent: '#a855f7',
  },
  {
    title: 'Resume Analyzer',
    desc: 'ATS score & resume viva prep',
    path: '/resume-analyzer',
    icon: FileText,
    accent: '#0ea5e9',
  },
  {
    title: 'Company Roadmap',
    desc: 'Round-by-round prep checklist',
    path: '/company-prep',
    icon: Building2,
    accent: '#22c55e',
  },
];

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/* ─── Mode Icon Map for Sessions ─── */
const MODE_ICONS = {
  mock: Mic,
  dsa: Code2,
  'system-design': Building2,
  behavioral: Brain,
  hr: FileText,
  coding: Eye,
  debug: Bug,
  review: GitPullRequest,
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
  if (normalized.includes('mock') || normalized.includes('dsa')) return '#8b5cf6';
  if (normalized.includes('system')) return '#3b82f6';
  if (normalized.includes('behavioral') || normalized.includes('hr')) return '#a855f7';
  if (normalized.includes('coding')) return '#eab308';
  if (normalized.includes('debug')) return '#ef4444';
  if (normalized.includes('review')) return '#06b6d4';
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
  const [stats, setStats] = useState({ sessions: 0, avgScore: 0, streak: 0 });
  const [heatmap, setHeatmap] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load weakness heatmap
        const heatRes = await fetch(`${API_URL}/api/interview-suite/weakness/heatmap`, {
          headers: getAuthHeaders(),
        });
        const heatData = await heatRes.json();
        setHeatmap(Array.isArray(heatData?.heatmap) ? heatData.heatmap.slice(0, 6) : []);
      } catch {
        setHeatmap([]);
      }

      try {
        // Load recent sessions
        const sessRes = await fetch(`${API_URL}/api/interview/sessions?limit=5`, {
          headers: getAuthHeaders(),
        });
        const sessData = await sessRes.json();
        const sessions = Array.isArray(sessData?.sessions) ? sessData.sessions : (Array.isArray(sessData) ? sessData : []);
        setRecentSessions(sessions.slice(0, 5));

        // Compute stats
        if (sessions.length > 0) {
          const scores = sessions.filter(s => s.score != null).map(s => s.score);
          const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
          setStats({
            sessions: sessions.length,
            avgScore,
            streak: sessions.length >= 3 ? sessions.length : Math.min(sessions.length, 7),
          });
        }
      } catch {
        setRecentSessions([]);
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="ihub-container">
      {/* ═══ Hero Section ═══ */}
      <div className="ihub-hero">
        <div className="ihub-hero-content">
          <div className="ihub-hero-top">
            <div>
              <h1 className="ihub-hero-title">
                <span className="ihub-hero-title-icon">
                  <Sparkles size={22} />
                </span>
                Interview Hub
              </h1>
              <p className="ihub-hero-subtitle">
                Your unified command center for interview mastery — mock interviews, live coding,
                debugging challenges, code reviews, and performance analytics all in one place.
              </p>
            </div>
            <Link to="/company-interview" className="ihub-hero-cta">
              <Zap size={15} />
              Quick Start Interview
              <ArrowRight size={14} />
            </Link>
          </div>

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
                <div className="ihub-stat-value">{stats.avgScore || '—'}</div>
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
              <Radio size={15} color="#06b6d4" />
              <div>
                <div className="ihub-stat-value">5</div>
                <div className="ihub-stat-label">Modes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Interview Modes ═══ */}
      <div className="ihub-section-header">
        <div className="ihub-section-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
          <Target size={17} />
        </div>
        <div>
          <h2 className="ihub-section-title">Choose Your Interview Mode</h2>
          <p className="ihub-section-subtitle">Select a practice mode that matches your preparation goal</p>
        </div>
      </div>

      <div className="ihub-modes-grid">
        {INTERVIEW_MODES.map((mode) => {
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
              <div className="ihub-mode-meta">
                <span className="ihub-mode-meta-item">
                  <Timer size={12} /> {mode.time}
                </span>
                <span className="ihub-mode-meta-item">
                  <BarChart3 size={12} /> {mode.difficulty}
                </span>
                <span className="ihub-mode-start" style={{ color: mode.accent }}>
                  Start <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ═══ Quick Tools ═══ */}
      <div className="ihub-section-header">
        <div className="ihub-section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
          <BookOpen size={17} />
        </div>
        <div>
          <h2 className="ihub-section-title">Quick Prep Tools</h2>
          <p className="ihub-section-subtitle">Supporting tools to round out your preparation</p>
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
              <div>
                <div className="ihub-tool-title">{tool.title}</div>
                <div className="ihub-tool-desc">{tool.desc}</div>
              </div>
              <ChevronRight size={16} className="ihub-tool-arrow" />
            </Link>
          );
        })}
      </div>

      {/* ═══ Bottom Grid: Performance + Recent ═══ */}
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
              <Loader2 size={20} style={{ animation: 'ihub-spin 1s linear infinite' }} />
            </div>
          ) : heatmap.length === 0 ? (
            <div className="ihub-empty">
              <div className="ihub-empty-icon">
                <BarChart3 size={22} />
              </div>
              Complete your first interview session to unlock weakness analysis.
            </div>
          ) : (
            <div>
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
              <Loader2 size={20} style={{ animation: 'ihub-spin 1s linear infinite' }} />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="ihub-empty">
              <div className="ihub-empty-icon">
                <History size={22} />
              </div>
              No sessions yet. Start an interview to see your progress here.
            </div>
          ) : (
            <div>
              {recentSessions.map((session, idx) => {
                const SessIcon = getModeIcon(session.type || session.roundType);
                const color = getModeColor(session.type || session.roundType);
                const score = session.score ?? session.overallScore ?? null;
                return (
                  <div key={session._id || idx} className="ihub-session-row">
                    <div className="ihub-session-icon" style={{ background: `${color}18`, color }}>
                      <SessIcon size={16} />
                    </div>
                    <div className="ihub-session-info">
                      <div className="ihub-session-name">
                        {session.company || session.type || 'Interview Session'}
                      </div>
                      <div className="ihub-session-meta">
                        {session.type || session.roundType || 'Mock'} · {
                          session.createdAt
                            ? new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'Recent'
                        }
                      </div>
                    </div>
                    {score != null && (
                      <span className="ihub-session-score" style={{ color: getScoreColor(score) }}>
                        {score}%
                      </span>
                    )}
                    <Link to="/interview-history" className="ihub-session-replay">
                      Replay
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
