import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, Zap, Sparkles, Target, Check, ChevronRight, Clock,
    AlertTriangle, Lightbulb, Code2, CheckCircle2, Circle
} from 'lucide-react';
import { SQL_TOPICS } from '../data/sqlLearningPathData';
import { sqlTheoryData } from '../data/sqlTheoryData';
import {
    getSQLTopicProgress, markSQLConceptComplete, markSQLThinkingComplete,
    markSQLTricksComplete
} from '../data/sqlLearningProgress';
import { useTheme } from '../context/ThemeContext';

const TABS = [
    { id: 'concepts', label: 'Concept & Patterns', icon: <BookOpen size={15} />, color: '#22d3ee' },
    { id: 'thinking', label: 'How to Solve', icon: <Zap size={15} />, color: '#34d399' },
    { id: 'tricks', label: 'Tricks & Pitfalls', icon: <Sparkles size={15} />, color: '#f472b6' },
    { id: 'practice', label: 'Practice', icon: <Target size={15} />, color: '#facc15' },
];

/* ─── Theme colors helper ─── */
function useColors() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    return {
        isLight,
        pageBg: isLight ? '#f8f9fc' : '#030303',
        pageText: isLight ? '#1f2937' : '#fff',
        muted: isLight ? '#6b7280' : '#71717a',
        mutedDark: isLight ? '#9ca3af' : '#52525b',
        bodyText: isLight ? '#374151' : '#d4d4d8',
        cardBg: isLight ? '#fff' : 'rgba(255,255,255,0.02)',
        cardBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        stepBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        stepBorder: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.03)',
        codeBg: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.4)',
        codeBorder: isLight ? 'rgba(34,211,238,0.2)' : 'rgba(34,211,238,0.15)',
        codeColor: isLight ? '#0891b2' : '#67e8f9',
        code2Bg: isLight ? '#f0fdf4' : 'rgba(0,0,0,0.5)',
        code2Border: isLight ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.12)',
        code2Color: isLight ? '#059669' : '#a7f3d0',
        rulesBg: isLight ? '#f0fdfa' : 'rgba(0,0,0,0.3)',
        rulesBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        rulesColor: isLight ? '#0891b2' : '#67e8f9',
        thinkingBg: isLight ? '#ecfdf5' : 'rgba(0,0,0,0.3)',
        thinkingBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        pitfallBg: isLight ? '#fffbeb' : 'rgba(0,0,0,0.2)',
        tabsBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.02)',
        tabsBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        inactiveTab: isLight ? '#6b7280' : '#71717a',
        progressTrack: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        stepNotDoneBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.03)',
        stepNotDoneBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
        notDoneStepText: isLight ? '#9ca3af' : '#525252',
        unsolved: isLight ? '#d1d5db' : '#3f3f46',
        problemTitle: isLight ? '#1f2937' : '#fff',
        tagBg: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)',
    };
}

/* ─── Theory Section Renderer ─── */
function TheorySection({ section, topic, index, c }) {
    return (
        <div style={{
            marginBottom: 24, background: c.cardBg, border: `1px solid ${c.cardBorder}`,
            borderRadius: 16, overflow: 'hidden'
        }}>
            <div style={{
                padding: '18px 24px', background: `linear-gradient(135deg, ${topic.color}08, transparent)`,
                borderBottom: `1px solid ${c.stepBorder}`
            }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: c.pageText, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        width: 28, height: 28, borderRadius: 8, background: `${topic.color}18`, color: topic.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800
                    }}>{index + 1}</span>
                    {section.title}
                </h3>
            </div>
            <div style={{ padding: 24 }}>
                {section.steps && (
                    <div style={{ marginBottom: section.visual || section.code ? 20 : 0 }}>
                        {section.steps.map((step, si) => (
                            <div key={si} style={{
                                display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10,
                                padding: '10px 14px', borderRadius: 10, background: c.stepBg,
                                border: `1px solid ${c.stepBorder}`
                            }}>
                                <span style={{
                                    minWidth: 24, height: 24, borderRadius: '50%', background: `${topic.color}15`,
                                    color: topic.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1
                                }}>{si + 1}</span>
                                <span style={{ fontSize: 13, color: c.bodyText, lineHeight: 1.7 }}>{step}</span>
                            </div>
                        ))}
                    </div>
                )}
                {section.visual && (
                    <div style={{ marginBottom: section.code ? 20 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 14 }}>🖼️</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Visual Diagram</span>
                        </div>
                        <div style={{
                            padding: '18px 20px', borderRadius: 12, background: c.codeBg,
                            border: `1px solid ${c.codeBorder}`, overflow: 'auto'
                        }}>
                            <pre style={{
                                margin: 0, fontSize: 12, lineHeight: 1.7, color: c.codeColor,
                                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                                whiteSpace: 'pre', overflowX: 'auto'
                            }}>{section.visual}</pre>
                        </div>
                    </div>
                )}
                {section.code && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Code2 size={14} style={{ color: '#34d399' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {section.code.title}
                                </span>
                            </div>
                            <span style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                                background: 'rgba(52,211,153,0.1)', color: '#34d399', fontWeight: 600
                            }}>{section.code.language}</span>
                        </div>
                        <div style={{
                            padding: '18px 20px', borderRadius: 12, background: c.code2Bg,
                            border: `1px solid ${c.code2Border}`, overflow: 'auto'
                        }}>
                            <pre style={{
                                margin: 0, fontSize: 12, lineHeight: 1.6, color: c.code2Color,
                                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                                whiteSpace: 'pre', overflowX: 'auto'
                            }}>{section.code.code}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Concepts Tab ─── */
function ConceptsTab({ topic, progress, onComplete, c }) {
    const theory = sqlTheoryData[topic.id];
    return (
        <div>
            {theory && theory.sections && (
                <div style={{ marginBottom: 28 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                        padding: '10px 16px', borderRadius: 10,
                        background: c.isLight ? 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(244,114,182,0.03))' : 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(244,114,182,0.05))',
                        border: `1px solid ${c.codeBorder}`
                    }}>
                        <BookOpen size={16} style={{ color: '#22d3ee' }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.isLight ? '#0891b2' : '#67e8f9' }}>📚 Deep Dive Theory</span>
                        <span style={{ fontSize: 11, color: c.muted, marginLeft: 'auto' }}>{theory.sections.length} lessons</span>
                    </div>
                    {theory.sections.map((section, si) => (
                        <TheorySection key={si} section={section} topic={topic} index={si} c={c} />
                    ))}
                </div>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚡ Quick Reference
            </h3>
            {topic.concepts.map((section, si) => (
                <div key={si} style={{
                    marginBottom: 16, background: c.cardBg, border: `1px solid ${c.cardBorder}`,
                    borderRadius: 14, padding: 20
                }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={14} style={{ color: topic.color }} /> {section.title}
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {section.points.map((p, pi) => (
                            <li key={pi} style={{
                                padding: '8px 12px', marginBottom: 4, borderRadius: 6, background: c.stepBg,
                                fontSize: 12, color: c.bodyText, lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start'
                            }}>
                                <span style={{ color: topic.color, fontSize: 12, marginTop: 2 }}>▸</span>
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
            {topic.invariants && topic.invariants.length > 0 && (
                <div style={{
                    marginBottom: 20, background: `${topic.color}08`, border: `1px solid ${topic.color}20`,
                    borderRadius: 14, padding: 24
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lightbulb size={16} style={{ color: '#facc15' }} /> Key Rules & Invariants
                    </h3>
                    {topic.invariants.map((inv, i) => (
                        <div key={i} style={{
                            padding: '10px 16px', marginBottom: 8, borderRadius: 8, background: c.rulesBg,
                            border: `1px solid ${c.rulesBorder}`, fontSize: 13, color: c.rulesColor,
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace', lineHeight: 1.6
                        }}>{inv}</div>
                    ))}
                </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={onComplete} disabled={progress.conceptComplete} style={{
                    padding: '12px 32px', borderRadius: 10, border: 'none', cursor: progress.conceptComplete ? 'default' : 'pointer',
                    background: progress.conceptComplete ? 'rgba(52,211,153,0.15)' : `${topic.color}20`,
                    color: progress.conceptComplete ? '#34d399' : topic.color, fontWeight: 700, fontSize: 14,
                    transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8
                }}>
                    {progress.conceptComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Thinking Tab ─── */
function ThinkingTab({ topic, progress, onComplete, c }) {
    return (
        <div>
            <div style={{
                marginBottom: 20, background: c.isLight ? 'rgba(52,211,153,0.04)' : 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 14, padding: 24
            }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={16} style={{ color: '#34d399' }} /> Decision Tree
                </h3>
                <p style={{ fontSize: 12, color: c.muted, marginBottom: 16 }}>Use this framework to quickly identify the right SQL approach:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topic.thinkingFramework.map((rule, i) => (
                        <div key={i} style={{
                            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center',
                            padding: '12px 16px', borderRadius: 10, background: c.thinkingBg,
                            border: `1px solid ${c.thinkingBorder}`
                        }}>
                            <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{rule.condition}</div>
                            <ChevronRight size={16} style={{ color: c.mutedDark }} />
                            <div style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>{rule.action}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={onComplete} disabled={progress.thinkingComplete} style={{
                    padding: '12px 32px', borderRadius: 10, border: 'none', cursor: progress.thinkingComplete ? 'default' : 'pointer',
                    background: progress.thinkingComplete ? 'rgba(52,211,153,0.15)' : 'rgba(52,211,153,0.12)',
                    color: '#34d399', fontWeight: 700, fontSize: 14,
                    transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8
                }}>
                    {progress.thinkingComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Tricks Tab ─── */
function TricksTab({ topic, progress, onComplete, c }) {
    return (
        <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: '#f472b6' }} /> Tips & Shortcuts
            </h3>
            {topic.tricks && topic.tricks.length > 0 ? (
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                    {topic.tricks.map((trick, i) => (
                        <div key={i} style={{
                            padding: '18px 20px', borderRadius: 12, background: c.isLight ? 'rgba(244,114,182,0.04)' : 'rgba(244,114,182,0.06)',
                            border: '1px solid rgba(244,114,182,0.15)'
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#f472b6', marginBottom: 6 }}>{trick.name}</div>
                            <div style={{ fontSize: 13, color: c.bodyText, lineHeight: 1.6, marginBottom: 8 }}>{trick.tip}</div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, color: '#34d399', padding: '3px 10px', borderRadius: 6, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                    ✓ When: {trick.when}
                                </span>
                                {trick.avoid !== 'N/A' && (
                                    <span style={{ fontSize: 11, color: '#f87171', padding: '3px 10px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                                        ✕ Avoid: {trick.avoid}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: 20, textAlign: 'center', color: c.mutedDark, fontSize: 13, marginBottom: 24 }}>
                    No specific tricks for this topic. Focus on the concepts and invariants!
                </div>
            )}

            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: c.pageText, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> Common Pitfalls
            </h3>
            <div style={{
                padding: '18px 20px', borderRadius: 12, background: c.isLight ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)'
            }}>
                {topic.pitfalls.map((pit, i) => (
                    <div key={i} style={{
                        padding: '8px 12px', marginBottom: i < topic.pitfalls.length - 1 ? 8 : 0,
                        borderRadius: 8, background: c.pitfallBg, fontSize: 13, color: '#fbbf24',
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {pit}
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button onClick={onComplete} disabled={progress.tricksComplete} style={{
                    padding: '12px 32px', borderRadius: 10, border: 'none', cursor: progress.tricksComplete ? 'default' : 'pointer',
                    background: progress.tricksComplete ? 'rgba(52,211,153,0.15)' : 'rgba(244,114,182,0.12)',
                    color: progress.tricksComplete ? '#34d399' : '#f472b6', fontWeight: 700, fontSize: 14,
                    transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8
                }}>
                    {progress.tricksComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Practice Tab ─── */
function PracticeTab({ topic, progress, c }) {
    if (!topic.practiceProblems || topic.practiceProblems.length === 0) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: c.mutedDark }}>
                <Target size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontSize: 14, marginBottom: 4 }}>No practice problems yet for this topic.</div>
                <div style={{ fontSize: 12 }}>Focus on mastering the theory and concepts!</div>
            </div>
        );
    }

    const solved = new Set(progress.solvedProblems || []);
    const groups = [
        { label: 'Easy', problems: topic.practiceProblems.filter(p => p.difficulty === 'Easy'), color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
        { label: 'Medium', problems: topic.practiceProblems.filter(p => p.difficulty === 'Medium'), color: '#facc15', bg: 'rgba(250,204,21,0.08)' },
        { label: 'Hard', problems: topic.practiceProblems.filter(p => p.difficulty === 'Hard'), color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
    ].filter(g => g.problems.length > 0);

    return (
        <div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: c.muted }}>{solved.size} / {topic.practiceProblems.length} solved</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: c.progressTrack }}>
                    <div style={{
                        height: '100%', borderRadius: 2, background: topic.color, transition: 'width 0.5s',
                        width: `${(solved.size / topic.practiceProblems.length) * 100}%`
                    }} />
                </div>
            </div>
            {groups.map((group, gi) => (
                <div key={gi} style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: group.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, display: 'inline-block' }} />
                        {group.label} ({group.problems.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.problems.map((problem, pi) => {
                            const isSolved = solved.has(problem.id);
                            return (
                                <Link key={pi} to={`/sql-editor`} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: 10, textDecoration: 'none',
                                    background: isSolved ? 'rgba(52,211,153,0.06)' : group.bg,
                                    border: `1px solid ${isSolved ? 'rgba(52,211,153,0.15)' : c.cardBorder}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {isSolved
                                            ? <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                                            : <Circle size={16} style={{ color: c.unsolved, flexShrink: 0 }} />}
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: c.problemTitle }}>{problem.title}</div>
                                            <div style={{ fontSize: 11, color: c.mutedDark }}>{problem.pattern}</div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                        color: group.color, background: `${group.color}15`
                                    }}>{problem.difficulty}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════ MAIN ═══════════════ */
export default function SQLTopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const c = useColors();
    const [activeTab, setActiveTab] = useState('concepts');
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => SQL_TOPICS.find(t => t.id === topicId), [topicId]);
    const progress = useMemo(() => getSQLTopicProgress(topicId), [topicId, refreshKey]);
    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: c.pageBg, color: c.pageText }}>
                <h2 style={{ fontSize: 24, marginBottom: 16 }}>Topic not found</h2>
                <button onClick={() => navigate('/sql-path')} style={{
                    padding: '10px 24px', borderRadius: 8, background: '#22d3ee', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600
                }}>Back to SQL Path</button>
            </div>
        );
    }

    const handleConceptComplete = () => { markSQLConceptComplete(topicId); refresh(); };
    const handleThinkingComplete = () => { markSQLThinkingComplete(topicId); refresh(); };
    const handleTricksComplete = () => { markSQLTricksComplete(topicId); refresh(); };

    const mastery = progress.masteryPercent;
    const steps = [
        { label: 'Concepts', done: progress.conceptComplete, tab: 'concepts' },
        { label: 'Thinking', done: progress.thinkingComplete, tab: 'thinking' },
        { label: 'Tricks', done: progress.tricksComplete, tab: 'tricks' },
        { label: 'Practice', done: progress.solved >= 5, tab: 'practice' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: c.pageBg, color: c.pageText, paddingBottom: 80 }}>
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 0' }}>
                <button onClick={() => navigate('/sql-path')} style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: c.muted, cursor: 'pointer', fontSize: 13, marginBottom: 20, padding: 0
                }}>
                    <ArrowLeft size={16} /> Back to SQL Path
                </button>

                <div style={{
                    background: `linear-gradient(135deg, ${topic.color}10, ${topic.color}05)`,
                    border: `1px solid ${topic.color}20`, borderRadius: 18, padding: '28px 32px', marginBottom: 28
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>{topic.icon}</div>
                            <h1 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, marginBottom: 6 }}>{topic.title}</h1>
                            <p style={{ fontSize: 14, color: c.muted, margin: 0, maxWidth: 500 }}>{topic.description}</p>
                            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: `${topic.color}15`, color: topic.color, fontWeight: 600 }}>{topic.difficulty}</span>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: c.tagBg, color: c.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={11} /> {topic.estimatedTime}
                                </span>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: c.tagBg, color: c.muted }}>
                                    {topic.practiceProblems.length} problems
                                </span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: topic.color }}>{mastery}%</div>
                            <div style={{ fontSize: 11, color: c.muted, marginBottom: 10 }}>Mastery</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {steps.map((s, i) => (
                                    <div key={i} onClick={() => setActiveTab(s.tab)} style={{
                                        textAlign: 'center', padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                                        background: s.done ? `${topic.color}12` : c.stepNotDoneBg,
                                        border: `1px solid ${s.done ? `${topic.color}25` : c.stepNotDoneBorder}`,
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ fontSize: 10 }}>{s.done ? '✅' : '○'}</div>
                                        <div style={{ fontSize: 8, color: s.done ? topic.color : c.notDoneStepText, fontWeight: 600 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex', gap: 4, marginBottom: 28, background: c.tabsBg,
                    borderRadius: 12, padding: 4, border: `1px solid ${c.tabsBorder}`
                }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                            color: activeTab === tab.id ? tab.color : c.inactiveTab,
                            fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 12,
                            transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'concepts' && <ConceptsTab topic={topic} progress={progress} onComplete={handleConceptComplete} c={c} />}
                    {activeTab === 'thinking' && <ThinkingTab topic={topic} progress={progress} onComplete={handleThinkingComplete} c={c} />}
                    {activeTab === 'tricks' && <TricksTab topic={topic} progress={progress} onComplete={handleTricksComplete} c={c} />}
                    {activeTab === 'practice' && <PracticeTab topic={topic} progress={progress} c={c} />}
                </div>
            </div>
        </div>
    );
}
