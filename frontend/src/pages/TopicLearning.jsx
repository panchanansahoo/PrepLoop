import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Zap, Sparkles, Target, Check, ChevronRight, Clock, Lightbulb, Eye, EyeOff, RotateCcw, Timer, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { getTopicById } from '../data/learningPathData';
import {
    getTopicProgress, markTheoryComplete, markMethodLearned,
    markShortcutLearned, recordPracticeAttempt
} from '../data/learningPathProgress';
import './LearningPath.css';

const TABS = [
    { id: 'theory', label: 'Theory & Formulas', icon: <BookOpen size={16} />, color: '#818cf8' },
    { id: 'methods', label: 'Quick Methods', icon: <Zap size={16} />, color: '#34d399' },
    { id: 'shortcuts', label: 'Tricks & Shortcuts', icon: <Sparkles size={16} />, color: '#f472b6' },
    { id: 'practice', label: 'Practice', icon: <Target size={16} />, color: '#facc15' },
];

const ICON_MAP = {
    'Percent': '📊', 'Hammer': '🔨', 'Timer': '⏱️', 'Hash': '#️⃣', 'Scale': '⚖️',
    'Calculator': '🧮', 'Coins': '💰', 'Beaker': '🧪', 'Variable': '🔤', 'Shapes': '📐',
    'Dice': '🎲', 'BarChart': '📈'
};

/* ─── Flip Card ─── */
function FormulaCard({ formula, example, color }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div onClick={() => setFlipped(!flipped)} className="lp-topic-flipcard">
            <div className={`lp-topic-flipcard-inner ${flipped ? 'lp-topic-flipcard-inner--flipped' : ''}`}>
                <div className="lp-topic-flipcard-face" style={{ borderLeft: `3px solid ${color}` }}>
                    <div className="lp-topic-flipcard-formula">{formula}</div>
                    <div className="lp-topic-flipcard-hint">Click to see example →</div>
                </div>
                <div className="lp-topic-flipcard-face lp-topic-flipcard-back" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
                    <div style={{ fontSize: 11, color: color, fontWeight: 700, marginBottom: 6 }}>EXAMPLE</div>
                    <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>{example}</div>
                </div>
            </div>
        </div>
    );
}

/* ─── Theory Tab ─── */
function TheoryTab({ topic, progress, onComplete }) {
    return (
        <div>
            {topic.theory.sections.map((section, si) => (
                <div key={si} style={{ marginBottom: 40 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: topic.color, borderBottom: `2px solid ${topic.color}20`, paddingBottom: 8 }}>
                        {section.title}
                    </h3>
                    <div style={{ marginBottom: 24 }}>
                        {section.content?.map((text, ti) => (
                            <p key={ti} style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.7, marginBottom: 12 }}>{text}</p>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                        {section.formulas.map((f, fi) => (
                            <FormulaCard key={fi} formula={f.formula} example={f.example} color={topic.color} />
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={onComplete} disabled={progress.theoryComplete}
                className={`lp-topic-complete-btn ${progress.theoryComplete ? 'lp-topic-complete-btn--done' : ''}`}
                style={{
                    ...(progress.theoryComplete ? {} : { background: topic.gradient, color: '#fff', cursor: 'pointer' }),
                    margin: '0 auto', display: 'flex'
                }}>
                {progress.theoryComplete ? <><CheckCircle2 size={16} /> Theory Complete</> : <><Check size={16} /> Mark Theory Complete</>}
            </button>
        </div>
    );
}

/* ─── Methods Tab ─── */
function MethodsTab({ topic, progress, onLearn }) {
    const [expanded, setExpanded] = useState(null);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {topic.quickMethods.map((m, i) => {
                const learned = progress.methodsLearned.includes(m.id);
                const isOpen = expanded === i;
                return (
                    <div key={m.id} className={`lp-topic-accordion ${learned ? 'lp-topic-shortcut-card--learned' : ''}`}>
                        <div className="lp-topic-accordion-header" onClick={() => setExpanded(isOpen ? null : i)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="lp-topic-accordion-num" style={{ background: `${topic.color}12`, color: topic.color }}>
                                    {i + 1}
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{m.name}</div>
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
                            <div className="lp-topic-accordion-body">
                                <div style={{ padding: '16px 0' }}>
                                    <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 12 }}>
                                        <strong style={{ color: '#e4e4e7' }}>Problem:</strong> {m.problem}
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
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
                                    <button onClick={() => onLearn(m.id)} className="lp-topic-btn lp-topic-btn--success">
                                        <Check size={14} /> I've learned this
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
function ShortcutsTab({ topic, progress, onLearn }) {
    return (
        <div className="lp-topic-shortcut-grid">
            {topic.shortcuts.map(s => {
                const learned = progress.shortcutsLearned.includes(s.id);
                return (
                    <div key={s.id} className={`lp-topic-shortcut-card ${learned ? 'lp-topic-shortcut-card--learned' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700, color: topic.color, margin: 0 }}>{s.name}</h4>
                            {learned && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✅</span>}
                        </div>
                        <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 16, lineHeight: 1.5 }}>{s.description}</p>

                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: '#71717a', marginBottom: 6, fontWeight: 600 }}>EXAMPLE</div>
                            <div style={{ fontSize: 13, color: '#e4e4e7', marginBottom: 4 }}><strong>Q:</strong> {s.example.problem}</div>
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
                            <button onClick={() => onLearn(s.id)} className="lp-topic-btn lp-topic-btn--success" style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 12 }}>
                                <Check size={12} /> Mark Learned
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Practice Tab ─── */
function PracticeTab({ topic, _progress }) {
    const [difficulty, setDifficulty] = useState('all');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showSolution, setShowSolution] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const [results, setResults] = useState([]);
    const [startTime, setStartTime] = useState(Date.now());
    const [showResults, setShowResults] = useState(false);

    const questions = useMemo(() => {
        return difficulty === 'all' ? topic.practice : topic.practice.filter(q => q.difficulty === difficulty);
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
        if (currentIdx + 1 >= questions.length) { setShowResults(true); return; }
        setCurrentIdx(prev => prev + 1);
        setSelected(null); setShowSolution(false); setHintLevel(0); setStartTime(Date.now());
    }, [currentIdx, questions.length]);

    const restart = useCallback(() => {
        setCurrentIdx(0); setSelected(null); setShowSolution(false); setHintLevel(0);
        setResults([]); setStartTime(Date.now()); setShowResults(false);
    }, []);

    if (!q && !showResults) return <div style={{ color: '#71717a', padding: 40, textAlign: 'center' }}>No questions for this filter.</div>;

    if (showResults) {
        const correct = results.filter(r => r.correct).length;
        const avgTime = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / results.length) : 0;
        return (
            <div className="lp-topic-results">
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Practice Complete!</h3>
                <p style={{ color: '#71717a', marginBottom: 24 }}>You scored {correct}/{results.length} ({Math.round(correct / results.length * 100)}%)</p>
                <div className="lp-topic-results-grid">
                    <div className="lp-topic-results-stat" style={{ background: 'rgba(52,211,153,0.1)' }}>
                        <div className="lp-topic-results-stat-value" style={{ color: '#34d399' }}>{correct}</div>
                        <div className="lp-topic-results-stat-label">Correct</div>
                    </div>
                    <div className="lp-topic-results-stat" style={{ background: 'rgba(248,113,113,0.1)' }}>
                        <div className="lp-topic-results-stat-value" style={{ color: '#f87171' }}>{results.length - correct}</div>
                        <div className="lp-topic-results-stat-label">Wrong</div>
                    </div>
                    <div className="lp-topic-results-stat" style={{ background: 'rgba(129,140,248,0.1)' }}>
                        <div className="lp-topic-results-stat-value" style={{ color: '#818cf8' }}>{avgTime}s</div>
                        <div className="lp-topic-results-stat-label">Avg Time</div>
                    </div>
                </div>
                <button onClick={restart} className="lp-topic-btn" style={{ background: topic.gradient, color: '#fff', margin: '0 auto' }}>
                    <RotateCcw size={14} /> Try Again
                </button>
            </div>
        );
    }

    const diffColors = { easy: '#34d399', medium: '#facc15', hard: '#f87171' };

    return (
        <div>
            <div className="lp-topic-quiz-filters">
                {['all', 'easy', 'medium', 'hard'].map(d => (
                    <button key={d} onClick={() => { setDifficulty(d); setCurrentIdx(0); setSelected(null); setShowSolution(false); setHintLevel(0); setResults([]); setStartTime(Date.now()); }}
                        className="lp-topic-quiz-filter-btn"
                        style={difficulty === d ? { background: diffColors[d] || 'rgba(129,140,248,0.2)', color: '#000', border: 'none' } : {}}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#525252' }}>{currentIdx + 1} / {questions.length}</span>
            </div>

            <div className="lp-topic-quiz-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span className="lp-topic-problem-diff" style={{ color: diffColors[q.difficulty], background: `${diffColors[q.difficulty]}15` }}>
                        {q.difficulty.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#525252', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Timer size={12} /> Target: {q.timeTarget}s
                    </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 20, color: '#e4e4e7' }}>{q.question}</h3>

                <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                    {q.options.map((opt, oi) => {
                        let bg = 'rgba(255,255,255,0.03)';
                        let border = 'rgba(255,255,255,0.06)';
                        let iconEl = null;
                        if (selected !== null) {
                            if (oi === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = '#34d39950'; iconEl = <CheckCircle2 size={16} style={{ color: '#34d399' }} />; }
                            else if (oi === selected && oi !== q.correct) { bg = 'rgba(248,113,113,0.1)'; border = '#f8717150'; iconEl = <XCircle size={16} style={{ color: '#f87171' }} />; }
                        }
                        return (
                            <button key={oi} onClick={() => handleSelect(oi)} disabled={selected !== null}
                                className="lp-topic-quiz-option" style={{ background: bg, borderColor: border }}>
                                <span><strong style={{ color: topic.color, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</strong>{opt}</span>
                                {iconEl}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {q.hint && hintLevel === 0 && selected === null && (
                        <button onClick={() => setHintLevel(1)} className="lp-topic-btn--ghost" style={{ fontSize: 12, background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.2)', color: '#facc15' }}>
                            <Lightbulb size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Show Hint
                        </button>
                    )}
                    {hintLevel >= 1 && (
                        <div style={{ width: '100%', fontSize: 13, color: '#facc15', background: 'rgba(250,204,21,0.06)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Lightbulb size={14} /> {q.hint}
                        </div>
                    )}
                    {q.shortcutRef && (
                        <div style={{ fontSize: 11, color: '#818cf8', background: 'rgba(129,140,248,0.08)', padding: '4px 10px', borderRadius: 6 }}>
                            ⚡ Shortcut: {q.shortcutRef}
                        </div>
                    )}
                </div>

                {selected !== null && (
                    <div style={{ marginTop: 16 }}>
                        <button onClick={() => setShowSolution(!showSolution)} className="lp-topic-btn--ghost" style={{ fontSize: 12, background: 'rgba(129,140,248,0.08)', borderColor: 'rgba(129,140,248,0.2)', color: '#818cf8' }}>
                            {showSolution ? <><EyeOff size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Hide Solution</> :
                                <><Eye size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Show Solution</>}
                        </button>
                        {showSolution && (
                            <div style={{ marginTop: 12, padding: 14, background: 'rgba(129,140,248,0.05)', borderRadius: 10, fontSize: 13, color: '#a1a1aa', lineHeight: 1.7 }}>
                                {q.solution}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selected !== null && (
                <button onClick={goNext} className="lp-topic-btn" style={{ background: topic.gradient, color: '#fff', margin: '0 auto', display: 'flex' }}>
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
    const [activeTab, setActiveTab] = useState('theory');
    const [, forceUpdate] = useState(0);

    const topic = useMemo(() => getTopicById(topicId), [topicId]);
    const progress = useMemo(() => getTopicProgress(topicId), [topicId, activeTab]);

    if (!topic) return (
        <div className="lp-topic-not-found">
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <h2>Topic not found</h2>
                <button onClick={() => navigate('/learning-path')} className="lp-topic-btn lp-topic-btn--primary" style={{ marginTop: 16 }}>Back to Learning Path</button>
            </div>
        </div>
    );

    const refresh = () => forceUpdate(n => n + 1);

    return (
        <div className="lp-topic-page">
            <div className="lp-topic-container" style={{ maxWidth: 1200 }}>
                <button onClick={() => navigate('/learning-path')} className="lp-topic-back">
                    <ArrowLeft size={16} /> Back to Learning Path
                </button>

                <div className="lp-topic-hero lp-topic-hero--aptitude">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, background: `${topic.color}15`, color: topic.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                            }}>
                                {ICON_MAP[topic.icon] || '📖'}
                            </div>
                            <div>
                                <h1 className="lp-topic-hero-title" style={{ marginBottom: 0 }}>{topic.title}</h1>
                                <p className="lp-topic-hero-desc" style={{ marginTop: 4 }}>{topic.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lp-topic-mastery-bar">
                    <div className="lp-topic-mastery-bar-header">
                        <span style={{ color: '#71717a' }}>Mastery</span>
                        <span style={{ color: topic.color, fontWeight: 700 }}>{progress.masteryPercent}%</span>
                    </div>
                    <div className="lp-topic-mastery-bar-track">
                        <div className="lp-topic-mastery-bar-fill" style={{ width: `${progress.masteryPercent}%`, background: topic.gradient }} />
                    </div>
                </div>

                <div className="lp-topic-tabs">
                    {TABS.map((tab, i) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`lp-topic-tab ${activeTab === tab.id ? 'lp-topic-tab--active' : ''}`}
                            style={activeTab === tab.id ? { background: `${tab.color}15`, color: tab.color } : {}}>
                            <span style={{ opacity: 0.7, fontSize: 11 }}>Step {i + 1}</span>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'theory' && <TheoryTab topic={topic} progress={progress} onComplete={() => { markTheoryComplete(topicId); refresh(); }} />}
                {activeTab === 'methods' && <MethodsTab topic={topic} progress={progress} onLearn={(id) => { markMethodLearned(topicId, id); refresh(); }} />}
                {activeTab === 'shortcuts' && <ShortcutsTab topic={topic} progress={progress} onLearn={(id) => { markShortcutLearned(topicId, id); refresh(); }} />}
                {activeTab === 'practice' && <PracticeTab topic={topic} progress={progress} />}
            </div>
        </div>
    );
}
