import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Zap, GraduationCap, ChevronDown, Map, BarChart3, Database, Target, ChevronRight } from 'lucide-react';
import {SQL_STAGES, getSQLTopicIds, getSQLTopicsByStage} from '../data/sqlLearningPathData';
import {getSQLTopicProgress, getSQLOverallProgress} from '../data/sqlLearningProgress';
import { useTheme } from '../context/ThemeContext';

/* ─── Progress Ring ─── */
function ProgressRing({ percent, size = 60, strokeWidth = 5, color, isLight }) {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)'} strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={isLight ? '#1f2937' : '#fff'}
                fontSize={size * 0.22} fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {percent}%
            </text>
        </svg>
    );
}

export default function SQLLearningPath() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [expandedStages, setExpandedStages] = useState(
        Object.fromEntries(SQL_STAGES.map(s => [s.id, true]))
    );

    const topicIds = useMemo(() => getSQLTopicIds(), []);
    const overall = useMemo(() => getSQLOverallProgress(topicIds), []);

    const toggleStage = (id) =>
        setExpandedStages(prev => ({ ...prev, [id]: !prev[id] }));

    // Theme-aware colors
    const c = {
        pageBg: isLight ? '#f8f9fc' : '#030303',
        pageText: isLight ? '#1f2937' : '#fff',
        muted: isLight ? '#6b7280' : '#a1a1aa',
        mutedDark: isLight ? '#9ca3af' : '#71717a',
        mutedDarker: isLight ? '#d1d5db' : '#52525b',
        headerGrad: isLight
            ? 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(99,102,241,0.04))'
            : 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(139,92,246,0.06))',
        headerBorder: isLight ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.15)',
        statBg: isLight ? '#fff' : 'rgba(255,255,255,0.04)',
        statBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        statValue: isLight ? '#1f2937' : '#fff',
        stageBg: isLight ? '#fff' : 'rgba(255,255,255,0.01)',
        topicBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        topicBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.05)',
        barTrack: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        chevronColor: isLight ? '#d1d5db' : '#3f3f46',
        chevronStage: isLight ? '#9ca3af' : '#52525b',
    };

    return (
        <div style={{ minHeight: '100vh', background: c.pageBg, color: c.pageText, paddingBottom: 80 }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 0' }}>

                {/* ─── Header ─── */}
                <div style={{
                    background: c.headerGrad,
                    border: `1px solid ${c.headerBorder}`, borderRadius: 20, padding: '32px 36px', marginBottom: 32
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <Database size={28} style={{ color: '#22d3ee' }} />
                                <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, margin: 0 }}>
                                    SQL <span style={{ color: '#22d3ee' }}>Learning Path</span>
                                </h1>
                            </div>
                            <p style={{ fontSize: 14, color: c.muted, margin: 0, maxWidth: 500 }}>
                                Master SQL from basics to advanced — querying, joins, aggregation, window functions, indexing & optimization.
                            </p>
                            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Topics', value: topicIds.length, icon: <Map size={13} /> },
                                    { label: 'Mastered', value: overall.topicsMastered, icon: <Trophy size={13} /> },
                                    { label: 'Accuracy', value: `${overall.accuracy}%`, icon: <Target size={13} /> },
                                ].map((stat, i) => (
                                    <div key={i} style={{
                                        padding: '8px 14px', borderRadius: 10, background: c.statBg,
                                        border: `1px solid ${c.statBorder}`, display: 'flex', alignItems: 'center', gap: 8
                                    }}>
                                        <span style={{ color: '#22d3ee' }}>{stat.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: c.statValue }}>{stat.value}</div>
                                            <div style={{ fontSize: 10, color: c.mutedDark }}>{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <ProgressRing percent={overall.avgMastery} size={90} strokeWidth={7} color="#22d3ee" isLight={isLight} />
                    </div>
                </div>

                {/* ─── Roadmap ─── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <Map size={18} style={{ color: '#22d3ee' }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SQL Roadmap</h2>
                    <span style={{ fontSize: 12, color: c.mutedDarker, marginLeft: 8 }}>{topicIds.length} topics · {SQL_STAGES.length} stages</span>
                </div>

                {SQL_STAGES.map((stage, _si) => {
                    const stageTopics = getSQLTopicsByStage(stage.id);
                    const isExpanded = expandedStages[stage.id];

                    return (
                        <div key={stage.id} style={{
                            marginBottom: 16, borderRadius: 16, overflow: 'hidden',
                            border: `1px solid ${stage.color}18`, background: c.stageBg
                        }}>
                            {/* Stage Header */}
                            <button onClick={() => toggleStage(stage.id)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', background: `${stage.color}08`, border: 'none', cursor: 'pointer',
                                borderBottom: isExpanded ? `1px solid ${stage.color}12` : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{
                                        width: 36, height: 36, borderRadius: 10, background: `${stage.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                                    }}>{stage.icon}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: c.pageText }}>{stage.name}</div>
                                        <div style={{ fontSize: 11, color: c.mutedDark }}>{stageTopics.length} topics</div>
                                    </div>
                                </div>
                                <ChevronDown size={18} style={{
                                    color: c.chevronStage, transition: 'transform 0.3s',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                }} />
                            </button>

                            {/* Topics List */}
                            {isExpanded && (
                                <div style={{ padding: '12px 16px' }}>
                                    {stageTopics.map((topic, _ti) => {
                                        const progress = getSQLTopicProgress(topic.id);
                                        return (
                                            <div key={topic.id}
                                                onClick={() => navigate(`/sql-path/${topic.id}`)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '14px 16px', marginBottom: 8, borderRadius: 12, cursor: 'pointer',
                                                    background: c.topicBg, border: `1px solid ${c.topicBorder}`,
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = `${topic.color}08`; e.currentTarget.style.borderColor = `${topic.color}20`; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = c.topicBg; e.currentTarget.style.borderColor = c.topicBorder; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                    <span style={{
                                                        width: 40, height: 40, borderRadius: 10, background: `${topic.color}12`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                                                    }}>{topic.icon}</span>
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 600, color: c.pageText }}>{topic.title}</div>
                                                        <div style={{ fontSize: 11, color: c.mutedDark, maxWidth: 400 }}>{topic.description}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: topic.color }}>{progress.masteryPercent}%</div>
                                                        <div style={{ fontSize: 10, color: c.mutedDarker }}>{topic.difficulty}</div>
                                                    </div>
                                                    <div style={{
                                                        width: 4, height: 36, borderRadius: 2, background: c.barTrack, overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: '100%', height: `${progress.masteryPercent}%`, background: topic.color,
                                                            borderRadius: 2, transition: 'height 0.5s', marginTop: 'auto'
                                                        }} />
                                                    </div>
                                                    <ChevronRight size={16} style={{ color: c.chevronColor }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
