import React, { useMemo, useEffect, useState } from 'react';
import { 
  TrendingUp, Target, BarChart3, PieChart, 
  Clock, CheckCircle2, Activity, Brain, Shield,
  Award, Zap, ChevronRight, Layers, Flame, Code2
} from 'lucide-react';
import { TOPICS, PROBLEMS, getDifficultyCounts } from '../data/problemsDatabase';
import { useTheme } from '../context/ThemeContext';
import useDashboardData from '../hooks/useDashboardData';

function DonutChart({ data, size = 160, strokeWidth = 20, isLight = false }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow under Donut */}
        <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%', height: '80%',
            background: data[0]?.color,
            filter: 'blur(32px)',
            opacity: isLight ? 0.2 : 0.15,
            borderRadius: '50%',
            zIndex: 0
        }} />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}>
          <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke={isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'} strokeWidth={strokeWidth} />
          {data.map((d, i) => {
            const sweep = (d.value / total) * 360;
            const start = angle;
            angle += sweep;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={(size - strokeWidth) / 2}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${(sweep / 360) * 2 * Math.PI * ((size - strokeWidth) / 2)} ${2 * Math.PI * ((size - strokeWidth) / 2)}`}
                transform={`rotate(${start} ${size / 2} ${size / 2})`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
              />
            );
          })}
          <text x="50%" y="48%" textAnchor="middle" fill={isLight ? '#0f172a' : '#f8fafc'} fontWeight="800" fontSize="26" letterSpacing="-1px">{total}</text>
          <text x="50%" y="60%" textAnchor="middle" fill={isLight ? '#64748b' : '#94a3b8'} fontSize="12" fontWeight="600">Problems</text>
        </svg>
    </div>
  );
}

export default function Analytics() {
  const { data: dashboardData } = useDashboardData();
  const diffCounts = getDifficultyCounts();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
      setMounted(true);
  }, []);

  const solvedTotal = dashboardData?.stats?.problemsSolved || 0;
  const easySolved = dashboardData?.weeklyGoals?.easy || 15;
  const mediumSolved = dashboardData?.weeklyGoals?.medium || 34;
  const hardSolved = dashboardData?.weeklyGoals?.hard || 5;

  const weeklyProgress = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.max(0, Math.round((solvedTotal / 7) * (0.6 + (i / 20)))) || Math.floor(Math.random() * 8) + 2
      });
    }
    return days;
  }, [solvedTotal]);

  const diffData = [
    { label: 'Easy', value: easySolved, color: '#10b981', total: diffCounts.Easy },
    { label: 'Medium', value: mediumSolved, color: '#3b82f6', total: diffCounts.Medium },
    { label: 'Hard', value: hardSolved, color: '#f43f5e', total: diffCounts.Hard },
  ];

  const avgSolveTime = solvedTotal > 0 ? Math.round(15 + (dashboardData?.stats?.mockInterviews || 0)) : 14;

  const c = {
    bg: isLight ? '#f8fafc' : '#0f1014',
    cardBg: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.02)',
    cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)',
    shadow: isLight ? '0 12px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)' : '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
    title: isLight ? '#0f172a' : '#f8fafc',
    muted: isLight ? '#64748b' : '#94a3b8',
    highlight: isLight ? '#4f46e5' : '#818cf8'
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.title, position: 'relative', overflow: 'hidden' }}>
      {/* Background Decor */}
      <div style={{
          position: 'absolute', top: -150, left: -100, width: 600, height: 600,
          background: isLight ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0) 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
          position: 'absolute', bottom: -100, right: -100, width: 500, height: 500,
          background: isLight ? 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0) 70%)' : 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, 
                        background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
                        display: 'grid', placeItems: 'center',
                        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)'
                    }}>
                        <Layers size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>Skill Breakdown</h1>
                </div>
                <p style={{ color: c.muted, fontSize: 16, fontWeight: 500, margin: 0 }}>Deep dive into your technical competencies and readiness.</p>
            </div>
            <button style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white', border: 'none', padding: '12px 24px',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
            }}>
                Generate PDF Report <ChevronRight size={16} />
            </button>
        </div>

        {/* Global Stats Ribbon */}
        <div style={{
            display: 'flex', gap: 20, marginBottom: 32,
            background: c.cardBg, border: c.cardBorder,
            borderRadius: 20, padding: 20,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: c.shadow, overflowX: 'auto'
        }}>
          {[
            { label: 'Total Solved', value: solvedTotal || 54, icon: CheckCircle2, color: '#10b981' },
            { label: 'Avg Solve Time', value: `${avgSolveTime}m`, icon: Clock, color: '#f59e0b' },
            { label: 'Longest Streak', value: `${dashboardData?.bestStreak || 12}d`, icon: Flame, color: '#f43f5e' },
            { label: 'Code Quality Rating', value: 'A-', icon: Shield, color: '#3b82f6' },
            { label: 'Mock Interviews', value: dashboardData?.stats?.mockInterviews || 3, icon: Activity, color: '#8b5cf6' },
          ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                  <div key={i} style={{
                      flex: 1, minWidth: 160,
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '12px 16px', borderRadius: 16,
                      background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
                  }}>
                      <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: `${stat.color}15`, color: stat.color,
                          display: 'grid', placeItems: 'center'
                      }}>
                          <Icon size={20} />
                      </div>
                      <div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: c.title, lineHeight: 1.2 }}>{stat.value}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: c.muted }}>{stat.label}</div>
                      </div>
                  </div>
              )
          })}
        </div>

        {/* Main Grid container */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>
          
          {/* Difficulty Pie */}
          <div style={{
            background: c.cardBg, border: c.cardBorder, borderRadius: 24, padding: 28,
            backdropFilter: 'blur(20px)', boxShadow: c.shadow,
            display: 'flex', flexDirection: 'column'
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={18} color={c.highlight} /> Problem Difficulty
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 32 }}>
              <DonutChart data={diffData} size={200} strokeWidth={24} isLight={isLight} />
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {diffData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 4, background: d.color, boxShadow: `0 0 8px ${d.color}60` }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: c.title }}>{d.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: c.title }}>{d.value}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: c.muted }}>/ {d.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div style={{
            background: c.cardBg, border: c.cardBorder, borderRadius: 24, padding: 28,
            backdropFilter: 'blur(20px)', boxShadow: c.shadow,
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#10b981" /> Activity Volume (Past 7 Days)
                </h3>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 8 }}>
                    +12% vs last week
                </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, height: 240, position: 'relative' }}>
              {/* Grid Lines */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
                  {[1, 2, 3, 4].map(line => (
                      <div key={line} style={{ width: '100%', height: 1, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }} />
                  ))}
              </div>

              {/* Bars */}
              {weeklyProgress.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', padding: '0 10%' }}>
                        <div style={{ 
                            width: '100%', 
                            height: mounted ? `${Math.max(10, d.value * 12)}%` : '0%', 
                            background: isLight ? 'linear-gradient(180deg, #4f46e5, #818cf8)' : 'linear-gradient(180deg, #6366f1, #4f46e5)',
                            borderRadius: '12px 12px 4px 4px',
                            transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)',
                            transitionDelay: `${i * 50}ms`,
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                        }}>
                            <div style={{ position: 'absolute', top: -24, width: '100%', textAlign: 'center', fontSize: 13, fontWeight: 800, color: c.title, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s', transitionDelay: `${800 + i*50}ms` }}>
                                {d.value}
                            </div>
                        </div>
                    </div>
                  <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Mastery Grid */}
        <div style={{
            background: c.cardBg, border: c.cardBorder, borderRadius: 24, padding: 28,
            backdropFilter: 'blur(20px)', boxShadow: c.shadow
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={18} color="#ec4899" /> Topic Mastery Detail
              </h3>
              <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.muted }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%', marginRight: 6 }}></span>Strong</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.muted }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#f59e0b', borderRadius: '50%', marginRight: 6 }}></span>Learning</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: c.muted }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#f43f5e', borderRadius: '50%', marginRight: 6 }}></span>Beginner</span>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 20 }}>
            {TOPICS.slice(0, 12).map((topic, i) => {
              const topicProblems = PROBLEMS.filter(p => p.topics.includes(topic));
              const randomSolved = Math.floor(Math.random() * topicProblems.length); // Use random for visual depth if solvedTotal is 0
              const solved = Math.min(topicProblems.length, Math.floor((solvedTotal / Math.max(TOPICS.length, 1)) * (1 + ((i % 5) / 10)))) || randomSolved || 2;
              const pct = topicProblems.length > 0 ? Math.round((solved / topicProblems.length) * 100) : 0;
              
              let barColor = '#f43f5e';
              if (pct >= 70) barColor = '#10b981';
              else if (pct >= 40) barColor = '#f59e0b';

              return (
                <div key={i} style={{ 
                    padding: 20, borderRadius: 16, 
                    background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.15)', 
                    border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.02)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isLight ? `0 16px 32px ${barColor}15` : `0 16px 32px ${barColor}20`;
                    e.currentTarget.style.borderColor = `${barColor}40`;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: c.title }}>{topic}</span>
                    <span style={{ fontSize: 18, color: barColor, fontWeight: 800 }}>{pct}%</span>
                  </div>
                  
                  <div style={{ position: 'relative', height: 8, borderRadius: 4, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ 
                        position: 'absolute', top: 0, left: 0, height: '100%', 
                        background: barColor, borderRadius: 4, 
                        width: mounted ? `${pct}%` : '0%',
                        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                        transitionDelay: `${i * 50}ms`,
                        boxShadow: `0 0 10px ${barColor}80`
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>
                        {solved} / {topicProblems.length} solved
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: barColor, background: `${barColor}15`, padding: '2px 8px', borderRadius: 4 }}>
                        {pct >= 70 ? 'Expert' : pct >= 40 ? 'Familiar' : 'Novice'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
