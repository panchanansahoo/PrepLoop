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
import './LearningPath.css';

const TABS = [
    { id: 'concepts', label: 'Concept & Patterns', icon: <BookOpen size={15} />, color: '#22d3ee' },
    { id: 'thinking', label: 'How to Solve', icon: <Zap size={15} />, color: '#34d399' },
    { id: 'tricks', label: 'Tricks & Pitfalls', icon: <Sparkles size={15} />, color: '#f472b6' },
    { id: 'practice', label: 'Practice', icon: <Target size={15} />, color: '#facc15' },
];

/* ─── Theory Section Renderer ─── */
function TheorySection({ section, topic, index }) {
    return (
        <div className="lp-topic-section">
            <div className="lp-topic-section-header" style={{ background: `linear-gradient(135deg, ${topic.color}08, transparent)` }}>
                <h3 className="lp-topic-section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="lp-topic-section-number" style={{ background: `${topic.color}18`, color: topic.color }}>{index + 1}</span>
                    {section.title}
                </h3>
            </div>
            <div className="lp-topic-section-body">
                {section.steps && (
                    <div style={{ marginBottom: section.visual || section.code ? 20 : 0 }}>
                        {section.steps.map((step, si) => (
                            <div key={si} className="lp-topic-step-item">
                                <span className="lp-topic-step-num" style={{ background: `${topic.color}15`, color: topic.color }}>{si + 1}</span>
                                <span className="lp-topic-step-text">{step}</span>
                            </div>
                        ))}
                    </div>
                )}
                {section.visual && (
                    <div style={{ marginBottom: section.code ? 20 : 0 }}>
                        <div className="lp-topic-visual-label">
                            <span style={{ fontSize: 14 }}>🖼️</span>
                            <span>Visual Diagram</span>
                        </div>
                        <div className="lp-topic-visual">
                            <pre>{section.visual}</pre>
                        </div>
                    </div>
                )}
                {section.code && (
                    <div>
                        <div className="lp-topic-code-header">
                            <div className="lp-topic-code-title">
                                <Code2 size={14} style={{ color: '#34d399' }} />
                                <span>{section.code.title}</span>
                            </div>
                            <span className="lp-topic-code-lang">{section.code.language}</span>
                        </div>
                        <div className="lp-topic-code">
                            <pre>{section.code.code}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Concepts Tab ─── */
function ConceptsTab({ topic, progress, onComplete }) {
    const theory = sqlTheoryData[topic.id];
    return (
        <div>
            {theory && theory.sections && (
                <div style={{ marginBottom: 28 }}>
                    <div className="lp-topic-banner lp-topic-banner--theory" style={{
                        background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(244,114,182,0.05))',
                        borderColor: 'rgba(34,211,238,0.15)'
                    }}>
                        <BookOpen size={16} style={{ color: '#22d3ee' }} />
                        <span className="lp-topic-banner-title" style={{ color: '#67e8f9' }}>📚 Deep Dive Theory</span>
                        <span className="lp-topic-banner-count">{theory.sections.length} lessons</span>
                    </div>
                    {theory.sections.map((section, si) => (
                        <TheorySection key={si} section={section} topic={topic} index={si} />
                    ))}
                </div>
            )}

            <h3 className="lp-topic-heading--sub">⚡ Quick Reference</h3>
            {topic.concepts.map((section, si) => (
                <div key={si} className="lp-topic-ref-card">
                    <h4 className="lp-topic-ref-title">
                        <BookOpen size={14} style={{ color: topic.color }} /> {section.title}
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {section.points.map((p, pi) => (
                            <li key={pi} className="lp-topic-ref-item">
                                <span style={{ color: topic.color, fontSize: 12, marginTop: 2 }}>▸</span>
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}

            {topic.invariants && topic.invariants.length > 0 && (
                <div className="lp-topic-invariants" style={{ background: `${topic.color}08`, border: `1px solid ${topic.color}20` }}>
                    <h3 className="lp-topic-heading--sub">
                        <Lightbulb size={16} style={{ color: '#facc15' }} /> Key Rules & Invariants
                    </h3>
                    {topic.invariants.map((inv, i) => (
                        <div key={i} className="lp-topic-invariant" style={{ color: '#67e8f9' }}>{inv}</div>
                    ))}
                </div>
            )}

            <div className="lp-topic-complete-wrap">
                <button onClick={onComplete} disabled={progress.conceptComplete}
                    className={`lp-topic-complete-btn ${progress.conceptComplete ? 'lp-topic-complete-btn--done' : ''}`}
                    style={!progress.conceptComplete ? { background: `${topic.color}20`, color: topic.color, cursor: 'pointer' } : {}}>
                    {progress.conceptComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Thinking Tab ─── */
function ThinkingTab({ topic, progress, onComplete }) {
    return (
        <div>
            <div className="lp-topic-banner lp-topic-banner--thinking">
                <h3 className="lp-topic-heading" style={{ marginBottom: 6 }}>
                    <Zap size={16} style={{ color: '#34d399' }} /> Decision Tree
                </h3>
                <p style={{ fontSize: 12, color: '#71717a', margin: 0, marginBottom: 16 }}>Use this framework to quickly identify the right SQL approach:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    {topic.thinkingFramework.map((rule, i) => (
                        <div key={i} className="lp-topic-decision">
                            <div className="lp-topic-decision-condition">{rule.condition}</div>
                            <ChevronRight size={16} className="lp-topic-decision-arrow" />
                            <div className="lp-topic-decision-action">{rule.action}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lp-topic-complete-wrap">
                <button onClick={onComplete} disabled={progress.thinkingComplete}
                    className={`lp-topic-complete-btn ${progress.thinkingComplete ? 'lp-topic-complete-btn--done' : ''}`}
                    style={!progress.thinkingComplete ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', cursor: 'pointer' } : {}}>
                    {progress.thinkingComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Tricks Tab ─── */
function TricksTab({ topic, progress, onComplete }) {
    return (
        <div>
            <h3 className="lp-topic-heading">
                <Sparkles size={16} style={{ color: '#f472b6' }} /> Tips & Shortcuts
            </h3>
            {topic.tricks && topic.tricks.length > 0 ? (
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                    {topic.tricks.map((trick, i) => (
                        <div key={i} className="lp-topic-trick">
                            <div className="lp-topic-trick-name">{trick.name}</div>
                            <div className="lp-topic-trick-tip">{trick.tip}</div>
                            <div className="lp-topic-trick-tags">
                                <span className="lp-topic-trick-tag lp-topic-trick-tag--when">✓ When: {trick.when}</span>
                                {trick.avoid !== 'N/A' && (
                                    <span className="lp-topic-trick-tag lp-topic-trick-tag--avoid">✕ Avoid: {trick.avoid}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#52525b', fontSize: 13, marginBottom: 24 }}>
                    No specific tricks for this topic. Focus on the concepts and invariants!
                </div>
            )}

            <h3 className="lp-topic-heading">
                <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> Common Pitfalls
            </h3>
            <div className="lp-topic-banner lp-topic-banner--pitfalls">
                {topic.pitfalls.map((pit, i) => (
                    <div key={i} className="lp-topic-pitfall">
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} /> {pit}
                    </div>
                ))}
            </div>

            <div className="lp-topic-complete-wrap">
                <button onClick={onComplete} disabled={progress.tricksComplete}
                    className={`lp-topic-complete-btn ${progress.tricksComplete ? 'lp-topic-complete-btn--done' : ''}`}
                    style={!progress.tricksComplete ? { background: 'rgba(244,114,182,0.12)', color: '#f472b6', cursor: 'pointer' } : {}}>
                    {progress.tricksComplete ? <><Check size={16} /> Completed</> : 'Mark as Learned ✓'}
                </button>
            </div>
        </div>
    );
}

/* ─── Practice Tab ─── */
function PracticeTab({ topic, progress }) {
    if (!topic.practiceProblems || topic.practiceProblems.length === 0) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#52525b' }}>
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
            <div className="lp-topic-progress">
                <span className="lp-topic-progress-label">{solved.size} / {topic.practiceProblems.length} solved</span>
                <div className="lp-topic-progress-track">
                    <div className="lp-topic-progress-fill" style={{
                        background: topic.color,
                        width: `${(solved.size / topic.practiceProblems.length) * 100}%`
                    }} />
                </div>
            </div>

            {groups.map((group, gi) => (
                <div key={gi} className="lp-topic-diff-group">
                    <h4 className="lp-topic-diff-title" style={{ color: group.color }}>
                        <span className="lp-topic-diff-dot" style={{ background: group.color }} />
                        {group.label} ({group.problems.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.problems.map((problem, pi) => {
                            const isSolved = solved.has(problem.id);
                            return (
                                <Link key={pi} to={`/sql-editor`}
                                    className={`lp-topic-problem ${isSolved ? 'lp-topic-problem--solved' : ''}`}
                                    style={{ background: isSolved ? undefined : group.bg }}>
                                    <div className="lp-topic-problem-info">
                                        {isSolved
                                            ? <CheckCircle2 size={16} style={{ color: '#34d399', flexShrink: 0 }} />
                                            : <Circle size={16} style={{ color: '#3f3f46', flexShrink: 0 }} />}
                                        <div>
                                            <div className="lp-topic-problem-title">{problem.title}</div>
                                            <div className="lp-topic-problem-pattern">{problem.pattern}</div>
                                        </div>
                                    </div>
                                    <span className="lp-topic-problem-diff" style={{ color: group.color, background: `${group.color}15` }}>{problem.difficulty}</span>
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
    const [activeTab, setActiveTab] = useState('concepts');
    const [refreshKey, setRefreshKey] = useState(0);

    const topic = useMemo(() => SQL_TOPICS.find(t => t.id === topicId), [topicId]);
    const progress = useMemo(() => getSQLTopicProgress(topicId), [topicId, refreshKey]);
    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    if (!topic) {
        return (
            <div className="lp-topic-not-found">
                <h2 style={{ fontSize: 24, marginBottom: 16 }}>Topic not found</h2>
                <button onClick={() => navigate('/sql-path')} className="lp-topic-btn lp-topic-btn--primary">
                    Back to SQL Path
                </button>
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
        <div className="lp-topic-page">
            <div className="lp-topic-container">
                <button onClick={() => navigate('/sql-path')} className="lp-topic-back">
                    <ArrowLeft size={16} /> Back to SQL Path
                </button>

                <div className="lp-topic-hero lp-topic-hero--sql">
                    <div>
                        <div className="lp-topic-hero-icon">{topic.icon}</div>
                        <h1 className="lp-topic-hero-title">{topic.title}</h1>
                        <p className="lp-topic-hero-desc">{topic.description}</p>
                        <div className="lp-topic-badges">
                            <span className="lp-topic-badge" style={{ background: `${topic.color}15`, color: topic.color }}>{topic.difficulty}</span>
                            <span className="lp-topic-badge lp-topic-badge--muted">
                                <Clock size={11} /> {topic.estimatedTime}
                            </span>
                            <span className="lp-topic-badge lp-topic-badge--muted">
                                {topic.practiceProblems.length} problems
                            </span>
                        </div>
                    </div>

                    <div className="lp-topic-mastery">
                        <div className="lp-topic-mastery-value" style={{ color: topic.color }}>{mastery}%</div>
                        <div className="lp-topic-mastery-label">Mastery</div>
                        <div className="lp-topic-steps">
                            {steps.map((s, i) => (
                                <div key={i} onClick={() => setActiveTab(s.tab)}
                                    className={`lp-topic-step ${s.done ? 'lp-topic-step--done' : ''}`}
                                    style={s.done ? { background: `${topic.color}12`, borderColor: `${topic.color}25` } : {}}>
                                    <div className="lp-topic-step-icon">{s.done ? '✅' : '○'}</div>
                                    <div className="lp-topic-step-label" style={s.done ? { color: topic.color } : {}}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lp-topic-tabs">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`lp-topic-tab ${activeTab === tab.id ? 'lp-topic-tab--active' : ''}`}
                            style={activeTab === tab.id ? { background: `${tab.color}15`, color: tab.color } : {}}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div>
                    {activeTab === 'concepts' && <ConceptsTab topic={topic} progress={progress} onComplete={handleConceptComplete} />}
                    {activeTab === 'thinking' && <ThinkingTab topic={topic} progress={progress} onComplete={handleThinkingComplete} />}
                    {activeTab === 'tricks' && <TricksTab topic={topic} progress={progress} onComplete={handleTricksComplete} />}
                    {activeTab === 'practice' && <PracticeTab topic={topic} progress={progress} />}
                </div>
            </div>
        </div>
    );
}
