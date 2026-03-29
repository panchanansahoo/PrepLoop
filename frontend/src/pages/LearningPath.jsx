import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Trophy, Zap, Target, Flame, BookOpen, Lock, ChevronRight, Clock, GraduationCap } from 'lucide-react';
import { LEARNING_TOPICS, getTopicIds } from '../data/learningPathData';
import { getTopicProgress, getOverallProgress, getStreakDays } from '../data/learningPathProgress';

const ICON_MAP = { Percent: '📊', Hammer: '🔨', Timer: '⏱️', Hash: '#️⃣', Scale: '⚖️', Calculator: '🧮', Coins: '💰', Beaker: '🧪', Variable: '🔤', Shapes: '📐', Dice: '🎲', BarChart: '📈' };

function ProgressRing({ percent, size = 64, strokeWidth = 5, color }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="currentColor"
                fontSize={size * 0.22} fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {percent}%
            </text>
        </svg>
    );
}

function getMasteryBadge(p) {
    if (p >= 90) return { label: 'Mastered', emoji: '✅', color: '#34d399' };
    if (p >= 50) return { label: 'In Progress', emoji: '🔥', color: '#facc15' };
    if (p > 0) return { label: 'Learning', emoji: '📚', color: '#818cf8' };
    return { label: 'Not Started', emoji: '🔒', color: '#525252' };
}

export default function LearningPath() {
    const navigate = useNavigate();
    const topicIds = useMemo(() => getTopicIds(), []);
    const overall = useMemo(() => getOverallProgress(topicIds), []);
    const streak = useMemo(() => getStreakDays(), []);

    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#030303', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>
            {/* Hero */}
            <section style={{ padding: '60px 24px 40px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99,
                    background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', fontSize: 13, color: '#a5b4fc', marginBottom: 24
                }}>
                    <GraduationCap size={14} /> Structured Learning
                </div>
                <h1 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
                    Learning{' '}
                    <span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Path
                    </span>
                </h1>
                <p style={{ fontSize: 18, color: '#71717a', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
                    Master each topic with our 4-step methodology: Theory → Quick Methods → Shortcuts → Practice
                </p>

                <button
                    onClick={() => navigate('/advanced-learning-path')}
                    style={{
                        marginBottom: 36,
                        padding: '10px 18px',
                        borderRadius: 999,
                        border: '1px solid rgba(129,140,248,0.45)',
                        background: 'rgba(129,140,248,0.12)',
                        color: '#a5b4fc',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Open AI Advanced Roadmap
                </button>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, maxWidth: 700, margin: '0 auto 48px' }}>
                    {[
                        { label: 'Avg Mastery', value: `${overall.avgMastery}%`, icon: <Target size={18} />, color: '#818cf8' },
                        { label: 'Topics Mastered', value: overall.topicsMastered, icon: <Trophy size={18} />, color: '#facc15' },
                        { label: 'Problems Solved', value: overall.totalSolved, icon: <Zap size={18} />, color: '#34d399' },
                        { label: 'Day Streak', value: streak, icon: <Flame size={18} />, color: '#f472b6' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 12, padding: '20px 16px', textAlign: 'center'
                        }}>
                            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Topic Cards */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📚 Topics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {LEARNING_TOPICS.map(topic => {
                        const progress = getTopicProgress(topic.id);
                        const badge = getMasteryBadge(progress.masteryPercent);
                        return (
                            <div key={topic.id} onClick={() => navigate(`/learning-path/${topic.id}`)} style={{
                                background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 16,
                                padding: 28, cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${topic.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                {/* Glow */}
                                <div style={{
                                    position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%',
                                    background: `${topic.color}10`, filter: 'blur(40px)', pointerEvents: 'none'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>{ICON_MAP[topic.icon] || '📖'}</div>
                                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{topic.title}</h3>
                                        <p style={{ fontSize: 13, color: isLight ? '#64748b' : '#71717a', margin: 0, lineHeight: 1.5, maxWidth: 220 }}>{topic.description}</p>
                                    </div>
                                    <ProgressRing percent={progress.masteryPercent} color={topic.color} />
                                </div>

                                {/* 4-Step Indicators */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                                    {[
                                        { label: 'Theory', done: progress.theoryComplete },
                                        { label: 'Methods', done: progress.methodsLearned.length >= 3 },
                                        { label: 'Shortcuts', done: progress.shortcutsLearned.length >= 4 },
                                        { label: 'Practice', done: progress.accuracy >= 80 && progress.problemsSolved >= 5 },
                                    ].map((step, i) => (
                                        <div key={i} style={{
                                            textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                                            background: step.done ? `${topic.color}15` : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                                            border: `1px solid ${step.done ? `${topic.color}30` : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)')}`
                                        }}>
                                            <div style={{ fontSize: 11, marginBottom: 2 }}>{step.done ? '✅' : '○'}</div>
                                            <div style={{ fontSize: 10, color: step.done ? topic.color : '#525252', fontWeight: 600 }}>{step.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: badge.color, fontWeight: 600 }}>
                                        {badge.emoji} {badge.label}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={12} style={{ color: '#525252' }} />
                                        <span style={{ fontSize: 11, color: '#525252' }}>{topic.estimatedTime}</span>
                                        <ChevronRight size={14} style={{ color: '#525252' }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Methodology */}
            <section style={{ maxWidth: 1200, margin: '48px auto 0', padding: '0 24px' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>🎯 4-Step Methodology</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    {[
                        { step: '1', title: 'Theory & Formulas', desc: 'Learn core concepts with flip cards', icon: <BookOpen size={20} />, color: '#818cf8' },
                        { step: '2', title: 'Quick Methods', desc: 'Multiple solving approaches compared', icon: <Zap size={20} />, color: '#34d399' },
                        { step: '3', title: 'Tricks & Shortcuts', desc: 'Speed techniques with examples', icon: <Sparkles size={20} />, color: '#f472b6' },
                        { step: '4', title: 'Practice', desc: 'Progressive difficulty with hints', icon: <Target size={20} />, color: '#facc15' },
                    ].map(m => (
                        <div key={m.step} style={{
                            padding: 24, borderRadius: 16, background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center'
                        }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                                background: `${m.color}15`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {m.icon}
                            </div>
                            <div style={{ fontSize: 11, color: m.color, fontWeight: 700, marginBottom: 4 }}>STEP {m.step}</div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{m.title}</h3>
                            <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
