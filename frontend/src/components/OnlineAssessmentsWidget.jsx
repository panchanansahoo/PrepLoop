import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  Clock,
  Code2,
  ArrowRight,
  Sparkles,
  Building2,
  ShieldCheck,
  Play,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TECH_OAS = [
  {
    id: 'google',
    company: 'Google',
    role: 'Software Engineer',
    color: '#4285F4',
    bg: 'rgba(66, 133, 244, 0.1)',
    border: 'rgba(66, 133, 244, 0.25)',
    duration: '90 mins',
    problems: '3 Problems',
    difficulty: 'Medium-Hard',
    diffColor: '#f59e0b',
    topics: ['Dynamic Programming', 'Graphs', 'Topological Sort'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=google&role=Software%20Engineer&difficulty=Medium',
  },
  {
    id: 'amazon',
    company: 'Amazon',
    role: 'SDE-I / SDE-II',
    color: '#FF9900',
    bg: 'rgba(255, 153, 0, 0.1)',
    border: 'rgba(255, 153, 0, 0.25)',
    duration: '70 mins',
    problems: '2 Problems',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    topics: ['Trees & Heaps', 'Sliding Window', 'Top-K Elements'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=amazon&role=SDE-I&difficulty=Medium',
  },
  {
    id: 'meta',
    company: 'Meta',
    role: 'Production Engineer',
    color: '#0668E1',
    bg: 'rgba(6, 104, 225, 0.1)',
    border: 'rgba(6, 104, 225, 0.25)',
    duration: '85 mins',
    problems: '3 Problems',
    difficulty: 'Medium-Hard',
    diffColor: '#f59e0b',
    topics: ['Two Pointers', 'Binary Search', 'Hash Map Math'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=meta&role=Production%20Engineer&difficulty=Medium',
  },
  {
    id: 'microsoft',
    company: 'Microsoft',
    role: 'Software Engineer',
    color: '#00A4EF',
    bg: 'rgba(0, 164, 239, 0.1)',
    border: 'rgba(0, 164, 239, 0.25)',
    duration: '80 mins',
    problems: '3 Problems',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    topics: ['String Manipulation', 'BFS Traversal', 'Matrices'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=microsoft&role=Software%20Engineer&difficulty=Medium',
  },
  {
    id: 'netflix',
    company: 'Netflix',
    role: 'Senior Platform Engineer',
    color: '#E50914',
    bg: 'rgba(229, 9, 20, 0.1)',
    border: 'rgba(229, 9, 20, 0.25)',
    duration: '90 mins',
    problems: '3 Problems',
    difficulty: 'Hard',
    diffColor: '#ef4444',
    topics: ['LRU Cache Design', 'Stream Processing', 'Concurrency'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=netflix&role=Senior%20Platform%20Engineer&difficulty=Hard',
  },
  {
    id: 'uber',
    company: 'Uber',
    role: 'Backend SDE',
    color: '#000000',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
    duration: '80 mins',
    problems: '3 Problems',
    difficulty: 'Hard',
    diffColor: '#ef4444',
    topics: ['Dijkstra Shortest Path', 'Rate Limiting', 'Intervals'],
    format: 'HackerRank-Style OA',
    path: '/coding-round?company=uber&role=Backend%20SDE&difficulty=Hard',
  },
];

const CAMPUS_OAS = [
  {
    id: 'tcs',
    company: 'TCS',
    role: 'NQT Foundation & Advanced',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.1)',
    border: 'rgba(129, 140, 248, 0.25)',
    duration: '90 mins',
    problems: '2 Sections',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    topics: ['Advanced Quantitative', 'Coding Sandbox', 'Logic'],
    format: 'Campus National Qualifier',
    path: '/exam-practice/tcs-nqt',
  },
  {
    id: 'infosys',
    company: 'Infosys',
    role: 'Specialist Programmer (SP)',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.1)',
    border: 'rgba(56, 189, 248, 0.25)',
    duration: '180 mins',
    problems: '3 Problems',
    difficulty: 'Hard',
    diffColor: '#ef4444',
    topics: ['Dynamic Programming', 'Trees & Tries', 'Bitmasking'],
    format: 'Specialist Programmer OA',
    path: '/exam-practice/infosys-sp',
  },
  {
    id: 'cognizant',
    company: 'Cognizant',
    role: 'GenC Next & Elevate',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.1)',
    border: 'rgba(52, 211, 153, 0.25)',
    duration: '120 mins',
    problems: '4 Sections',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    topics: ['Technical MCQ', 'Hands-on Coding', 'Data Structures'],
    format: 'Campus Recruitment OA',
    path: '/exam-practice/cognizant-genc-next',
  },
  {
    id: 'wipro',
    company: 'Wipro',
    role: 'Elite National Talent Hunt',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.25)',
    duration: '128 mins',
    problems: '3 Sections',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    topics: ['Aptitude', 'Essay Evaluation', 'DSA Coding'],
    format: 'Elite Talent Hunt OA',
    path: '/exam-practice/wipro-elite',
  },
];

export default function OnlineAssessmentsWidget() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState('tech'); // 'tech' | 'campus'

  const currentList = activeTab === 'tech' ? TECH_OAS : CAMPUS_OAS;

  const c = {
    bg: isLight
      ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
      : 'linear-gradient(135deg, rgba(18, 18, 24, 0.7), rgba(20, 20, 28, 0.5))',
    border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
    shadow: isLight
      ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)'
      : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
    title: isLight ? '#0f172a' : '#f8fafc',
    subtitle: isLight ? '#64748b' : '#94a3b8',
    cardBg: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.02)',
    cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
    cardHoverBg: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
    cardHoverBorder: isLight ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.4)',
    tabActiveBg: isLight ? '#4f46e5' : '#6366f1',
    tabActiveText: '#ffffff',
    tabInactiveBg: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
    tabInactiveText: isLight ? '#475569' : '#94a3b8',
    pillBg: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
    pillText: isLight ? '#475569' : '#cbd5e1',
    bannerBg: isLight ? 'rgba(99, 102, 241, 0.04)' : 'rgba(99, 102, 241, 0.08)',
    bannerBorder: isLight ? '1px solid rgba(99, 102, 241, 0.12)' : '1px solid rgba(99, 102, 241, 0.18)',
  };

  return (
    <div
      style={{
        padding: '26px 30px',
        background: c.bg,
        borderRadius: '24px',
        border: c.border,
        boxShadow: c.shadow,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* ── Widget Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.15)',
              border: isLight ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.3)',
              color: isLight ? '#4f46e5' : '#818cf8',
              flexShrink: 0,
            }}
          >
            <Terminal size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: c.title,
                  letterSpacing: '-0.3px',
                }}
              >
                Company Online Assessments
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                  color: '#10b981',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
                PrepLoop OA Engine
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: c.subtitle, fontWeight: 500 }}>
              Timed non-voice screening rounds with hidden test cases and proctor telemetry
            </p>
          </div>
        </div>

        {/* Tab switcher + Explore link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '12px',
              background: c.tabInactiveBg,
              border: c.cardBorder,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('tech')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeTab === 'tech' ? c.tabActiveBg : 'transparent',
                color: activeTab === 'tech' ? c.tabActiveText : c.tabInactiveText,
                transition: 'all 0.2s ease',
              }}
            >
              <Building2 size={13} />
              Top Tech OAs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('campus')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeTab === 'campus' ? c.tabActiveBg : 'transparent',
                color: activeTab === 'campus' ? c.tabActiveText : c.tabInactiveText,
                transition: 'all 0.2s ease',
              }}
            >
              <GraduationCap size={13} />
              Campus Placements
            </button>
          </div>

          <Link
            to={activeTab === 'tech' ? '/company-prep' : '/exam-hub'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: isLight ? '#4f46e5' : '#a78bfa',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: isLight ? 'rgba(79, 70, 229, 0.06)' : 'rgba(167, 139, 250, 0.08)',
              transition: 'all 0.2s',
            }}
          >
            <span>{activeTab === 'tech' ? 'All Companies' : 'Exam Hub'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Assessments Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 330px), 1fr))',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        {currentList.map((oa) => (
          <div
            key={oa.id}
            style={{
              padding: '16px 18px',
              borderRadius: '16px',
              background: c.cardBg,
              border: c.cardBorder,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = c.cardHoverBg;
              e.currentTarget.style.borderColor = c.cardHoverBorder;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isLight
                ? '0 10px 24px rgba(0,0,0,0.06)'
                : '0 14px 30px rgba(0,0,0,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = c.cardBg;
              e.currentTarget.style.borderColor = isLight
                ? 'rgba(15, 23, 42, 0.06)'
                : 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              {/* Header row: Company logo + Title + Difficulty badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      background: oa.bg,
                      border: `1px solid ${oa.border}`,
                      color: oa.color,
                      fontSize: '15px',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {oa.company.charAt(0)}
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: c.title,
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {oa.company} OA
                    </h4>
                    <span style={{ fontSize: '12px', color: c.subtitle, fontWeight: 500 }}>
                      {oa.role}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    color: oa.diffColor,
                    background: `${oa.diffColor}18`,
                    border: `1px solid ${oa.diffColor}30`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {oa.difficulty}
                </span>
              </div>

              {/* Specs: Duration & Problems */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  color: c.subtitle,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} style={{ color: isLight ? '#6366f1' : '#a78bfa' }} />
                  {oa.duration}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Code2 size={13} style={{ color: '#10b981' }} />
                  {oa.problems}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: isLight ? '#94a3b8' : '#64748b',
                    fontWeight: 500,
                  }}
                >
                  {oa.format}
                </span>
              </div>

              {/* Topics Pills */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '14px',
                }}
              >
                {oa.topics.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: c.pillBg,
                      color: c.pillText,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Link
              to={oa.path}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '10px',
                background: isLight ? '#4f46e5' : 'rgba(99, 102, 241, 0.2)',
                border: isLight ? 'none' : '1px solid rgba(99, 102, 241, 0.4)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isLight ? '#4338ca' : 'rgba(99, 102, 241, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isLight ? '#4f46e5' : 'rgba(99, 102, 241, 0.2)';
              }}
            >
              <Play size={13} fill="#ffffff" />
              <span>Start Assessment</span>
            </Link>
          </div>
        ))}
      </div>

      {/* ── Bottom Feature Bar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '14px',
          background: c.bannerBg,
          border: c.bannerBorder,
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: c.title }}>
          <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          <span>
            <strong>Authentic Test Environment:</strong> Hidden test cases, strict time constraints,
            automated verdict scoring, and instant performance analysis.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/coding-round"
            style={{
              color: isLight ? '#4f46e5' : '#a78bfa',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Launch Custom OA</span>
            <ArrowRight size={13} />
          </Link>
          <span style={{ color: isLight ? '#cbd5e1' : '#475569' }}>|</span>
          <Link
            to="/company-interview"
            style={{
              color: isLight ? '#4f46e5' : '#a78bfa',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>AI Voice Mock</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
