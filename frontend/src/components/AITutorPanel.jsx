import React, { useState, useRef, useEffect } from 'react';
import './AITutorPanel.css';
import { Brain, X, ChevronDown, ChevronUp, Sparkles, Send, ArrowLeft } from 'lucide-react';
import {
    getDSAPatternGuide, getDSAProblemAnalysis, getCodeReview,
    getSQLTopicGuide, getSQLQueryHelp, getAptitudeTopicGuide,
    getAptitudeProblemHelp, generateLearningPath, getTutorActions,
    getAvailableDSATopics, getAvailableSQLConcepts, getAvailableAptitudeCategories,
} from '../data/tutorEngine';

// ─── Typing animation hook ───
function useTypingAnimation(text, speed = 12) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (!text) { setDisplayed(''); setDone(true); return; }
        setDisplayed('');
        setDone(false);
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) { clearInterval(timer); setDone(true); }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);
    return { displayed, done };
}

// ─── Content Card ───
function ContentCard({ title, color, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="tutor-card" style={{ borderColor: color || '#818cf8' }}>
            <button className="tutor-card-header" onClick={() => setOpen(!open)}>
                <span className="tutor-card-title">{title}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && <div className="tutor-card-body">{children}</div>}
        </div>
    );
}

// ─── Render structured content ───
function TutorContent({ data }) {
    if (!data) return null;

    // DSA Pattern Guide
    if (data.intuition) {
        return (
            <div className="tutor-guide">
                <ContentCard title={data.intuition.heading} color={data.color}>
                    <p className="tutor-text">{data.intuition.description}</p>
                    {data.intuition.concepts.map((c, i) => (
                        <div key={i} className="tutor-concept-group">
                            <h5>{c.title}</h5>
                            <ul>{c.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                        </div>
                    ))}
                    {data.intuition.example && (
                        <div className="tutor-visual-block">
                            <h5>{data.intuition.example.title}</h5>
                            {data.intuition.example.steps.map((s, i) => (
                                <p key={i} className="tutor-step">
                                    <span className="step-num">{i + 1}</span> {s}
                                </p>
                            ))}
                            {data.intuition.example.visual && (
                                <pre className="tutor-ascii">{data.intuition.example.visual}</pre>
                            )}
                        </div>
                    )}
                </ContentCard>

                <ContentCard title={data.buildup.heading} color={data.color} defaultOpen={false}>
                    {data.buildup.sections.map((s, i) => (
                        <div key={i} className="tutor-buildup-section">
                            <h5>{s.title}</h5>
                            {s.steps.map((step, j) => (
                                <p key={j} className="tutor-step">
                                    <span className="step-num">{j + 1}</span> {step}
                                </p>
                            ))}
                            {s.visual && <pre className="tutor-ascii">{s.visual}</pre>}
                            {s.code && (
                                <div className="tutor-code-block">
                                    <div className="tutor-code-lang">{s.code.language} — {s.code.title}</div>
                                    <pre><code>{s.code.code}</code></pre>
                                </div>
                            )}
                        </div>
                    ))}
                </ContentCard>

                <ContentCard title={data.template.heading} color={data.color} defaultOpen={false}>
                    <h5>When to Apply</h5>
                    {data.template.whenToApply.map((w, i) => (
                        <div key={i} className="tutor-when-item">
                            <span className="tutor-condition">"{w.condition}"</span>
                            <span className="tutor-arrow">→</span>
                            <span className="tutor-action">{w.action}</span>
                        </div>
                    ))}
                    <h5 style={{ marginTop: 16 }}>Invariants</h5>
                    <ul>{data.template.invariants.map((inv, i) => <li key={i}>{inv}</li>)}</ul>
                </ContentCard>

                <ContentCard title={data.deepDive.heading} color={data.color} defaultOpen={false}>
                    <h5>Edge Cases & Pitfalls</h5>
                    <ul className="tutor-pitfalls">
                        {data.deepDive.edgeCases.map((e, i) => (
                            <li key={i}>⚠️ {e}</li>
                        ))}
                    </ul>
                </ContentCard>

                <ContentCard title={data.tricks.heading} color={data.color} defaultOpen={false}>
                    {data.tricks.items.map((t, i) => (
                        <div key={i} className="tutor-trick">
                            <h5>{t.name}</h5>
                            <p>{t.tip}</p>
                            <div className="tutor-trick-meta">
                                <span className="tutor-when">✅ When: {t.when}</span>
                                {t.avoid !== 'N/A' && <span className="tutor-avoid">❌ Avoid: {t.avoid}</span>}
                            </div>
                        </div>
                    ))}
                    <h5 style={{ marginTop: 16 }}>🎤 Interview Tips</h5>
                    <ul>{data.tricks.interviewTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </ContentCard>

                <ContentCard title={data.practice.heading} color={data.color} defaultOpen={false}>
                    <div className="tutor-practice-list">
                        {data.practice.problems.map((p, i) => (
                            <div key={i} className="tutor-practice-item">
                                <span className={`diff-badge ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                                <span className="tutor-problem-title">{p.title}</span>
                                <span className="tutor-sub-pattern">{p.pattern}</span>
                            </div>
                        ))}
                    </div>
                </ContentCard>
            </div>
        );
    }

    // Problem Analysis
    if (data.classification) {
        return (
            <div className="tutor-guide">
                <ContentCard title="🏷️ Classification" color="#818cf8">
                    <p><strong>Topic:</strong> {data.classification.topic}</p>
                    <p><strong>Pattern:</strong> {data.classification.pattern}</p>
                </ContentCard>
                {data.recognition && (
                    <ContentCard title={data.recognition.heading} color="#22d3ee" defaultOpen={false}>
                        {data.recognition.generalClues.map((c, i) => (
                            <div key={i} className="tutor-when-item">
                                <span className="tutor-condition">{c.split('→')[0]}</span>
                                <span className="tutor-arrow">→</span>
                                <span className="tutor-action">{c.split('→')[1]}</span>
                            </div>
                        ))}
                    </ContentCard>
                )}
                <ContentCard title={data.approach.heading} color="#34d399" defaultOpen>
                    <p><strong>Pattern:</strong> {data.approach.pattern}</p>
                    {data.approach.steps.map((s, i) => (
                        <p key={i} className="tutor-step">
                            <span className="step-num">{i + 1}</span> {s}
                        </p>
                    ))}
                </ContentCard>
                {data.hints.length > 0 && (
                    <ContentCard title="💡 Hints" color="#f59e0b" defaultOpen={false}>
                        {data.hints.map((h, i) => (
                            <p key={i} className="tutor-hint">
                                <strong>Level {h.level}:</strong> {h.text}
                            </p>
                        ))}
                    </ContentCard>
                )}
            </div>
        );
    }

    // Code Review
    if (data.detected) {
        return (
            <div className="tutor-guide">
                <ContentCard title={data.heading} color="#818cf8">
                    <p><strong>Detected Pattern:</strong> {data.detected.pattern}</p>
                    <p><strong>Estimated Complexity:</strong> Time {data.complexity.time}, Space {data.complexity.space}</p>
                    <p>{data.complexity.note}</p>
                </ContentCard>
                {data.issues.length > 0 && (
                    <ContentCard title={`Issues (${data.issues.length})`} color="#ef4444">
                        {data.issues.map((issue, i) => (
                            <div key={i} className="tutor-issue">
                                <span>{issue.icon}</span>
                                <div>
                                    <strong>{issue.title}</strong>
                                    <p>{issue.message}</p>
                                </div>
                            </div>
                        ))}
                    </ContentCard>
                )}
                <div className="tutor-summary-box">
                    <p>{data.summary}</p>
                </div>
            </div>
        );
    }

    // SQL Guide
    if (data.syntax || data.whenToUse) {
        return (
            <div className="tutor-guide">
                <ContentCard title={`${data.icon} ${data.title}`} color="#60a5fa">
                    <p>{data.description}</p>
                    <p><strong>When to use:</strong> {data.whenToUse}</p>
                </ContentCard>
                <ContentCard title="📝 Syntax" color="#60a5fa" defaultOpen={false}>
                    <pre className="tutor-code-block"><code>{data.syntax}</code></pre>
                </ContentCard>
                {data.visual && (
                    <ContentCard title="📊 Visual" color="#60a5fa" defaultOpen={false}>
                        <pre className="tutor-ascii">{data.visual}</pre>
                    </ContentCard>
                )}
                <ContentCard title="⚠️ Common Pitfalls" color="#f59e0b" defaultOpen={false}>
                    <ul>{data.pitfalls?.map((p, i) => <li key={i}>⚠️ {p}</li>)}</ul>
                </ContentCard>
                {data.practicePrompts && (
                    <ContentCard title="🎯 Practice" color="#34d399" defaultOpen={false}>
                        {data.practicePrompts.map((p, i) => (
                            <div key={i} className="tutor-practice-item">
                                <span className={`diff-badge ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                                <span className="tutor-problem-title">{p.title}</span>
                                <span className="tutor-sub-pattern">{p.hint}</span>
                            </div>
                        ))}
                    </ContentCard>
                )}
            </div>
        );
    }

    // Aptitude Guide
    if (data.formulas) {
        return (
            <div className="tutor-guide">
                <ContentCard title={data.formulas.heading} color={data.color} defaultOpen>
                    {data.formulas.sheets.map((sheet, i) => (
                        <div key={i} className="tutor-formula-sheet">
                            <h5>{sheet.topic}</h5>
                            <ul>{sheet.formulas.map((f, j) => <li key={j}>{f}</li>)}</ul>
                        </div>
                    ))}
                </ContentCard>
                <ContentCard title={data.quickMethods.heading} color={data.color} defaultOpen={false}>
                    {data.quickMethods.tips.map((t, i) => (
                        <div key={i} className="tutor-trick">
                            <h5>{t.method}</h5>
                            <p>{t.tip}</p>
                        </div>
                    ))}
                </ContentCard>
                <ContentCard title={data.shortcuts.heading} color={data.color} defaultOpen={false}>
                    <ul>{data.shortcuts.tips.map((t, i) => <li key={i}>💡 {t}</li>)}</ul>
                </ContentCard>
            </div>
        );
    }

    // Learning Path
    if (data.weeks) {
        return (
            <div className="tutor-guide">
                <ContentCard title={data.heading} color="#818cf8" defaultOpen>
                    <p>{data.description}</p>
                    <p><strong>Daily goal:</strong> {data.dailyPlan}</p>
                    <p><strong>Level:</strong> {data.level} | <strong>Topics:</strong> {data.totalTopics}</p>
                </ContentCard>
                {data.weeks.map((w, i) => (
                    <ContentCard key={i} title={w.label} color="#818cf8" defaultOpen={i < 2}>
                        <p className="tutor-daily-goal">{w.dailyGoal} • {w.difficultyMix}</p>
                        {w.topics.map((t, j) => (
                            <div key={j} className="tutor-path-topic">
                                <span>{t.icon}</span>
                                <span className="tutor-problem-title">{t.title}</span>
                                <span className={`diff-badge ${t.difficulty.toLowerCase().replace('–', '-')}`}>{t.difficulty}</span>
                                <span className="tutor-sub-pattern">{t.estimatedTime}</span>
                            </div>
                        ))}
                    </ContentCard>
                ))}
                <ContentCard title="💡 Tips" color="#34d399" defaultOpen={false}>
                    <ul>{data.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </ContentCard>
            </div>
        );
    }

    // SQL Query Help
    if (data.approach?.heading === '🗺️ Query Building Steps') {
        return (
            <div className="tutor-guide">
                <ContentCard title="🗺️ Query Building Steps" color="#60a5fa">
                    {data.approach.concepts.length > 0 && (
                        <p><strong>Concepts used:</strong> {data.approach.concepts.join(', ')}</p>
                    )}
                    {data.approach.steps.map((s, i) => (
                        <p key={i} className="tutor-step">
                            <span className="step-num">{i + 1}</span> {s}
                        </p>
                    ))}
                </ContentCard>
                {data.hints.length > 0 && (
                    <ContentCard title="💡 Hints" color="#f59e0b" defaultOpen={false}>
                        {data.hints.map((h, i) => (
                            <p key={i}><strong>Hint {h.level}:</strong> {h.text}</p>
                        ))}
                    </ContentCard>
                )}
            </div>
        );
    }

    // Aptitude problem help
    if (data.interpretation) {
        return (
            <div className="tutor-guide">
                <ContentCard title={data.interpretation.heading} color="#818cf8">
                    <p>{data.interpretation.text}</p>
                </ContentCard>
                <ContentCard title={data.approach.heading} color="#34d399">
                    {data.approach.formula && <p className="tutor-formula">📐 {data.approach.formula}</p>}
                    {data.approach.steps.map((s, i) => (
                        <p key={i} className="tutor-step">
                            <span className="step-num">{i + 1}</span> {s}
                        </p>
                    ))}
                </ContentCard>
                {data.answer.explanation && (
                    <ContentCard title={data.answer.heading} color="#f59e0b" defaultOpen={false}>
                        <p>{data.answer.explanation}</p>
                    </ContentCard>
                )}
            </div>
        );
    }

    // Generic fallback
    return <pre className="tutor-fallback">{JSON.stringify(data, null, 2)}</pre>;
}

// ═══════════════════════════════════════════════════════
// MAIN AI TUTOR PANEL
// ═══════════════════════════════════════════════════════

/**
 * AITutorPanel — Reusable collapsible panel for AI-guided learning.
 *
 * Props:
 * - mode: 'dsa-learn' | 'dsa-code' | 'sql' | 'aptitude' | 'hub'
 * - contextData: { topicId?, problemId?, code?, language?, question? }
 * - onClose: callback to close/toggle
 * - visible: boolean
 */
export default function AITutorPanel({ mode = 'hub', contextData = {}, onClose, visible = true }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const actions = getTutorActions(mode, contextData);

    const handleAction = (actionId) => {
        setLoading(true);
        let result = null;
        let label = '';

        try {
            switch (actionId) {
                case 'teach-pattern':
                case 'dsa': {
                    const topicId = contextData.topicId || 'arrays-strings';
                    result = getDSAPatternGuide(topicId);
                    label = `Pattern Guide: ${result?.title || topicId}`;
                    break;
                }
                case 'show-template': {
                    const guide = getDSAPatternGuide(contextData.topicId || 'arrays-strings');
                    result = guide ? { ...guide.template, heading: guide.template.heading, color: guide.color, invariants: guide.template.invariants, whenToApply: guide.template.whenToApply } : null;
                    label = 'Pattern Template';
                    break;
                }
                case 'deep-dive': {
                    const g = getDSAPatternGuide(contextData.topicId || 'arrays-strings');
                    result = g ? { deepDive: g.deepDive, tricks: g.tricks, color: g.color } : null;
                    // Render as custom cards
                    if (result) {
                        result = getDSAPatternGuide(contextData.topicId || 'arrays-strings');
                    }
                    label = 'Deep Dive';
                    break;
                }
                case 'tricks': {
                    const gg = getDSAPatternGuide(contextData.topicId || 'arrays-strings');
                    result = gg;
                    label = 'Tricks & Tips';
                    break;
                }
                case 'practice': {
                    const ggg = getDSAPatternGuide(contextData.topicId || 'arrays-strings');
                    result = ggg;
                    label = 'Practice Problems';
                    break;
                }
                case 'show-approach':
                case 'what-pattern': {
                    result = getDSAProblemAnalysis(contextData.problemId);
                    label = `Problem Analysis: ${result?.problem?.title || contextData.problemId}`;
                    break;
                }
                case 'analyze-code': {
                    result = getCodeReview(contextData.code || '', contextData.language || 'javascript', contextData.problemId);
                    label = 'Code Review';
                    break;
                }
                case 'hint': {
                    const analysis = getDSAProblemAnalysis(contextData.problemId);
                    result = analysis;
                    label = 'Hints';
                    break;
                }
                case 'optimize': {
                    result = getCodeReview(contextData.code || '', contextData.language || 'javascript', contextData.problemId);
                    label = 'Optimization Tips';
                    break;
                }
                case 'edge-cases': {
                    const a = getDSAProblemAnalysis(contextData.problemId);
                    result = a;
                    label = 'Edge Cases';
                    break;
                }
                case 'sql-help': {
                    result = getSQLQueryHelp(contextData.problemId);
                    label = 'SQL Query Help';
                    break;
                }
                case 'sql-concept':
                case 'sql': {
                    result = getSQLTopicGuide(contextData.sqlConcept || 'joins');
                    label = `SQL: ${result?.title || 'Concept Guide'}`;
                    break;
                }
                case 'sql-optimize': {
                    result = getSQLQueryHelp(contextData.problemId);
                    label = 'SQL Optimization';
                    break;
                }
                case 'show-formulas':
                case 'aptitude': {
                    result = getAptitudeTopicGuide(contextData.category || 'quantitative');
                    label = `Aptitude: ${result?.title || 'Guide'}`;
                    break;
                }
                case 'walk-through': {
                    result = getAptitudeProblemHelp(contextData.question);
                    label = 'Step-by-Step Solution';
                    break;
                }
                case 'shortcut': {
                    result = getAptitudeTopicGuide(contextData.category || 'quantitative');
                    label = 'Shortcuts & Tricks';
                    break;
                }
                case 'path': {
                    result = generateLearningPath(contextData.days || 60, contextData.level || 'intermediate');
                    label = 'Learning Path';
                    break;
                }
                default:
                    result = { error: 'Unknown action' };
                    label = 'Unknown';
            }
        } catch (err) {
            console.error('Tutor error:', err);
            result = null;
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'tutor', label, data: result, timestamp: Date.now() }]);
            setLoading(false);
        }, 300);
    };

    if (!visible) return null;

    return (
        <div className="tutor-panel">
            {/* Header */}
            <div className="tutor-panel-header">
                <div className="tutor-panel-brand">
                    <Brain size={20} className="tutor-brain-icon" />
                    <span>AI Tutor</span>
                    <span className="tutor-mode-badge">{mode.replace('-', ' ')}</span>
                </div>
                {onClose && (
                    <button className="tutor-close-btn" onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="tutor-messages" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="tutor-welcome">
                        <Sparkles size={32} className="tutor-welcome-icon" />
                        <h4>Hi! I'm your AI Tutor 🎓</h4>
                        <p>Choose an action below to get started, or ask me anything about DSA patterns, SQL, or aptitude.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className="tutor-message tutor-msg-tutor">
                        <div className="tutor-msg-label">{msg.label}</div>
                        {msg.data ? (
                            <TutorContent data={msg.data} />
                        ) : (
                            <p className="tutor-error">Sorry, I couldn't find content for that. Try a different action or check the context.</p>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="tutor-message tutor-msg-loading">
                        <div className="tutor-typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="tutor-quick-actions">
                {actions.map(action => (
                    <button
                        key={action.id}
                        className="tutor-action-btn"
                        onClick={() => handleAction(action.id)}
                        disabled={loading}
                    >
                        <span>{action.icon}</span>
                        <span>{action.label.replace(action.icon, '').trim()}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
