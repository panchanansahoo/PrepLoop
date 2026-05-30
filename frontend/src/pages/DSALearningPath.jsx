import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Zap, Target, Flame, ChevronRight, Clock, GraduationCap, ChevronDown, Map, BarChart3, ArrowRight } from 'lucide-react';
import { DSA_STAGES, DSA_TOPICS, TIME_TRACKS, getDSATopicIds, getDSATopicsByStage } from '../data/dsaLearningPathData';
import { getDSATopicProgress, getDSAOverallProgress, getDSASkillRadar } from '../data/dsaLearningProgress';

import './LearningPath.css';

/* ─── Progress Ring ─── */
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
function TopicCard({ topic, onClick, glowClass }) {
    const progress = getDSATopicProgress(topic.id);
    const badge = getMasteryBadge(progress.masteryPercent);
    const steps = [
        { label: 'Concepts', done: progress.conceptComplete },
        { label: 'Thinking', done: progress.thinkingComplete },
        { label: 'Tricks', done: progress.tricksComplete },
        { label: 'Practice', done: progress.solved >= 5 },
    ];

    return (
        <div className={`lp-card ${glowClass || 'lp-card--indigo'}`} onClick={onClick}>
            <div className="lp-card-top">
                <div>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{topic.icon}</div>
                    <div className="lp-card-title">{topic.title}</div>
                    <div className="lp-card-desc" style={{ maxWidth: 200 }}>{topic.description}</div>
                </div>
                <ProgressRing percent={progress.masteryPercent} color={topic.color} size={50} strokeWidth={4} />
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
                <span className="lp-card-badge" style={{ background: `${topic.color}15`, color: topic.color }}>{topic.difficulty}</span>
                <span className="lp-card-meta-item" style={{ marginLeft: 'auto' }}>
                    <Clock size={11} /> {topic.estimatedTime}
                    <ChevronRight size={13} />
                </span>
            </div>
        </div>
    );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function DSALearningPath() {
    const navigate = useNavigate();
    const [expandedStages, setExpandedStages] = useState({ fundamentals: true, core: true, 'trees-graphs': true, optimization: true });
    const [selectedTrack, setSelectedTrack] = useState(60);

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
        <div className="lp-container">
            {/* ─── Hero ─── */}
            <div className="lp-hero lp-hero--dsa">
                <div className="lp-hero-content">
                    <div className="lp-hero-badge">
                        <Map size={14} /> DSA Mastery Path
                    </div>
                    <h1 className="lp-hero-title">
                        <span className="lp-hero-title-icon" style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
                            <GraduationCap size={22} />
                        </span>
                        DSA Learning Path
                    </h1>
                    <p className="lp-hero-subtitle">
                        Master 15 DSA topics with pattern-first learning. Concepts → Thinking Frameworks → Tricks → Practice.
                    </p>

                    <div className="lp-stats">
                        {[
                            { label: 'Avg Mastery', value: `${overall.avgMastery}%`, icon: <Target size={14} />, color: '#818cf8' },
                            { label: 'Mastered', value: overall.topicsMastered, icon: <Trophy size={14} />, color: '#facc15' },
                            { label: 'Solved', value: overall.totalSolved, icon: <Zap size={14} />, color: '#34d399' },
                            { label: 'Started', value: overall.topicsStarted, icon: <Flame size={14} />, color: '#f472b6' },
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

            {/* ─── Time Track Selector ─── */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#a5b4fc' }}>
                    <Clock size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Choose Your Track</h2>
                    <p className="lp-section-subtitle">Select a pace that fits your schedule</p>
                </div>
            </div>

            <div className="lp-tracks">
                {Object.entries(TIME_TRACKS).map(([days, t]) => (
                    <div key={days}
                        className={`lp-track ${selectedTrack === Number(days) ? 'lp-track--active' : ''}`}
                        onClick={() => setSelectedTrack(Number(days))}>
                        <div className="lp-track-days">{days} Days</div>
                        <div className="lp-track-label">{t.label}</div>
                        <div className="lp-track-desc">{t.desc}</div>
                        <div className="lp-track-per-day">📝 {t.perDay}</div>
                    </div>
                ))}
            </div>

            {/* ─── Stage-based Roadmap ─── */}
            <div className="lp-section-header">
                <div className="lp-section-icon" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>
                    <GraduationCap size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Roadmap</h2>
                    <p className="lp-section-subtitle">Stage-based progression from basics to advanced</p>
                </div>
            </div>

            {DSA_STAGES.map((stage) => {
                const topics = getDSATopicsByStage(stage.id);
                const expanded = expandedStages[stage.id];
                const stageTopicIds = topics.map(t => t.id);
                const stageProgress = getDSAOverallProgress(stageTopicIds);
                const isInTrack = track.topics === null || topics.some(t => track.topics.includes(t.id));

                return (
                    <div key={stage.id} className="lp-stage" style={{ opacity: isInTrack ? 1 : 0.4 }}>
                        <button
                            className={`lp-stage-header ${expanded ? 'lp-stage-header--open' : ''}`}
                            onClick={() => toggleStage(stage.id)}
                            style={{ background: `linear-gradient(135deg, ${stage.color}10, ${stage.color}05)`, borderColor: `${stage.color}20` }}>
                            <div className="lp-stage-header-left">
                                <span className="lp-stage-icon">{stage.icon}</span>
                                <div>
                                    <div className="lp-stage-name">{stage.name}</div>
                                    <div className="lp-stage-info">{topics.length} topics · {stageProgress.avgMastery}% avg mastery</div>
                                </div>
                            </div>
                            <div className="lp-stage-header-right">
                                {!isInTrack && <span className="lp-card-badge" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>Not in {selectedTrack}-day track</span>}
                                <ProgressRing percent={stageProgress.avgMastery} size={38} strokeWidth={3} color={stage.color} />
                                <ChevronDown size={18} className={`lp-stage-chevron ${expanded ? 'lp-stage-chevron--open' : ''}`} />
                            </div>
                        </button>

                        {expanded && (
                            <div className="lp-stage-body">
                                {topics.map(topic => {
                                    const inTrack = track.topics === null || track.topics.includes(topic.id);
                                    return (
                                        <div key={topic.id} style={{ opacity: inTrack ? 1 : 0.4 }}>
                                            <TopicCard topic={topic} onClick={() => navigate(`/dsa-path/${topic.id}`)} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* ─── Skill Radar ─── */}
            <div className="lp-section-header" style={{ marginTop: 32 }}>
                <div className="lp-section-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
                    <BarChart3 size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">Skill Radar</h2>
                    <p className="lp-section-subtitle">Visual overview of your strengths</p>
                </div>
            </div>
            <div className="lp-radar-wrap">
                <SkillRadar data={radarData} />
            </div>

            {/* ─── Methodology ─── */}
            <div className="lp-section-header" style={{ marginTop: 32 }}>
                <div className="lp-section-icon" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}>
                    <Target size={16} />
                </div>
                <div>
                    <h2 className="lp-section-title">4-Step Methodology</h2>
                    <p className="lp-section-subtitle">Our proven approach to mastering each topic</p>
                </div>
            </div>
            <div className="lp-methodology">
                {[
                    { step: '1', title: 'Concept & Patterns', desc: 'Core theory, key invariants, pattern definitions', icon: <GraduationCap size={18} />, color: '#818cf8' },
                    { step: '2', title: 'How to Solve', desc: 'Decision trees and thinking frameworks', icon: <Zap size={18} />, color: '#34d399' },
                    { step: '3', title: 'Tricks & Pitfalls', desc: 'Speed tricks and common bug avoidance', icon: <Sparkles size={18} />, color: '#f472b6' },
                    { step: '4', title: 'Practice', desc: 'Easy → Medium → Hard curated problems', icon: <Target size={18} />, color: '#facc15' },
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
