import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    Trophy, Target, Clock, Zap, Check, X, ChevronDown, ChevronRight,
    ArrowLeft, RotateCcw, ArrowRight, Lightbulb, BarChart3,
    BookOpen, Bookmark, Star, TrendingUp, Award
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AptitudeResults() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state;
    const [expandedQ, setExpandedQ] = useState(null);
    const [showAll, setShowAll] = useState(false);

    if (!state) {
        return (
            <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <h2>No results to display</h2>
                <Link to="/aptitude" className="btn btn-primary">Go to Aptitude Hub</Link>
            </div>
        );
    }

    const { questions, answers, totalTime, mode, correct, attempted, total, category, subcategory, negativeMarking, bookmarks = [] } = state;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const score = negativeMarking ? correct - (attempted - correct) * 0.25 : correct;
    const totalXP = questions.filter(q => answers[q.id] === q.correctAnswer).reduce((s, q) => s + q.xp, 0);
    const avgTime = attempted > 0 ? Math.round(totalTime / attempted) : 0;
    const skipped = total - attempted;

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };

    const byDifficulty = useMemo(() => {
        const result = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
        questions.forEach(q => {
            result[q.difficulty].total++;
            if (answers[q.id] === q.correctAnswer) result[q.difficulty].correct++;
        });
        return result;
    }, [questions, answers]);

    const grade = accuracy >= 90 ? { label: 'Excellent!', emoji: '🏆', color: '#34d399' }
        : accuracy >= 70 ? { label: 'Great Job!', emoji: '⭐', color: '#818cf8' }
            : accuracy >= 50 ? { label: 'Good Effort', emoji: '💪', color: '#facc15' }
                : { label: 'Keep Practicing', emoji: '📚', color: '#f87171' };

    const displayedQuestions = showAll ? questions : questions.slice(0, 10);

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => navigate('/aptitude')} style={{
                    background: 'none', border: 'none', color: isLight ? '#6b7280' : '#71717a', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
                }}>
                    <ArrowLeft size={16} /> Back to Aptitude Hub
                </button>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
                {/* Score Card */}
                <div style={{
                    textAlign: 'center', padding: '48px 24px', marginBottom: 32,
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20, position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                        background: `linear-gradient(90deg, ${grade.color}, ${grade.color}80)`
                    }} />
                    <div style={{ fontSize: 60, marginBottom: 8 }}>{grade.emoji}</div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: grade.color }}>{grade.label}</h1>

                    <div style={{
                        display: 'inline-flex', alignItems: 'baseline', gap: 4,
                        marginBottom: 24
                    }}>
                        <span style={{ fontSize: 64, fontWeight: 800 }}>{correct}</span>
                        <span style={{ fontSize: 24, color: isLight ? '#9ca3af' : '#71717a' }}>/ {total}</span>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: 16, maxWidth: 600, margin: '0 auto'
                    }}>
                        {[
                            { label: 'Accuracy', value: `${accuracy}%`, icon: <Target size={16} />, color: '#818cf8' },
                            { label: 'Time', value: formatTime(totalTime), icon: <Clock size={16} />, color: '#22d3ee' },
                            { label: 'XP Earned', value: `+${totalXP}`, icon: <Zap size={16} />, color: '#facc15' },
                            { label: 'Attempted', value: `${attempted}/${total}`, icon: <BarChart3 size={16} />, color: '#34d399' },
                            { label: 'Skipped', value: skipped, icon: <ArrowRight size={16} />, color: '#f87171' },
                            { label: 'Avg Time', value: formatTime(avgTime), icon: <TrendingUp size={16} />, color: '#a78bfa' }
                        ].map((s, i) => (
                            <div key={i} style={{
                                padding: '14px 12px', borderRadius: 12,
                                background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div style={{ color: s.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Difficulty Breakdown */}
                <div style={{
                    padding: 24, borderRadius: 16, marginBottom: 32,
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Performance by Difficulty</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {[
                            { key: 'easy', label: 'Easy', color: '#34d399' },
                            { key: 'medium', label: 'Medium', color: '#facc15' },
                            { key: 'hard', label: 'Hard', color: '#f87171' }
                        ].map(d => {
                            const data = byDifficulty[d.key];
                            const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                                <div key={d.key} style={{
                                    padding: 16, borderRadius: 12, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 13, color: d.color, fontWeight: 600, marginBottom: 8 }}>{d.label}</div>
                                    <div style={{ fontSize: 24, fontWeight: 700 }}>{data.correct}/{data.total}</div>
                                    <div style={{
                                        height: 4, background: isLight ? '#e5e7eb' : '#222', borderRadius: 2, marginTop: 8, overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%', background: d.color, borderRadius: 2,
                                            width: `${pct}%`, transition: 'width 1s ease'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: isLight ? '#6b7280' : '#71717a', marginTop: 4 }}>{pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/aptitude/practice/${category}?sub=${subcategory || ''}&mode=${mode}&difficulty=all`)}
                        className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RotateCcw size={16} /> Retry Same Set
                    </button>
                    <button onClick={() => navigate(`/aptitude/practice/${category}?mode=${mode}&difficulty=hard`)}
                        className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: '#f87171', color: '#f87171' }}>
                        <TrendingUp size={16} /> Try Harder Set
                    </button>
                    <Link to="/aptitude" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ArrowLeft size={16} /> Back to Hub
                    </Link>
                </div>

                {/* Question-by-Question Review */}
                <div style={{
                    padding: 24, borderRadius: 16,
                    background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
                        📝 Question Review ({total} questions)
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {displayedQuestions.map((q, idx) => {
                            const userAns = answers[q.id];
                            const isCorrectQ = userAns === q.correctAnswer;
                            const wasSkipped = userAns === undefined;
                            const isExpQ = expandedQ === idx;

                            return (
                                <div key={q.id} style={{
                                    borderRadius: 12, border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                                    background: isExpQ ? (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)') : 'transparent'
                                }}>
                                    <div
                                        onClick={() => setExpandedQ(isExpQ ? null : idx)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                            cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                    >
                                        <span style={{
                                            width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: wasSkipped ? 'rgba(113,113,122,0.2)' : isCorrectQ ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                                            color: wasSkipped ? '#71717a' : isCorrectQ ? '#34d399' : '#f87171', fontSize: 12, fontWeight: 700, flexShrink: 0
                                        }}>
                                            {wasSkipped ? '—' : isCorrectQ ? <Check size={14} /> : <X size={14} />}
                                        </span>
                                        <span style={{
                                            flex: 1, fontSize: 13, color: isLight ? '#4b5563' : '#d4d4d8',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>{q.question}</span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                            background: q.difficulty === 'easy' ? 'rgba(52,211,153,0.12)' : q.difficulty === 'medium' ? 'rgba(250,204,21,0.12)' : 'rgba(248,113,113,0.12)',
                                            color: q.difficulty === 'easy' ? '#34d399' : q.difficulty === 'medium' ? '#facc15' : '#f87171'
                                        }}>{q.difficulty}</span>
                                        <ChevronDown size={14} style={{
                                            color: isLight ? '#9ca3af' : '#525252', transform: isExpQ ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s'
                                        }} />
                                    </div>

                                    {isExpQ && (
                                        <div style={{ padding: '0 16px 16px' }}>
                                            <p style={{ fontSize: 14, color: isLight ? '#374151' : '#e4e4e7', lineHeight: 1.7, margin: '0 0 16px 0' }}>{q.question}</p>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                                {q.options.map(opt => {
                                                    const isSel = userAns === opt.label;
                                                    const isCorr = opt.label === q.correctAnswer;
                                                    return (
                                                        <div key={opt.label} style={{
                                                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                                                            background: isCorr ? 'rgba(52,211,153,0.08)' : isSel ? 'rgba(248,113,113,0.08)' : 'transparent',
                                                            border: `1px solid ${isCorr ? 'rgba(52,211,153,0.3)' : isSel ? 'rgba(248,113,113,0.3)' : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)')}`,
                                                            fontSize: 13
                                                        }}>
                                                            <span style={{
                                                                width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: isCorr ? '#34d399' : isSel ? '#f87171' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
                                                                color: (isCorr || isSel) ? '#fff' : (isLight ? '#6b7280' : '#71717a'), fontSize: 11, fontWeight: 700
                                                            }}>{opt.label}</span>
                                                            <span style={{ color: isCorr ? '#34d399' : isSel ? '#f87171' : (isLight ? '#4b5563' : '#a1a1aa') }}>{opt.value}</span>
                                                            {isCorr && <Check size={14} style={{ color: '#34d399', marginLeft: 'auto' }} />}
                                                            {isSel && !isCorr && <X size={14} style={{ color: '#f87171', marginLeft: 'auto' }} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div style={{
                                                padding: 12, borderRadius: 8,
                                                background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)'
                                            }}>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Lightbulb size={12} /> Explanation
                                                </div>
                                                <p style={{ fontSize: 13, color: isLight ? '#4b5563' : '#d4d4d8', lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!showAll && questions.length > 10 && (
                        <button onClick={() => setShowAll(true)} style={{
                            width: '100%', padding: '12px', marginTop: 12, borderRadius: 8,
                            background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
                            color: '#818cf8', cursor: 'pointer', fontSize: 13, fontWeight: 500
                        }}>
                            Show All {questions.length} Questions
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
