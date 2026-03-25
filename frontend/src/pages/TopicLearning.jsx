import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
    ArrowLeft, BookOpen, Zap, Sparkles, Target, Check, ChevronRight, Clock,
    Lightbulb, Eye, EyeOff, RotateCcw, Timer, CheckCircle2, XCircle, ChevronDown
} from 'lucide-react';
import { getTopicById } from '../data/learningPathData';
import {
    getTopicProgress, markTheoryComplete, markMethodLearned,
    markShortcutLearned, recordPracticeAttempt
} from '../data/learningPathProgress';

const TABS = [
    { id: 'theory', label: 'Theory & Formulas', icon: <BookOpen size={16} />, color: '#818cf8' },
    { id: 'methods', label: 'Quick Methods', icon: <Zap size={16} />, color: '#34d399' },
    { id: 'shortcuts', label: 'Tricks & Shortcuts', icon: <Sparkles size={16} />, color: '#f472b6' },
    { id: 'practice', label: 'Practice', icon: <Target size={16} />, color: '#facc15' },
];

/* ─── Flip Card ─── */
function FormulaCard({ formula, example, color, isLight }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div onClick={() => setFlipped(!flipped)} style={{
            perspective: 800, cursor: 'pointer', height: 140,
        }}>
            <div style={{
                width: '100%', height: '100%', position: 'relative',
                transformStyle: 'preserve-3d', transition: 'transform 0.5s',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
            }}>
                {/* Front */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    borderLeft: `3px solid ${color}`,
                }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isLight ? '#334155' : '#e4e4e7', lineHeight: 1.5 }}>{formula}</div>
                    <div style={{ fontSize: 11, color: isLight ? '#94a3b8' : '#525252', marginTop: 8 }}>Click to see example →</div>
                </div>
                {/* Back */}
                <div style={{
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: `${color}08`, border: `1px solid ${color}25`,
                    borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                    <div style={{ fontSize: 11, color: color, fontWeight: 700, marginBottom: 6 }}>EXAMPLE</div>
                    <div style={{ fontSize: 13, color: isLight ? '#475569' : '#a1a1aa', lineHeight: 1.6 }}>{example}</div>
                </div>
            </div>
        </div>
    );
}

/* ─── Theory Tab ─── */
function TheoryTab({ topic, progress, onComplete, isLight }) {
    return (
        <div>
            {topic.theory.sections.map((section, si) => (
                <div key={si} style={{ marginBottom: 40 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: topic.color, borderBottom: `2px solid ${topic.color}20`, paddingBottom: 8 }}>
                        {section.title}
                    </h3>
                    <div style={{ marginBottom: 24 }}>
                        {section.content?.map((text, ti) => (
                            <p key={ti} style={{ fontSize: 15, color: isLight ? '#475569' : '#a1a1aa', lineHeight: 1.7, marginBottom: 12 }}>
                                {text}
                            </p>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {section.formulas.map((f, fi) => (
                            <FormulaCard key={fi} formula={f.formula} example={f.example} color={topic.color} isLight={isLight} />
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={onComplete} disabled={progress.theoryComplete} style={{
                padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: progress.theoryComplete ? 'rgba(52,211,153,0.15)' : topic.gradient,
                color: progress.theoryComplete ? '#34d399' : '#fff',
                border: progress.theoryComplete ? '1px solid rgba(52,211,153,0.3)' : 'none',
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto',
            }}>
                {progress.theoryComplete ? <><CheckCircle2 size={16} /> Theory Complete</> : <><Check size={16} /> Mark Theory Complete</>}
            </button>
        </div>
    );
}

/* ─── Methods Tab ─── */
function MethodsTab({ topic, progress, onLearn, isLight }) {
    const [expanded, setExpanded] = useState(null);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topic.quickMethods.map((m, i) => {
                const learned = progress.methodsLearned.includes(m.id);
                const isOpen = expanded === i;
                return (
                    <div key={m.id} style={{
                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${learned ? `${topic.color}30` : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)')}`,
                        borderRadius: 14, overflow: 'hidden',
                    }}>
                        <div onClick={() => setExpanded(isOpen ? null : i)} style={{
                            padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, background: `${topic.color}12`, color: topic.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700
                                }}>
                                    {i + 1}
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11 }}>
                                        <span style={{ color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 8px', borderRadius: 4 }}>{m.difficulty}</span>
                                        <span style={{ color: '#34d399' }}>⏱ {m.timeEstimate}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {learned && <span style={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}>✅ Learned</span>}
                                <ChevronDown size={16} style={{ color: '#525252', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                            </div>
                        </div>
                        {isOpen && (
                            <div style={{ padding: '0 24px 20px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}` }}>
                                <div style={{ padding: '16px 0' }}>
                                    <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12 }}>
                                        <strong style={{ color: isLight ? '#334155' : '#e4e4e7' }}>Problem:</strong> {m.problem}
                                    </div>
                                    <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                                        {m.steps.map((s, si) => (
                                            <div key={si} style={{ fontSize: 13, color: '#a1a1aa', padding: '4px 0', display: 'flex', gap: 8 }}>
                                                <span style={{ color: topic.color, fontWeight: 700, flexShrink: 0 }}>→</span> {s}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399', marginBottom: 8 }}>Answer: {m.answer}</div>
                                    {m.tip && (
                                        <div style={{ fontSize: 12, color: '#facc15', background: 'rgba(250,204,21,0.08)', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Lightbulb size={12} /> {m.tip}
                                        </div>
                                    )}
                                </div>
                                {!learned && (
                                    <button onClick={() => onLearn(m.id)} style={{
                                        padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
                                    }}>
                                        <Check size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> I've learned this
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Shortcuts Tab ─── */
function ShortcutsTab({ topic, progress, onLearn, isLight }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {topic.shortcuts.map(s => {
                const learned = progress.shortcutsLearned.includes(s.id);
                return (
                    <div key={s.id} style={{
                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${learned ? `${topic.color}30` : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)')}`,
                        borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: topic.color, margin: 0 }}>{s.name}</h4>
                            {learned && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✅</span>}
                        </div>
                        <p style={{ fontSize: 13, color: isLight ? '#64748b' : '#a1a1aa', marginBottom: 16, lineHeight: 1.5 }}>{s.description}</p>

                        <div style={{ background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 6, fontWeight: 600 }}>EXAMPLE</div>
                            <div style={{ fontSize: 13, color: isLight ? '#334155' : '#e4e4e7', marginBottom: 4 }}><strong>Q:</strong> {s.example.problem}</div>
                            <div style={{ fontSize: 13, color: '#34d399' }}><strong>A:</strong> {s.example.solution}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 16, flex: 1 }}>
                            <div style={{ flex: 1, background: 'rgba(52,211,153,0.05)', padding: '8px 10px', borderRadius: 8 }}>
                                <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 2 }}>✅ USE WHEN</div>
                                <div style={{ color: '#71717a' }}>{s.whenToUse}</div>
                            </div>
                            <div style={{ flex: 1, background: 'rgba(248,113,113,0.05)', padding: '8px 10px', borderRadius: 8 }}>
                                <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 2 }}>❌ AVOID WHEN</div>
                                <div style={{ color: '#71717a' }}>{s.whenNotToUse}</div>
                            </div>
                        </div>

                        {!learned && (
                            <button onClick={() => onLearn(s.id)} style={{
                                padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', alignSelf: 'flex-start',
                            }}>
                                <Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Mark Learned
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Practice Tab ─── */
function PracticeTab({ topic, progress, isLight }) {
    const [difficulty, setDifficulty] = useState('all');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showSolution, setShowSolution] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const [results, setResults] = useState([]);
    const [startTime, setStartTime] = useState(Date.now());
    const [showResults, setShowResults] = useState(false);

    const questions = useMemo(() => {
        const qs = difficulty === 'all' ? topic.practice : topic.practice.filter(q => q.difficulty === difficulty);
        return qs;
    }, [topic, difficulty]);

    const q = questions[currentIdx];

    const handleSelect = useCallback((idx) => {
        if (selected !== null) return;
        setSelected(idx);
        const correct = idx === q.correct;
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        recordPracticeAttempt(topic.id, q.id, correct, timeTaken);
        setResults(prev => [...prev, { correct, timeTaken }]);
    }, [selected, q, startTime, topic.id]);

    const goNext = useCallback(() => {
        if (currentIdx + 1 >= questions.length) {
            setShowResults(true);
            return;
        }
        setCurrentIdx(prev => prev + 1);
        setSelected(null);
        setShowSolution(false);
        setHintLevel(0);
        setStartTime(Date.now());
    }, [currentIdx, questions.length]);

    const restart = useCallback(() => {
        setCurrentIdx(0);
        setSelected(null);
        setShowSolution(false);
        setHintLevel(0);
        setResults([]);
        setStartTime(Date.now());
        setShowResults(false);
    }, []);

    if (!q && !showResults) return <div style={{ color: '#71717a', padding: 40, textAlign: 'center' }}>No questions for this filter.</div>;

    if (showResults) {
        const correct = results.filter(r => r.correct).length;
        const avgTime = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / results.length) : 0;
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Practice Complete!</h3>
                <p style={{ color: '#71717a', marginBottom: 24 }}>You scored {correct}/{results.length} ({Math.round(correct / results.length * 100)}%)</p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
                    <div style={{ background: 'rgba(52,211,153,0.1)', padding: '16px 24px', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#34d399' }}>{correct}</div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>Correct</div>
                    </div>
                    <div style={{ background: 'rgba(248,113,113,0.1)', padding: '16px 24px', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#f87171' }}>{results.length - correct}</div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>Wrong</div>
                    </div>
                    <div style={{ background: 'rgba(129,140,248,0.1)', padding: '16px 24px', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#818cf8' }}>{avgTime}s</div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>Avg Time</div>
                    </div>
                </div>
                <button onClick={restart} style={{
                    padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: topic.gradient, color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                    <RotateCcw size={14} /> Try Again
                </button>
            </div>
        );
    }

    const diffColors = { easy: '#34d399', medium: '#facc15', hard: '#f87171' };

    return (
        <div>
            {/* Difficulty Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                {['all', 'easy', 'medium', 'hard'].map(d => (
                    <button key={d} onClick={() => { setDifficulty(d); setCurrentIdx(0); setSelected(null); setShowSolution(false); setHintLevel(0); setResults([]); setStartTime(Date.now()); }}
                        style={{
                            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            background: difficulty === d ? (diffColors[d] || 'rgba(129,140,248,0.2)') : 'transparent',
                            color: difficulty === d ? '#000' : '#71717a',
                            border: difficulty === d ? 'none' : `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#525252' }}>
                    {currentIdx + 1} / {questions.length}
                </span>
            </div>

            {/* Question Card */}
            <div style={{
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 16, padding: 28, marginBottom: 20,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: diffColors[q.difficulty], background: `${diffColors[q.difficulty]}15`,
                        padding: '3px 10px', borderRadius: 4
                    }}>
                        {q.difficulty.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#525252', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Timer size={12} /> Target: {q.timeTarget}s
                    </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 20, color: isLight ? '#1e293b' : '#e4e4e7' }}>{q.question}</h3>

                {/* Options */}
                <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                    {q.options.map((opt, oi) => {
                        let bg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                        let border = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                        let iconEl = null;
                        if (selected !== null) {
                            if (oi === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = '#34d39950'; iconEl = <CheckCircle2 size={16} style={{ color: '#34d399' }} />; }
                            else if (oi === selected && oi !== q.correct) { bg = 'rgba(248,113,113,0.1)'; border = '#f8717150'; iconEl = <XCircle size={16} style={{ color: '#f87171' }} />; }
                        }
                        return (
                            <button key={oi} onClick={() => handleSelect(oi)} disabled={selected !== null} style={{
                                padding: '14px 18px', borderRadius: 10, fontSize: 14, textAlign: 'left', cursor: selected !== null ? 'default' : 'pointer',
                                background: bg, border: `1px solid ${border}`, color: isLight ? '#1e293b' : '#e4e4e7',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
                            }}>
                                <span><strong style={{ color: topic.color, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</strong>{opt}</span>
                                {iconEl}
                            </button>
                        );
                    })}
                </div>

                {/* Hint & Shortcut */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {q.hint && hintLevel === 0 && selected === null && (
                        <button onClick={() => setHintLevel(1)} style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                            background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', color: '#facc15',
                        }}>
                            <Lightbulb size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Show Hint
                        </button>
                    )}
                    {hintLevel >= 1 && (
                        <div style={{
                            width: '100%', fontSize: 13, color: '#facc15', background: 'rgba(250,204,21,0.06)',
                            padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4
                        }}>
                            <Lightbulb size={14} /> {q.hint}
                        </div>
                    )}
                    {q.shortcutRef && (
                        <div style={{
                            fontSize: 11, color: '#818cf8', background: 'rgba(129,140,248,0.08)',
                            padding: '4px 10px', borderRadius: 6
                        }}>
                            ⚡ Shortcut: {q.shortcutRef}
                        </div>
                    )}
                </div>

                {/* Solution */}
                {selected !== null && (
                    <div style={{ marginTop: 16 }}>
                        <button onClick={() => setShowSolution(!showSolution)} style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                            background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8',
                        }}>
                            {showSolution ? <><EyeOff size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Hide Solution</> :
                                <><Eye size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Show Solution</>}
                        </button>
                        {showSolution && (
                            <div style={{
                                marginTop: 12, padding: 14, background: 'rgba(129,140,248,0.05)', borderRadius: 10,
                                fontSize: 13, color: '#a1a1aa', lineHeight: 1.7
                            }}>
                                {q.solution}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Next Button */}
            {selected !== null && (
                <button onClick={goNext} style={{
                    padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: topic.gradient, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 8,
                    margin: '0 auto',
                }}>
                    {currentIdx + 1 >= questions.length ? 'View Results' : 'Next Question'} <ChevronRight size={14} />
                </button>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function TopicLearning() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [activeTab, setActiveTab] = useState('theory');
    const [, forceUpdate] = useState(0);

    const topic = useMemo(() => getTopicById(topicId), [topicId]);
    const progress = useMemo(() => getTopicProgress(topicId), [topicId, activeTab]);

    if (!topic) return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#030303', color: isLight ? '#1e293b' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <h2>Topic not found</h2>
                <button onClick={() => navigate('/learning-path')} className="btn btn-primary" style={{ marginTop: 16 }}>Back to Learning Path</button>
            </div>
        </div>
    );

    const refresh = () => forceUpdate(n => n + 1);

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8fafc' : '#030303', color: isLight ? '#1e293b' : '#fff', paddingBottom: 80 }}>
            {/* Header */}
            <section style={{ padding: '24px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
                <button onClick={() => navigate('/learning-path')} style={{
                    background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0,
                }}>
                    <ArrowLeft size={16} /> Back to Learning Path
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: `${topic.color}15`, color: topic.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>
                        {({ 'Percent': '📊', 'Hammer': '🔨', 'Timer': '⏱️', 'Hash': '#️⃣', 'Scale': '⚖️', 'Calculator': '🧮', 'Coins': '💰', 'Beaker': '🧪', 'Variable': '🔤', 'Shapes': '📐', 'Dice': '🎲', 'BarChart': '📈' })[topic.icon] || '📖'}
                    </div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{topic.title}</h1>
                        <p style={{ fontSize: 14, color: '#71717a', margin: '4px 0 0' }}>{topic.description}</p>
                    </div>
                </div>

                {/* Mastery bar */}
                <div style={{ marginTop: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#71717a' }}>Mastery</span>
                        <span style={{ fontSize: 12, color: topic.color, fontWeight: 700 }}>{progress.masteryPercent}%</span>
                    </div>
                    <div style={{ height: 6, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                        <div style={{
                            height: '100%', width: `${progress.masteryPercent}%`, background: topic.gradient,
                            borderRadius: 3, transition: 'width 0.5s ease'
                        }} />
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
                    {TABS.map((tab, i) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                            border: `1px solid ${activeTab === tab.id ? `${tab.color}30` : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)')}`,
                            color: activeTab === tab.id ? tab.color : '#71717a',
                            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.2s',
                        }}>
                            <span style={{ opacity: 0.7, fontSize: 11 }}>Step {i + 1}</span>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'theory' && <TheoryTab topic={topic} progress={progress} isLight={isLight} onComplete={() => { markTheoryComplete(topicId); refresh(); }} />}
                {activeTab === 'methods' && <MethodsTab topic={topic} progress={progress} isLight={isLight} onLearn={(id) => { markMethodLearned(topicId, id); refresh(); }} />}
                {activeTab === 'shortcuts' && <ShortcutsTab topic={topic} progress={progress} isLight={isLight} onLearn={(id) => { markShortcutLearned(topicId, id); refresh(); }} />}
                {activeTab === 'practice' && <PracticeTab topic={topic} progress={progress} isLight={isLight} />}
            </section>
        </div>
    );
}
