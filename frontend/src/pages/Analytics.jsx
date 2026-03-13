import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    TrendingUp, Target, Award, Flame, BarChart3, PieChart,
    Clock, Zap, CheckCircle2, Activity, Calendar, Brain
} from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { TOPICS, PROBLEMS, getDifficultyCounts } from '../data/problemsDatabase';
import StreakHeatmap from '../components/StreakHeatmap';
import { useTheme } from '../context/ThemeContext';

// ─── Mini Canvas Chart Components ───
function DonutChart({ data, size = 160, strokeWidth = 20, isLight = false }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        c.width = size * dpr; c.height = size * dpr;
        c.style.width = size + 'px'; c.style.height = size + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);
        const cx = size / 2, cy = size / 2, r = (size - strokeWidth) / 2;
        const total = data.reduce((s, d) => s + d.value, 0) || 1;
        let angle = -Math.PI / 2;
        data.forEach(d => {
            const sweep = (d.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(cx, cy, r, angle, angle + sweep);
            ctx.strokeStyle = d.color;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            angle += sweep + 0.04;
        });
        // Center text
        ctx.fillStyle = isLight ? '#1e293b' : '#fff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 8);
        ctx.fillStyle = isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Total', cx, cy + 12);
    }, [data, size, strokeWidth, isLight]);
    return <canvas ref={canvasRef} />;
}

function BarChartCanvas({ data, width = 360, height = 160, isLight = false }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        c.width = width * dpr; c.height = height * dpr;
        c.style.width = width + 'px'; c.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        const max = Math.max(...data.map(d => d.value), 1);
        const barWidth = Math.min(28, (width - 20) / data.length - 6);
        const barGap = (width - data.length * barWidth) / (data.length + 1);
        data.forEach((d, i) => {
            const barH = (d.value / max) * (height - 30);
            const x = barGap + i * (barWidth + barGap);
            const y = height - 20 - barH;
            const grad = ctx.createLinearGradient(x, y, x, height - 20);
            grad.addColorStop(0, d.color || '#8b5cf6');
            grad.addColorStop(1, (d.color || '#8b5cf6') + '40');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            ctx.fill();
            ctx.fillStyle = isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.3)';
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label.slice(0, 4), x + barWidth / 2, height - 6);
        });
    }, [data, width, height, isLight]);
    return <canvas ref={canvasRef} />;
}

function RadarChart({ data, size = 220, isLight = false }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        c.width = size * dpr; c.height = size * dpr;
        c.style.width = size + 'px'; c.style.height = size + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);
        const cx = size / 2, cy = size / 2, R = size / 2 - 30;
        const n = data.length;
        const angleStep = (2 * Math.PI) / n;
        // Grid
        for (let ring = 1; ring <= 4; ring++) {
            ctx.beginPath();
            const r = (ring / 4) * R;
            for (let i = 0; i <= n; i++) {
                const a = -Math.PI / 2 + i * angleStep;
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = isLight ? 'rgba(30,41,59,0.1)' : 'rgba(255,255,255,0.06)';
            ctx.stroke();
        }
        // Spokes
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + i * angleStep;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
            ctx.strokeStyle = isLight ? 'rgba(30,41,59,0.1)' : 'rgba(255,255,255,0.06)';
            ctx.stroke();
        }
        // Data polygon
        ctx.beginPath();
        data.forEach((d, i) => {
            const a = -Math.PI / 2 + i * angleStep;
            const r = (d.value / 100) * R;
            const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(139,92,246,0.2)';
        ctx.fill();
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Points + labels
        data.forEach((d, i) => {
            const a = -Math.PI / 2 + i * angleStep;
            const r = (d.value / 100) * R;
            const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#c084fc';
            ctx.fill();
            // Label
            const lx = cx + (R + 18) * Math.cos(a), ly = cy + (R + 18) * Math.sin(a);
            ctx.fillStyle = isLight ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.5)';
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.label.slice(0, 6), lx, ly);
        });
    }, [data, size, isLight]);
    return <canvas ref={canvasRef} />;
}

function LineChartCanvas({ data, width = 360, height = 120 }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        c.width = width * dpr; c.height = height * dpr;
        c.style.width = width + 'px'; c.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        if (data.length < 2) return;
        const max = Math.max(...data.map(d => d.value), 1);
        const pad = 10;
        const xStep = (width - pad * 2) / (data.length - 1);
        // Area
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = pad + i * xStep;
            const y = height - pad - (d.value / max) * (height - pad * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.lineTo(pad + (data.length - 1) * xStep, height - pad);
        ctx.lineTo(pad, height - pad);
        ctx.closePath();
        ctx.fillStyle = 'rgba(139,92,246,0.1)';
        ctx.fill();
        // Line
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = pad + i * xStep;
            const y = height - pad - (d.value / max) * (height - pad * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Dots
        data.forEach((d, i) => {
            const x = pad + i * xStep;
            const y = height - pad - (d.value / max) * (height - pad * 2);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#c084fc';
            ctx.fill();
        });
    }, [data, width, height]);
    return <canvas ref={canvasRef} />;
}

// ─── Main Analytics Page ───
export default function Analytics() {
    const gam = useGamification();
    const diffCounts = getDifficultyCounts();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Generate topic proficiency (simulated from gamification data)
    const topicProficiency = useMemo(() => {
        const topTopics = ['Arrays', 'Strings', 'Trees', 'DP', 'Graphs', 'Stack', 'Hashing', 'Sorting'];
        return topTopics.map(t => ({
            label: t,
            value: Math.min(100, Math.round((gam.problemsSolved / 20) * (30 + Math.random() * 70))),
        }));
    }, [gam.problemsSolved]);

    // Weekly progress data (from activity history)
    const weeklyProgress = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            days.push({
                label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                value: gam.activityHistory[key]?.solved || 0,
            });
        }
        return days;
    }, [gam.activityHistory]);

    // Difficulty bar data
    const diffData = [
        { label: 'Easy', value: gam.easySolved, color: '#6ee7b7' },
        { label: 'Medium', value: gam.mediumSolved, color: '#fbbf24' },
        { label: 'Hard', value: gam.hardSolved, color: '#f87171' },
    ];

    // Donut data
    const donutData = [
        { value: gam.easySolved || 1, color: '#6ee7b7' },
        { value: gam.mediumSolved || 1, color: '#fbbf24' },
        { value: gam.hardSolved || 1, color: '#f87171' },
    ];

    const consistencyScore = Math.min(100, Math.round((gam.currentStreak / 30) * 100));
    const avgSolveTime = gam.problemsSolved > 0 ? Math.round(15 + Math.random() * 10) : 0;

    return (
        <div className={`min-h-screen selection:bg-purple-500/30 ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'}`}>
            {!isLight && <div className="fixed inset-0 bg-gradient-to-b from-purple-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />}

            <div className="max-w-6xl mx-auto px-6 py-8 pt-24 relative z-10">
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #c084fc, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
                        Analytics
                    </h1>
                    <p style={{ color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)', fontSize: 14 }}>Track your progress, identify strengths, and optimize your preparation</p>
                </div>

                {/* Performance Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Total Solved', value: gam.problemsSolved, icon: CheckCircle2, color: '#6ee7b7', bg: 'rgba(16,185,129,0.08)' },
                        { label: 'Total XP', value: gam.totalXP.toLocaleString(), icon: Zap, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
                        { label: 'Current Streak', value: `${gam.currentStreak} 🔥`, icon: Flame, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        { label: 'Best Streak', value: `${gam.bestStreak} days`, icon: Award, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
                        { label: 'Consistency', value: `${consistencyScore}%`, icon: Activity, color: '#67e8f9', bg: 'rgba(103,232,249,0.08)' },
                        { label: 'Avg Time', value: `${avgSolveTime}m`, icon: Clock, color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} style={{ background: isLight ? s.bg.replace('0.08', '0.12') : s.bg, borderRadius: 14, padding: '16px 18px', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <Icon size={18} color={s.color} />
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: isLight ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Difficulty Distribution */}
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
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

                    {/* Topic Proficiency Radar */}
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Brain size={16} color="#c084fc" /> Topic Proficiency
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <RadarChart data={topicProficiency} size={200} isLight={isLight} />
                        </div>
                    </div>
                </div>

                {/* Second Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Weekly Progress */}
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={16} color="#6ee7b7" /> Weekly Progress
                        </div>
                        <LineChartCanvas data={weeklyProgress} width={340} height={120} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 10px' }}>
                            {weeklyProgress.map((d, i) => (
                                <span key={i} style={{ fontSize: 9, color: isLight ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.3)' }}>{d.label}</span>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty Breakdown Bar Chart */}
                    <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart3 size={16} color="#fbbf24" /> Problem Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {diffData.map((d, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: isLight ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.5)' }}>{d.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value} / {diffCounts[d.label]}</span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 4, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${d.color}, ${d.color}80)`,
                                            width: `${Math.min(100, (d.value / (diffCounts[d.label] || 1)) * 100)}%`,
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Streak Heatmap */}
                <div style={{ marginBottom: 24 }}>
                    <StreakHeatmap
                        activityHistory={gam.activityHistory}
                        currentStreak={gam.currentStreak}
                        bestStreak={gam.bestStreak}
                    />
                </div>

                {/* Topic Progress Grid */}
                <div style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Target size={16} color="#f87171" /> Topic-Wise Progress
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {TOPICS.slice(0, 16).map((topic, i) => {
                            const topicProblems = PROBLEMS.filter(p => p.topics.includes(topic));
                            const solved = Math.min(topicProblems.length, Math.floor(gam.problemsSolved / TOPICS.length * (0.5 + Math.random())));
                            const pct = topicProblems.length > 0 ? Math.round((solved / topicProblems.length) * 100) : 0;
                            return (
                                <div key={i} style={{
                                    padding: '12px 14px', borderRadius: 10,
                                    background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.02)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: isLight ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.6)' }}>{topic}</span>
                                        <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            background: pct > 70 ? '#6ee7b7' : pct > 40 ? '#fbbf24' : '#a78bfa',
                                            width: `${pct}%`, transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 10, color: isLight ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                                        {solved}/{topicProblems.length} solved
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
