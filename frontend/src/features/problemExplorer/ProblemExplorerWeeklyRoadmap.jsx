import { useState, useMemo, useCallback } from 'react';
import { 
  ChevronDown, ChevronRight, CheckCircle2, ExternalLink, 
  Play, Clock, Trophy, Target, Flame, BookOpen, 
  ArrowRight, Zap, Lock
} from 'lucide-react';
import { WEEKLY_ROADMAP } from '../../data/weeklyRoadmapData';
import { PROBLEMS } from '../../data/problemsDatabase';

// Map problem titles from roadmap to internal problem IDs
function findProblemByTitle(title) {
  return PROBLEMS.find(p => 
    p.title.toLowerCase() === title.toLowerCase()
  );
}

function DifficultyBadge({ difficulty, isLight }) {
  const colors = {
    Easy: { bg: 'rgba(110,231,183,0.12)', text: '#6ee7b7', border: 'rgba(110,231,183,0.25)' },
    Medium: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    Hard: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  };
  const c = colors[difficulty] || colors.Medium;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
      padding: '3px 8px', borderRadius: 6,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      textTransform: 'uppercase',
    }}>
      {difficulty}
    </span>
  );
}

function LeetCodeTag({ leetcode }) {
  if (!leetcode) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
      padding: '2px 6px', borderRadius: 4,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      LC #{leetcode}
    </span>
  );
}

function ProblemRow({ problem, index, isLight, solvedSet, onSolve }) {
  const [hovered, setHovered] = useState(false);
  const dbProblem = useMemo(() => findProblemByTitle(problem.title), [problem.title]);
  const isSolved = dbProblem ? (solvedSet.has(String(dbProblem.id)) || solvedSet.has(dbProblem.id)) : false;
  const canNavigate = !!dbProblem;

  const handleClick = () => {
    if (canNavigate) {
      onSolve(dbProblem.id);
    } else if (problem.leetcode) {
      window.open(`https://leetcode.com/problems/`, '_blank');
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', cursor: canNavigate || problem.leetcode ? 'pointer' : 'default',
        borderRadius: 14,
        background: hovered
          ? (isLight ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.06)')
          : 'transparent',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateX(4px)' : 'none',
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Index */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800,
        background: isSolved
          ? 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.12))'
          : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'),
        border: isSolved
          ? '1px solid rgba(52,211,153,0.3)'
          : (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'),
        color: isSolved ? '#34d399' : (isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'),
      }}>
        {isSolved ? <CheckCircle2 size={14} strokeWidth={3} /> : index + 1}
      </div>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 700,
          color: isSolved
            ? (isLight ? '#059669' : '#6ee7b7')
            : (isLight ? '#1e293b' : '#e2e8f0'),
          textDecoration: isSolved ? 'line-through' : 'none',
          textDecorationColor: 'rgba(52,211,153,0.3)',
          letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {problem.title}
          {problem.external && !canNavigate && (
            <ExternalLink size={11} style={{ opacity: 0.4 }} />
          )}
        </div>
        {problem.subtitle && (
          <div style={{
            fontSize: 11, color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)',
            marginTop: 2, fontWeight: 500,
          }}>
            {problem.subtitle}
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <LeetCodeTag leetcode={problem.leetcode} />
        <DifficultyBadge difficulty={problem.difficulty} isLight={isLight} />
        {canNavigate && (
          <div style={{
            opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700,
            color: '#818cf8', padding: '4px 10px',
            borderRadius: 8, background: 'rgba(129,140,248,0.1)',
            border: '1px solid rgba(129,140,248,0.2)',
          }}>
            <Play size={10} fill="#818cf8" /> Solve
          </div>
        )}
      </div>
    </div>
  );
}

function WeekCard({ week, isLight, solvedSet, onSolve, isExpanded, onToggle }) {
  // Calculate progress
  const allProblems = week.sections
    ? week.sections.flatMap(s => s.problems)
    : week.problems;

  const totalProblems = allProblems.length;
  const solvedCount = allProblems.filter(p => {
    const dbP = findProblemByTitle(p.title);
    return dbP ? (solvedSet.has(String(dbP.id)) || solvedSet.has(dbP.id)) : false;
  }).length;
  const progress = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;
  const isComplete = progress === 100 && totalProblems > 0;

  return (
    <div style={{
      borderRadius: 20,
      background: isLight
        ? 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(248,250,252,0.6))'
        : 'linear-gradient(135deg, rgba(20,20,35,0.6), rgba(15,15,25,0.4))',
      border: isLight
        ? `1px solid rgba(0,0,0,0.06)`
        : `1px solid rgba(255,255,255,0.04)`,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isExpanded
        ? (isLight ? '0 12px 40px rgba(0,0,0,0.06)' : '0 12px 40px rgba(0,0,0,0.3)')
        : (isLight ? '0 4px 16px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.15)'),
      animation: 'fade-up-in 0.4s ease both',
    }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 18,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'inherit', textAlign: 'left',
          transition: 'all 0.2s',
        }}
      >
        {/* Week badge */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: week.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          boxShadow: `0 8px 24px ${week.color}25`,
          position: 'relative',
        }}>
          {week.icon}
          {isComplete && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: 'linear-gradient(135deg, #34d399, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: isLight ? '2px solid white' : '2px solid #0f0f1a',
              boxShadow: '0 2px 8px rgba(52,211,153,0.4)',
            }}>
              <CheckCircle2 size={10} color="white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Title + topics */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: 1.2, color: week.color,
              padding: '2px 8px', borderRadius: 5,
              background: `${week.color}12`, border: `1px solid ${week.color}20`,
            }}>
              Week {week.week}
            </span>
          </div>
          <h3 style={{
            fontSize: 17, fontWeight: 800, margin: '0 0 6px 0',
            color: isLight ? '#0f172a' : '#f1f5f9',
            letterSpacing: '-0.02em',
          }}>
            {week.title}
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {week.keyTopics.map(t => (
              <span key={t} style={{
                fontSize: 10, fontWeight: 600,
                padding: '2px 8px', borderRadius: 5,
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Progress ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 18, fontWeight: 900,
              color: isComplete ? '#34d399' : week.color,
              letterSpacing: '-0.02em',
            }}>
              {solvedCount}<span style={{ fontSize: 13, opacity: 0.5 }}>/{totalProblems}</span>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              solved
            </div>
          </div>

          {/* Mini progress bar */}
          <div style={{ width: 50, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <svg width={42} height={42} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={21} cy={21} r={17} fill="none"
                stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}
                strokeWidth={4} />
              <circle cx={21} cy={21} r={17} fill="none"
                stroke={isComplete ? '#34d399' : week.color}
                strokeWidth={4}
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={2 * Math.PI * 17 * (1 - progress / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
                fill={isLight ? '#334155' : '#e2e8f0'} fontSize={11} fontWeight={800}
                style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {progress}%
              </text>
            </svg>
          </div>

          {/* Chevron */}
          <div style={{
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)',
          }}>
            <ChevronDown size={18} />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{
          padding: '0 24px 20px',
          animation: 'fade-up-in 0.3s ease both',
        }}>
          {/* Progress bar */}
          <div style={{
            height: 4, borderRadius: 2, marginBottom: 16,
            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progress}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : week.gradient,
              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: `0 0 12px ${week.color}30`,
            }} />
          </div>

          {/* Problem list */}
          {week.sections ? (
            // Week 8 has subsections
            week.sections.map((section, si) => (
              <div key={si} style={{ marginBottom: si < week.sections.length - 1 ? 20 : 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 0', marginBottom: 4,
                }}>
                  <span style={{ fontSize: 16 }}>{section.icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 800,
                    color: isLight ? '#334155' : '#e2e8f0',
                    letterSpacing: '-0.01em',
                  }}>
                    {section.label}
                  </span>
                  <div style={{
                    height: 1, flex: 1,
                    background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
                  }} />
                </div>
                {section.problems.map((prob, pi) => (
                  <ProblemRow
                    key={pi}
                    problem={prob}
                    index={pi}
                    isLight={isLight}
                    solvedSet={solvedSet}
                    onSolve={onSolve}
                  />
                ))}
              </div>
            ))
          ) : (
            week.problems.map((prob, pi) => (
              <ProblemRow
                key={pi}
                problem={prob}
                index={pi}
                isLight={isLight}
                solvedSet={solvedSet}
                onSolve={onSolve}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ProblemExplorerWeeklyRoadmap({ isLight, solvedSet, onSolve }) {
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const toggleWeek = useCallback((weekNum) => {
    setExpandedWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));
  }, []);

  const expandAll = useCallback(() => {
    const all = {};
    WEEKLY_ROADMAP.forEach(w => { all[w.week] = true; });
    setExpandedWeeks(all);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedWeeks({});
  }, []);

  // Overall stats
  const stats = useMemo(() => {
    let total = 0, solved = 0;
    WEEKLY_ROADMAP.forEach(week => {
      const probs = week.sections
        ? week.sections.flatMap(s => s.problems)
        : week.problems;
      total += probs.length;
      probs.forEach(p => {
        const dbP = findProblemByTitle(p.title);
        if (dbP && (solvedSet.has(String(dbP.id)) || solvedSet.has(dbP.id))) solved++;
      });
    });
    return { total, solved, percent: total > 0 ? Math.round((solved / total) * 100) : 0 };
  }, [solvedSet]);

  const anyExpanded = Object.values(expandedWeeks).some(Boolean);

  return (
    <div style={{ animation: 'fade-up-in 0.4s ease both' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.12))',
            border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139,92,246,0.15)',
          }}>
            <BookOpen size={20} color="#c084fc" />
          </div>
          <div>
            <h2 style={{
              margin: 0, fontSize: 22, fontWeight: 900,
              background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
            }}>
              8-Week DSA Roadmap
            </h2>
            <p style={{
              margin: '4px 0 0 0', fontSize: 13,
              color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
              fontWeight: 500,
            }}>
              Structured weekly plan • {stats.total} curated problems • {stats.solved} solved
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Overall progress pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderRadius: 12,
            background: isLight
              ? 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.04))'
              : 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.06))',
            border: isLight ? '1px solid rgba(139,92,246,0.12)' : '1px solid rgba(139,92,246,0.15)',
          }}>
            <Trophy size={14} color="#fbbf24" />
            <div style={{
              width: 60, height: 5, borderRadius: 3,
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${stats.percent}%`, height: '100%',
                background: stats.percent === 100
                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                  : 'linear-gradient(90deg, #c084fc, #818cf8)',
                borderRadius: 3, transition: 'width 0.6s ease',
              }} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: stats.percent === 100 ? '#34d399' : '#c084fc',
            }}>
              {stats.percent}%
            </span>
          </div>

          {/* Expand/Collapse toggle */}
          <button
            onClick={anyExpanded ? collapseAll : expandAll}
            style={{
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
              border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
              color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {anyExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Week cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {WEEKLY_ROADMAP.map(week => (
          <WeekCard
            key={week.week}
            week={week}
            isLight={isLight}
            solvedSet={solvedSet}
            onSolve={onSolve}
            isExpanded={!!expandedWeeks[week.week]}
            onToggle={() => toggleWeek(week.week)}
          />
        ))}
      </div>
    </div>
  );
}
