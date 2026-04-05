import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock, Zap,
    BookOpen, Target, Calculator, Hash, Check, X, SkipForward,
    Bookmark, BookmarkCheck, Grid3X3, Eye, EyeOff, ChevronDown,
    RotateCcw, Send, Lightbulb, FileText
} from 'lucide-react';
import {
    APTITUDE_CATEGORIES, getCategoryQuestions, getSubcategoryQuestions,
    getAllQuestions, filterByDifficulty, getRandomQuestions, FORMULA_SHEETS
} from '../data/aptitudeData';
import { useTheme } from '../context/ThemeContext';

const MODE_CONFIG = {
    learning: { label: 'Learning', color: '#34d399', timer: false, showAnswer: true, icon: <BookOpen size={14} /> },
    practice: { label: 'Practice', color: '#818cf8', timer: true, showAnswer: false, icon: <Target size={14} /> },
    test: { label: 'Test', color: '#f472b6', timer: true, showAnswer: false, icon: <Clock size={14} /> },
    speed: { label: 'Speed', color: '#facc15', timer: true, showAnswer: false, icon: <Zap size={14} />, perQ: 30 }
};

// Simple Calculator Component
function CalcWidget({ onClose, isLight }) {
    const [display, setDisplay] = useState('0');
    const [prev, setPrev] = useState(null);
    const [op, setOp] = useState(null);
    const [fresh, setFresh] = useState(true);

    const press = (val) => {
        if (val === 'C') { setDisplay('0'); setPrev(null); setOp(null); setFresh(true); return; }
        if (val === '±') { setDisplay(d => String(-parseFloat(d))); return; }
        if (val === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
        if (val === '√') { setDisplay(d => String(Math.sqrt(parseFloat(d)))); return; }
        if (val === 'x²') { setDisplay(d => String(Math.pow(parseFloat(d), 2))); return; }
        if (['+', '-', '×', '÷'].includes(val)) {
            setPrev(parseFloat(display)); setOp(val); setFresh(true); return;
        }
        if (val === '=') {
            if (prev !== null && op) {
                const cur = parseFloat(display);
                let res = 0;
                if (op === '+') res = prev + cur;
                else if (op === '-') res = prev - cur;
                else if (op === '×') res = prev * cur;
                else if (op === '÷') res = cur !== 0 ? prev / cur : 'Error';
                setDisplay(String(res)); setPrev(null); setOp(null); setFresh(true);
            }
            return;
        }
        // Number or decimal
        if (fresh) { setDisplay(val === '.' ? '0.' : val); setFresh(false); }
        else { setDisplay(d => d === '0' && val !== '.' ? val : d + val); }
    };

    const btns = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '√', '='];

    return (
        <div style={{
            position: 'absolute', top: 50, right: 0, width: 260, background: isLight ? '#fff' : '#111', border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid #333',
            borderRadius: 12, padding: 12, zIndex: 100, boxShadow: isLight ? '0 10px 40px rgba(0,0,0,0.15)' : '0 10px 40px rgba(0,0,0,0.6)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a' }}>Calculator</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            <div style={{
                background: isLight ? '#f3f4f6' : '#1a1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 8,
                fontSize: 24, fontWeight: 700, textAlign: 'right', color: isLight ? '#1a1a2e' : '#fff', fontFamily: 'monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{display}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {btns.map(b => (
                    <button key={b} onClick={() => press(b)} style={{
                        padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        background: b === '=' ? '#818cf8' : ['÷', '×', '-', '+'].includes(b) ? (isLight ? '#e5e7eb' : '#333') : ['C', '±', '%', '√'].includes(b) ? (isLight ? '#f3f4f6' : '#252525') : (isLight ? '#fff' : '#1a1a1a'),
                        color: b === '=' ? '#fff' : ['÷', '×', '-', '+'].includes(b) ? '#818cf8' : (isLight ? '#1a1a2e' : '#fff'),
                        gridColumn: b === '0' ? 'span 1' : undefined
                    }}>{b}</button>
                ))}
            </div>
        </div>
    );
}

export default function AptitudePractice() {
    const { category } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const subParam = searchParams.get('sub');
    const modeParam = searchParams.get('mode') || 'practice';
    const diffParam = searchParams.get('difficulty') || 'all';

    const { theme } = useTheme();
    const isLight = theme === 'light';
    const mode = MODE_CONFIG[modeParam] || MODE_CONFIG.practice;

    // Load questions
    const questions = useMemo(() => {
        let qs = [];
        if (category === 'all') {
            qs = getAllQuestions();
        } else if (subParam) {
            qs = getSubcategoryQuestions(category, subParam);
        } else {
            qs = getCategoryQuestions(category);
        }
        qs = filterByDifficulty(qs, diffParam);
        if (modeParam === 'speed') return getRandomQuestions(qs, 20);
        if (category === 'all') return getRandomQuestions(qs, 20);
        return qs;
    }, [category, subParam, diffParam, modeParam]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showExplanation, setShowExplanation] = useState({});
    const [bookmarks, setBookmarks] = useState(new Set());
    const [showCalc, setShowCalc] = useState(false);
    const [showFormula, setShowFormula] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [questionTime, setQuestionTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [negativeMarking, setNegativeMarking] = useState(false);
    const timerRef = useRef(null);

    const currentQ = questions[currentIndex];
    const isAnswered = answers[currentQ?.id] !== undefined;
    const isCorrect = answers[currentQ?.id] === currentQ?.correctAnswer;

    // Timer
    useEffect(() => {
        if (!mode.timer || submitted) return;
        timerRef.current = setInterval(() => {
            setQuestionTime(t => t + 1);
            setTotalTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [mode.timer, submitted]);

    // Speed mode auto-advance
    useEffect(() => {
        if (modeParam === 'speed' && questionTime >= 30 && !submitted) {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1);
                setQuestionTime(0);
            } else {
                setSubmitted(true);
            }
        }
    }, [questionTime, modeParam, currentIndex, questions.length, submitted]);

    // Reset question timer on question change
    useEffect(() => { setQuestionTime(0); }, [currentIndex]);

    const selectAnswer = useCallback((qId, ans) => {
        if (submitted) return;
        if (modeParam === 'test' && answers[qId] !== undefined) return; // Can't change in test
        setAnswers(prev => ({ ...prev, [qId]: ans }));
        if (modeParam === 'learning') {
            setShowExplanation(prev => ({ ...prev, [qId]: true }));
        }
    }, [submitted, modeParam, answers]);

    const toggleBookmark = (qId) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            next.has(qId) ? next.delete(qId) : next.add(qId);
            return next;
        });
    };

    const goNext = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
    };
    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(i => i - 1);
    };

    const handleSubmit = () => {
        setSubmitted(true);
        clearInterval(timerRef.current);
        // Navigate to results
        const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
        const attempted = Object.keys(answers).length;
        navigate('/aptitude/results', {
            state: {
                questions, answers, bookmarks: [...bookmarks],
                totalTime, mode: modeParam, negativeMarking,
                correct, attempted, total: questions.length, category,
                subcategory: subParam
            }
        });
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // Determine which formula sheet to show
    const relevantFormulas = useMemo(() => {
        if (!subParam) return Object.values(FORMULA_SHEETS).flat();
        return FORMULA_SHEETS[subParam] || Object.values(FORMULA_SHEETS).flat().slice(0, 10);
    }, [subParam]);

    if (!questions.length) {
        return (
            <div style={{
                minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16
            }}>
                <h2>No questions found</h2>
                <p style={{ color: isLight ? '#6b7280' : '#71717a' }}>Try changing the difficulty filter or category.</p>
                <button onClick={() => navigate('/aptitude')} className="btn btn-primary">Back to Aptitude Hub</button>
            </div>
        );
    }

    const catInfo = APTITUDE_CATEGORIES[category];
    const catTitle = category === 'all' ? 'Mixed Practice' : (catInfo?.title || 'Practice');

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff' }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 24px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/aptitude')} style={{
                        background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
                    }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{catTitle}</div>
                        <div style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a' }}>
                            <span style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 11,
                                background: `${mode.color}20`, color: mode.color
                            }}>{mode.icon} {mode.label}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Timer */}
                    {mode.timer && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 8, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                            fontSize: 14, fontFamily: 'monospace', fontWeight: 600,
                            color: modeParam === 'speed' && questionTime > 20 ? '#f87171' : (isLight ? '#1a1a2e' : '#fff')
                        }}>
                            <Clock size={14} />
                            {modeParam === 'speed' ? `${30 - questionTime}s` : formatTime(totalTime)}
                        </div>
                    )}

                    {/* Speed bar for speed mode */}
                    {modeParam === 'speed' && (
                        <div style={{ width: 80, height: 4, background: isLight ? '#e5e7eb' : '#333', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 2, transition: 'width 1s linear',
                                width: `${((30 - questionTime) / 30) * 100}%`,
                                background: questionTime > 20 ? '#f87171' : questionTime > 15 ? '#facc15' : '#34d399'
                            }} />
                        </div>
                    )}

                    {/* Progress */}
                    <div style={{ fontSize: 13, color: isLight ? '#6b7280' : '#a1a1aa' }}>
                        {currentIndex + 1} / {questions.length}
                    </div>

                    {/* Tools */}
                    <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                        <button
                            onClick={() => { setShowCalc(!showCalc); setShowFormula(false); }}
                            title="Calculator"
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: showCalc ? 'rgba(129,140,248,0.2)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                                color: showCalc ? '#818cf8' : (isLight ? '#6b7280' : '#a1a1aa'), display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        ><Calculator size={16} /></button>

                        <button
                            onClick={() => { setShowFormula(!showFormula); setShowCalc(false); }}
                            title="Formula Sheet"
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: showFormula ? 'rgba(52,211,153,0.2)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                                color: showFormula ? '#34d399' : (isLight ? '#6b7280' : '#a1a1aa'), display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        ><FileText size={16} /></button>

                        <button
                            onClick={() => setShowGrid(!showGrid)}
                            title="Question Grid"
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: showGrid ? 'rgba(250,204,21,0.2)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                                color: showGrid ? '#facc15' : (isLight ? '#6b7280' : '#a1a1aa'), display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        ><Grid3X3 size={16} /></button>

                        {showCalc && <CalcWidget onClose={() => setShowCalc(false)} isLight={isLight} />}

                        {/* Formula Sheet Panel */}
                        {showFormula && (
                            <div style={{
                                position: 'absolute', top: 50, right: 0, width: 320, background: isLight ? '#fff' : '#111',
                                border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid #333', borderRadius: 12, padding: 16, zIndex: 100,
                                maxHeight: 400, overflowY: 'auto', boxShadow: isLight ? '0 10px 40px rgba(0,0,0,0.15)' : '0 10px 40px rgba(0,0,0,0.6)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>📐 Formula Sheet</span>
                                    <button onClick={() => setShowFormula(false)} style={{ background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer' }}><X size={14} /></button>
                                </div>
                                {relevantFormulas.map((f, i) => (
                                    <div key={i} style={{
                                        padding: '8px 12px', borderRadius: 6, marginBottom: 4,
                                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', fontSize: 12, color: isLight ? '#4b5563' : '#d4d4d8',
                                        fontFamily: 'monospace', lineHeight: 1.5
                                    }}>{f}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    {modeParam === 'test' && !submitted && (
                        <button onClick={handleSubmit} className="btn btn-primary" style={{
                            padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <Send size={14} /> Submit All
                        </button>
                    )}
                </div>
            </div>

            {/* Question Grid Overlay */}
            {showGrid && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)',
                    zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowGrid(false)}>
                    <div style={{
                        background: isLight ? '#fff' : '#111', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16, fontSize: 16 }}>Question Navigator</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                            {questions.map((q, i) => {
                                const isAns = answers[q.id] !== undefined;
                                const isBm = bookmarks.has(q.id);
                                const isCur = i === currentIndex;
                                return (
                                    <button key={i} onClick={() => { setCurrentIndex(i); setShowGrid(false); }} style={{
                                        width: 36, height: 36, borderRadius: 8, border: isCur ? '2px solid #818cf8' : (isLight ? '1px solid #d1d5db' : '1px solid #333'),
                                        background: isAns ? (submitted && answers[q.id] === q.correctAnswer ? 'rgba(52,211,153,0.2)' : submitted ? 'rgba(248,113,113,0.2)' : 'rgba(129,140,248,0.2)') : 'transparent',
                                        color: isCur ? '#818cf8' : isAns ? (isLight ? '#1a1a2e' : '#fff') : (isLight ? '#9ca3af' : '#71717a'), cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                        position: 'relative'
                                    }}>
                                        {i + 1}
                                        {isBm && <div style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#facc15' }} />}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>
                            <span>⬜ Unanswered</span>
                            <span style={{ color: '#818cf8' }}>🟪 Answered</span>
                            <span>🟡 Bookmarked</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 100px' }}>
                {currentQ && (
                    <>
                        {/* Question Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 13, color: isLight ? '#6b7280' : '#71717a' }}>Question {currentIndex + 1}</span>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                    background: currentQ.difficulty === 'easy' ? 'rgba(52,211,153,0.15)' : currentQ.difficulty === 'medium' ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)',
                                    color: currentQ.difficulty === 'easy' ? '#34d399' : currentQ.difficulty === 'medium' ? '#facc15' : '#f87171'
                                }}>{currentQ.difficulty}</span>
                                <span style={{ fontSize: 12, color: '#facc15', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Zap size={12} /> {currentQ.xp} points
                                </span>
                            </div>
                            <button
                                onClick={() => toggleBookmark(currentQ.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarks.has(currentQ.id) ? '#facc15' : '#525252' }}
                            >
                                {bookmarks.has(currentQ.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                            </button>
                        </div>

                        {/* Question Text */}
                        <div style={{
                            fontSize: 18, fontWeight: 500, lineHeight: 1.7, marginBottom: 32,
                            padding: 24, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderRadius: 12,
                            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'
                        }}>
                            {currentQ.question}
                        </div>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                            {currentQ.options.map(opt => {
                                const isSelected = answers[currentQ.id] === opt.label;
                                const shouldReveal = (modeParam === 'learning' && isAnswered) || submitted;
                                const isCorrectOpt = opt.label === currentQ.correctAnswer;

                                let bg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                                let borderCol = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
                                if (isSelected && !shouldReveal) { bg = 'rgba(129,140,248,0.15)'; borderCol = '#818cf8'; }
                                if (shouldReveal && isCorrectOpt) { bg = 'rgba(52,211,153,0.12)'; borderCol = '#34d399'; }
                                if (shouldReveal && isSelected && !isCorrectOpt) { bg = 'rgba(248,113,113,0.12)'; borderCol = '#f87171'; }

                                return (
                                    <button
                                        key={opt.label}
                                        onClick={() => selectAnswer(currentQ.id, opt.label)}
                                        disabled={submitted || (modeParam === 'learning' && isAnswered)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 16,
                                            padding: '16px 20px', borderRadius: 12, border: `1px solid ${borderCol}`,
                                            background: bg, cursor: submitted ? 'default' : 'pointer',
                                            transition: 'all 0.2s', textAlign: 'left', color: isLight ? '#1a1a2e' : '#fff', fontSize: 15
                                        }}
                                    >
                                        <span style={{
                                            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: isSelected ? (shouldReveal ? (isCorrectOpt ? '#34d399' : '#f87171') : '#818cf8') : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'),
                                            color: isSelected ? '#fff' : (isLight ? '#6b7280' : '#a1a1aa'), fontSize: 13, fontWeight: 700, flexShrink: 0
                                        }}>{opt.label}</span>
                                        <span style={{ flex: 1 }}>{opt.value}</span>
                                        {shouldReveal && isCorrectOpt && <Check size={18} style={{ color: '#34d399' }} />}
                                        {shouldReveal && isSelected && !isCorrectOpt && <X size={18} style={{ color: '#f87171' }} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {((modeParam === 'learning' && showExplanation[currentQ.id]) || (modeParam !== 'test' && modeParam !== 'speed' && isAnswered)) && (
                            <div style={{
                                padding: 20, borderRadius: 12, marginBottom: 32,
                                background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)'
                            }}>
                                {currentQ.theory && (
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#facc15' }}>
                                            <BookOpen size={14} /> Core Theory
                                        </div>
                                        <p style={{ fontSize: 14, color: isLight ? '#4b5563' : '#d4d4d8', lineHeight: 1.6, margin: 0 }}>
                                            {currentQ.theory}
                                        </p>
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
                                    <Lightbulb size={14} /> Explanation
                                </div>
                                <p style={{ fontSize: 14, color: isLight ? '#4b5563' : '#d4d4d8', lineHeight: 1.7, margin: 0 }}>
                                    {currentQ.explanation}
                                </p>
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            padding: '16px 24px', background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(3,3,3,0.95)', backdropFilter: 'blur(10px)',
                            borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', zIndex: 40
                        }}>
                            <button onClick={goPrev} disabled={currentIndex === 0} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
                                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', border: 'none', color: currentIndex === 0 ? (isLight ? '#d1d5db' : '#333') : (isLight ? '#6b7280' : '#a1a1aa'),
                                cursor: currentIndex === 0 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500
                            }}>
                                <ChevronLeft size={16} /> Previous
                            </button>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {modeParam !== 'test' && currentIndex === questions.length - 1 && (
                                    <button onClick={handleSubmit} className="btn btn-primary" style={{
                                        padding: '10px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8
                                    }}>
                                        Finish & View Results <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>

                            <button onClick={goNext} disabled={currentIndex === questions.length - 1} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8,
                                background: currentIndex === questions.length - 1 ? (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)') : '#818cf8',
                                border: 'none', color: currentIndex === questions.length - 1 ? (isLight ? '#d1d5db' : '#333') : '#fff',
                                cursor: currentIndex === questions.length - 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 500
                            }}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
