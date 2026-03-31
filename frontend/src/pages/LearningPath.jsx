import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Zap, Target, Flame, BookOpen, ChevronRight, Clock, GraduationCap, ArrowRight } from 'lucide-react';
import { LEARNING_TOPICS, getTopicIds } from '../data/learningPathData';
import { getTopicProgress, getOverallProgress, getStreakDays } from '../data/learningPathProgress';
import './LearningPath.css';

const ICON_MAP = { Percent: '📊', Hammer: '🔨', Timer: '⏱️', Hash: '#️⃣', Scale: '⚖️', Calculator: '🧮', Coins: '💰', Beaker: '🧪', Variable: '🔤', Shapes: '📐', Dice: '🎲', BarChart: '📈' };

function ProgressRing({ percent, size = 52, strokeWidth = 4, color = '#818cf8' }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="lp-progress-ring" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="#fff"
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
    const overall = useMemo(() => getOverallProgress(topicIds), [topicIds]);
    const streak = useMemo(() => getStreakDays(), []);

    return (
        <div className="lp-container">
            {/* Hero */}
            <div className="lp-hero lp-hero--aptitude">
                <div className="lp-hero-content">
                    <div className="lp-hero-top">
                        <div>
                            <div className="lp-hero-badge">
                                <GraduationCap size={14} /> Structured Learning
                            </div>
                            <h1 className="lp-hero-title">
                                <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>
                                    <BookOpen size={22} />
                                </span>
                                Aptitude & Quant Path
                            </h1>
                            <p className="lp-hero-subtitle">
                                Master each topic with our 4-step methodology: Theory → Quick Methods → Shortcuts → Practice
                            </p>
                        </div>
                    </div>

                    <div className="lp-stats">
                        {[
                            { label: 'Avg Mastery', value: `${overall.avgMastery}%`, icon: <Target size={14} />, color: '#facc15' },
                            { label: 'Mastered', value: overall.topicsMastered, icon: <Trophy size={14} />, color: '#34d399' },
                            { label: 'Solved', value: overall.totalSolved, icon: <Zap size={14} />, color: '#818cf8' },
                            { label: 'Streak', value: `${streak}d`, icon: <Flame size={14} />, color: '#f472b6' },
                        ].map((s, i) => (
                            <div key={i} className="lp-stat-pill">
                                <div className="lp-stat-icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                                <div>
                                    <div className="lp-stat-value">{s.value}</div>
                                    <div className="lp-stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Roadmap button */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <button onClick={() => navigate('/advanced-learning-path')}
                    className="lp-card lp-card--violet" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', cursor: 'pointer', maxWidth: 320, margin: '0 auto' }}>
                    <Sparkles size={16} style={{ color: '#a78bfa' }} />
                    <span className="lp-card-title" style={{ fontSize: 14 }}>Open AI Advanced Roadmap</span>
                    <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </button>
            </div>

            {/* Topic Cards */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                    <BookOpen size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Topics</h2>
                    <p className="lp-section-subtitle">{LEARNING_TOPICS.length} topics to master</p>
                </div>
            </div>

            <div className="lp-grid">
                {LEARNING_TOPICS.map(topic => {
                    const progress = getTopicProgress(topic.id);
                    const badge = getMasteryBadge(progress.masteryPercent);
                    const steps = [
                        { label: 'Theory', done: progress.theoryComplete },
                        { label: 'Methods', done: progress.methodsLearned.length >= 3 },
                        { label: 'Shortcuts', done: progress.shortcutsLearned.length >= 4 },
                        { label: 'Practice', done: progress.accuracy >= 80 && progress.problemsSolved >= 5 },
                    ];

                    return (
                        <div key={topic.id} className="lp-card lp-card--amber" onClick={() => navigate(`/learning-path/${topic.id}`)}>
                            <div className="lp-card-top">
                                <div>
                                    <div style={{ fontSize: 28, marginBottom: 6 }}>{ICON_MAP[topic.icon] || '📖'}</div>
                                    <div className="lp-card-title">{topic.title}</div>
                                    <div className="lp-card-desc" style={{ maxWidth: 200 }}>{topic.description}</div>
                                </div>
                                <ProgressRing percent={progress.masteryPercent} color={topic.color} size={52} />
                            </div>

                            <div className="lp-steps">
                                {steps.map((s, i) => (
                                    <div key={i} className={`lp-step ${s.done ? 'lp-step--done' : ''}`}
                                        style={s.done ? { background: `${topic.color}12`, borderColor: `${topic.color}25` } : {}}>
                                        <div className="lp-step-icon">{s.done ? '✅' : '○'}</div>
                                        <div className="lp-step-label" style={s.done ? { color: topic.color } : {}}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="lp-card-meta">
                                <span className="lp-card-meta-item" style={{ color: badge.color, fontWeight: 600 }}>
                                    {badge.emoji} {badge.label}
                                </span>
                                <span className="lp-card-meta-item" style={{ marginLeft: 'auto' }}>
                                    <Clock size={11} /> {topic.estimatedTime}
                                    <ChevronRight size={13} />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4-Step Methodology */}
            <div className="lp-section-header" style={{ marginTop: 36 }}>
                <div className="lp-section-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#a5b4fc' }}>
                    <Target size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">4-Step Methodology</h2>
                    <p className="lp-section-subtitle">Our proven approach to mastering each topic</p>
                </div>
            </div>
            <div className="lp-methodology">
                {[
                    { step: '1', title: 'Theory & Formulas', desc: 'Learn core concepts with flip cards', icon: <BookOpen size={18} />, color: '#818cf8' },
                    { step: '2', title: 'Quick Methods', desc: 'Multiple solving approaches compared', icon: <Zap size={18} />, color: '#34d399' },
                    { step: '3', title: 'Tricks & Shortcuts', desc: 'Speed techniques with worked examples', icon: <Sparkles size={18} />, color: '#f472b6' },
                    { step: '4', title: 'Practice', desc: 'Progressive difficulty with hints', icon: <Target size={18} />, color: '#facc15' },
                ].map(m => (
                    <div key={m.step} className="lp-methodology-card">
                        <div className="lp-methodology-icon" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
                        <div className="lp-methodology-step" style={{ color: m.color }}>STEP {m.step}</div>
                        <div className="lp-methodology-title">{m.title}</div>
                        <p className="lp-methodology-desc">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
