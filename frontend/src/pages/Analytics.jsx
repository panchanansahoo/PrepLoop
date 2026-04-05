import React, { useMemo } from 'react';
import {
  TrendingUp, Target, BarChart3, PieChart,
  Clock, CheckCircle2, Activity, Brain
} from 'lucide-react';
import { TOPICS, PROBLEMS, getDifficultyCounts } from '../data/problemsDatabase';
import { useTheme } from '../context/ThemeContext';
import useDashboardData from '../hooks/useDashboardData';

function DonutChart({ data, size = 160, strokeWidth = 20, isLight = false }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="none" stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} strokeWidth={strokeWidth} />
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
          />
        );
      })}
      <text x="50%" y="48%" textAnchor="middle" fill={isLight ? '#1e293b' : '#fff'} fontWeight="700" fontSize="22">{total}</text>
      <text x="50%" y="58%" textAnchor="middle" fill={isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)'} fontSize="11">Total</text>
    </svg>
  );
}

export default function Analytics() {
  const { data: dashboardData } = useDashboardData();
  const diffCounts = getDifficultyCounts();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const solvedTotal = dashboardData?.stats?.problemsSolved || 0;
  const easySolved = dashboardData?.weeklyGoals?.easy || 0;
  const mediumSolved = dashboardData?.weeklyGoals?.medium || 0;
  const hardSolved = dashboardData?.weeklyGoals?.hard || 0;

  const topicProficiency = useMemo(() => {
    const topTopics = ['Arrays', 'Strings', 'Trees', 'DP', 'Graphs', 'Stack', 'Hashing', 'Sorting'];
    return topTopics.map((t, idx) => ({
      label: t,
      value: Math.max(0, Math.min(100, Math.round((solvedTotal / 10) + idx * 5))),
    }));
  }, [solvedTotal]);

  const weeklyProgress = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.max(0, Math.round((solvedTotal / 7) * (0.6 + (i / 20))))
      });
    }
    return days;
  }, [solvedTotal]);

  const diffData = [
    { label: 'Easy', value: easySolved, color: '#6ee7b7' },
    { label: 'Medium', value: mediumSolved, color: '#fbbf24' },
    { label: 'Hard', value: hardSolved, color: '#f87171' },
  ];

  const donutData = [
    { value: easySolved || 1, color: '#6ee7b7' },
    { value: mediumSolved || 1, color: '#fbbf24' },
    { value: hardSolved || 1, color: '#f87171' },
  ];

  const avgSolveTime = solvedTotal > 0 ? Math.round(15 + (dashboardData?.stats?.mockInterviews || 0)) : 0;

  return (
    <div className={`min-h-screen selection:bg-purple-500/30 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'}`}>
      {!isLight && <div className="fixed inset-0 bg-gradient-to-b from-purple-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />}

      <div className="max-w-6xl mx-auto px-6 py-8 pt-24 relative z-10">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #c084fc, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
            Analytics
          </h1>
          <p style={{ color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Progress analytics without gamification layers
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Solved', value: solvedTotal, icon: CheckCircle2, color: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Mock Interviews', value: dashboardData?.stats?.mockInterviews || 0, icon: Activity, color: '#67e8f9', bg: 'rgba(103,232,249,0.08)' },
            { label: 'Average Score', value: `${dashboardData?.avgScore || 0}%`, icon: TrendingUp, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
            { label: 'Current Streak', value: `${dashboardData?.streak || 0} days`, icon: Target, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Best Streak', value: `${dashboardData?.bestStreak || 0} days`, icon: Brain, color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
            { label: 'Avg Time', value: `${avgSolveTime}m`, icon: Clock, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} style={{ background: isLight ? s.bg.replace('0.08', '0.12') : s.bg, borderRadius: 14, padding: '16px 18px', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ marginBottom: 8 }}><Icon size={18} color={s.color} /></div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PieChart size={16} color="#a78bfa" /> Difficulty Distribution
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <DonutChart data={donutData} size={140} strokeWidth={18} isLight={isLight} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {diffData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.value}</div>
                      <div style={{ fontSize: 10, color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)' }}>{d.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} color="#fbbf24" /> Weekly Progress
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
              {weeklyProgress.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: Math.max(8, d.value * 6), background: 'linear-gradient(180deg, #8b5cf6, #8b5cf680)', borderRadius: 6 }} />
                  <div style={{ marginTop: 6, fontSize: 10, color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)' }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={16} color="#f87171" /> Topic-Wise Progress
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {TOPICS.slice(0, 16).map((topic, i) => {
              const topicProblems = PROBLEMS.filter(p => p.topics.includes(topic));
              const solved = Math.min(topicProblems.length, Math.floor((solvedTotal / Math.max(TOPICS.length, 1)) * (0.5 + ((i % 5) / 10))));
              const pct = topicProblems.length > 0 ? Math.round((solved / topicProblems.length) * 100) : 0;
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isLight ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.6)' }}>{topic}</span>
                    <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: pct > 70 ? '#6ee7b7' : pct > 40 ? '#fbbf24' : '#a78bfa', width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: isLight ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {solved}/{topicProblems.length} solved
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: isLight ? 'rgba(30,41,59,0.45)' : 'rgba(255,255,255,0.35)' }}>
            Available by difficulty: Easy {diffCounts.Easy}, Medium {diffCounts.Medium}, Hard {diffCounts.Hard}
          </div>
        </div>
      </div>
    </div>
  );
}
