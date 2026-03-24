import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Trophy, Zap, Target, Flame, ChevronRight, Clock,
    GraduationCap, ChevronDown, Map, BarChart3
} from 'lucide-react';
import { DSA_STAGES, DSA_TOPICS, TIME_TRACKS, getDSATopicIds, getDSATopicsByStage } from '../data/dsaLearningPathData';
import { getDSATopicProgress, getDSAOverallProgress, getDSASkillRadar } from '../data/dsaLearningProgress';
import { useTheme } from '../context/ThemeContext';

/* ─── Progress Ring ─── */
function ProgressRing({ percent, size = 60, strokeWidth = 5, color, isLight = false }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={isLight ? '#1e293b' : '#fff'}
                fontSize={size * 0.22} fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {percent}%
            </text>
        </svg>
    );
}

/* ─── Skill Radar ─── */
function SkillRadar({ data }) {
    const size = 280, cx = size / 2, cy = size / 2, maxR = 110;
    const n = data.length;
    if (n < 3) return null;
    const angleStep = (2 * Math.PI) / n;

    const getPoint = (i, val) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = (val / 100) * maxR;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    const levels = [25, 50, 75, 100];
    const radarPoints = data.map((d, i) => getPoint(i, d.mastery));
    const pathD = radarPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
            {levels.map(l => {
                const pts = Array.from({ length: n }, (_, i) => getPoint(i, l));
                const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
                return <path key={l} d={d} fill="none" stroke="rgba(100,116,139,0.12)" strokeWidth="1" />;
            })}
            {data.map((_, i) => {
                const p = getPoint(i, 100);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(100,116,139,0.1)" strokeWidth="1" />;
            })}
            <path d={pathD} fill="rgba(129,140,248,0.15)" stroke="#818cf8" strokeWidth="2" />
            {radarPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill="#818cf8" stroke="#1e1b4b" strokeWidth="2" />
            ))}
            {data.map((d, i) => {
                const p = getPoint(i, 115);
                return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                        fill="#a1a1aa" fontSize="9" fontWeight="600">
                        {DSA_TOPICS.find(t => t.id === d.topicId)?.title?.split(' ')[0] || d.topicId}
                    </text>
                );
            })}
        </svg>
    );
}

/* ─── Mastery Badge ─── */
function getMasteryBadge(p) {
    if (p >= 90) return { label: 'Mastered', emoji: '✅', color: '#34d399' };
    if (p >= 50) return { label: 'In Progress', emoji: '🔥', color: '#facc15' };
    if (p > 0) return { label: 'Started', emoji: '📚', color: '#818cf8' };
    return { label: 'Not Started', emoji: '🔒', color: '#525252' };
}

/* ─── Topic Card ─── */
function TopicCard({ topic, onClick, isLight = false }) {
    const progress = getDSATopicProgress(topic.id);
    const badge = getMasteryBadge(progress.masteryPercent);
    const steps = [
        { label: 'Concepts', done: progress.conceptComplete },
        { label: 'Thinking', done: progress.thinkingComplete },
        { label: 'Tricks', done: progress.tricksComplete },
        { label: 'Practice', done: progress.solved >= 5 },
    ];

    return (
        <div onClick={onClick} style={{
            background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
            padding: 24, cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${topic.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${topic.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `${topic.color}08`, filter: 'blur(40px)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{topic.icon}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: isLight ? '#1e293b' : '#fff' }}>{topic.title}</h3>
                    <p style={{ fontSize: 12, color: isLight ? '#64748b' : '#71717a', margin: 0, lineHeight: 1.5, maxWidth: 220 }}>{topic.description}</p>
                </div>
                <ProgressRing percent={progress.masteryPercent} color={topic.color} size={56} strokeWidth={4} isLight={isLight} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
                {steps.map((s, i) => (
                    <div key={i} style={{
                        textAlign: 'center', padding: '6px 4px', borderRadius: 8,
                        background: s.done ? `${topic.color}12` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${s.done ? `${topic.color}25` : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}`
                    }}>
                        <div style={{ fontSize: 10, marginBottom: 2 }}>{s.done ? '✅' : '○'}</div>
                        <div style={{ fontSize: 9, color: s.done ? topic.color : '#525252', fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: badge.color, fontWeight: 600 }}>{badge.emoji} {badge.label}</span>
                    <span style={{ fontSize: 10, color: isLight ? '#64748b' : '#3f3f46', padding: '2px 6px', borderRadius: 4, background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)' }}>{topic.difficulty}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} style={{ color: '#525252' }} />
                    <span style={{ fontSize: 10, color: '#525252' }}>{topic.estimatedTime}</span>
                    <ChevronRight size={14} style={{ color: '#525252' }} />
                </div>
            </div>
        </div>
    );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function DSALearningPath() {
    const navigate = useNavigate();
    const [expandedStages, setExpandedStages] = useState({ fundamentals: true, core: true, 'trees-graphs': true, optimization: true });
    const [selectedTrack, setSelectedTrack] = useState(60);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const topicIds = useMemo(() => getDSATopicIds(), []);
    const [overall, setOverall] = useState(() => getDSAOverallProgress(topicIds));
    const [radarData, setRadarData] = useState(() => getDSASkillRadar(topicIds));
    const [updater, setUpdater] = useState(0);

    useEffect(() => {
        const handleUpdate = () => setUpdater(prev => prev + 1);
        window.addEventListener('dsaTopicUpdate', handleUpdate);
        return () => window.removeEventListener('dsaTopicUpdate', handleUpdate);
    }, []);

    useEffect(() => {
        setOverall(getDSAOverallProgress(topicIds));
        setRadarData(getDSASkillRadar(topicIds));
    }, [updater, topicIds]);

    const toggleStage = (id) => setExpandedStages(prev => ({ ...prev, [id]: !prev[id] }));
    const track = TIME_TRACKS[selectedTrack];

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#030303', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>
            {/* ─── Hero ─── */}
            <section style={{ padding: '48px 24px 32px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99,
                    background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', fontSize: 13, color: '#a5b4fc', marginBottom: 20
                }}>
                    <Map size={14} /> DSA Mastery Path
                </div>
                <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>
                    DSA{' '}
                    <span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Learning Path
                    </span>
                </h1>
                <p style={{ fontSize: 16, color: isLight ? '#64748b' : '#71717a', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
                    Master 15 DSA topics with pattern-first learning. Concepts → Thinking Frameworks → Tricks → Practice.
                </p>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, maxWidth: 700, margin: '0 auto 40px' }}>
                    {[
                        { label: 'Avg Mastery', value: `${overall.avgMastery}%`, icon: <Target size={16} />, color: '#818cf8' },
                        { label: 'Topics Mastered', value: overall.topicsMastered, icon: <Trophy size={16} />, color: '#facc15' },
                        { label: 'Problems Solved', value: overall.totalSolved, icon: <Zap size={16} />, color: '#34d399' },
                        { label: 'Topics Started', value: overall.topicsStarted, icon: <Flame size={16} />, color: '#f472b6' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12, padding: '16px 12px', textAlign: 'center'
                        }}>
                            <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: isLight ? '#64748b' : '#71717a', marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Time Track Selector ─── */}
            <section style={{ maxWidth: 1200, margin: '0 auto 36px', padding: '0 24px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={20} style={{ color: '#818cf8' }} /> Choose Your Track
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {Object.entries(TIME_TRACKS).map(([days, t]) => (
                        <div key={days} onClick={() => setSelectedTrack(Number(days))} style={{
                            padding: '16px 20px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.3s',
                            background: selectedTrack === Number(days) ? 'rgba(129,140,248,0.12)' : isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedTrack === Number(days) ? 'rgba(129,140,248,0.4)' : isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: selectedTrack === Number(days) ? '#a5b4fc' : isLight ? '#1e293b' : '#fff', marginBottom: 4 }}>
                                {days} Days
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#64748b' : '#a1a1aa', marginBottom: 4 }}>{t.label}</div>
                            <div style={{ fontSize: 11, color: '#52525b' }}>{t.desc}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 6 }}>📝 {t.perDay}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Stage-based Roadmap ─── */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GraduationCap size={20} style={{ color: '#f472b6' }} /> Roadmap
                </h2>

                {DSA_STAGES.map((stage, si) => {
                    const topics = getDSATopicsByStage(stage.id);
                    const expanded = expandedStages[stage.id];
                    const stageTopicIds = topics.map(t => t.id);
                    const stageProgress = getDSAOverallProgress(stageTopicIds);
                    const isInTrack = track.topics === null || topics.some(t => track.topics.includes(t.id));

                    return (
                        <div key={stage.id} style={{ marginBottom: 20, opacity: isInTrack ? 1 : 0.45, transition: 'opacity 0.3s' }}>
                            <div onClick={() => toggleStage(stage.id)} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px',
                                borderRadius: expanded ? '14px 14px 0 0' : 14, cursor: 'pointer',
                                background: `linear-gradient(135deg, ${stage.color}12, ${stage.color}06)`,
                                border: `1px solid ${stage.color}25`, transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 22 }}>{stage.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff' }}>{stage.name}</div>
                                        <div style={{ fontSize: 11, color: isLight ? '#64748b' : '#71717a' }}>{topics.length} topics · {stageProgress.avgMastery}% avg mastery</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {!isInTrack && <span style={{ fontSize: 10, color: isLight ? '#94a3b8' : '#525252', padding: '2px 8px', borderRadius: 6, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' }}>Not in {selectedTrack}-day track</span>}
                                    <ChevronDown size={18} style={{ color: '#71717a', transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                                </div>
                            </div>

                            {expanded && (
                                <div style={{
                                    padding: 16, background: isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.01)', borderRadius: '0 0 14px 14px',
                                    border: `1px solid ${stage.color}15`, borderTop: 'none',
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16
                                }}>
                                    {topics.map(topic => {
                                        const inTrack = track.topics === null || track.topics.includes(topic.id);
                                        return (
                                            <div key={topic.id} style={{ opacity: inTrack ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                                                <TopicCard topic={topic} onClick={() => navigate(`/dsa-path/${topic.id}`)} isLight={isLight} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>

            {/* ─── Skill Radar ─── */}
            <section style={{ maxWidth: 1200, margin: '48px auto 0', padding: '0 24px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={20} style={{ color: '#22d3ee' }} /> Skill Radar
                </h2>
                <div style={{
                    background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: 32, display: 'flex', justifyContent: 'center'
                }}>
                    <SkillRadar data={radarData} />
                </div>
            </section>

            {/* ─── Methodology ─── */}
            <section style={{ maxWidth: 1200, margin: '48px auto 0', padding: '0 24px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>🎯 4-Step Methodology</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    {[
                        { step: '1', title: 'Concept & Patterns', desc: 'Core theory, key invariants, pattern definitions', icon: <GraduationCap size={18} />, color: '#818cf8' },
                        { step: '2', title: 'How to Solve', desc: 'Decision trees and thinking frameworks', icon: <Zap size={18} />, color: '#34d399' },
                        { step: '3', title: 'Tricks & Pitfalls', desc: 'Speed tricks and common bug avoidance', icon: <Sparkles size={18} />, color: '#f472b6' },
                        { step: '4', title: 'Practice', desc: 'Easy → Medium → Hard curated problems', icon: <Target size={18} />, color: '#facc15' },
                    ].map(m => (
                        <div key={m.step} style={{
                            padding: 20, borderRadius: 14, background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.02)',
                            border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, margin: '0 auto 10px',
                                background: `${m.color}15`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{m.icon}</div>
                            <div style={{ fontSize: 10, color: m.color, fontWeight: 700, marginBottom: 4 }}>STEP {m.step}</div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: isLight ? '#1e293b' : '#fff' }}>{m.title}</h3>
                            <p style={{ fontSize: 12, color: isLight ? '#64748b' : '#71717a', margin: 0 }}>{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
