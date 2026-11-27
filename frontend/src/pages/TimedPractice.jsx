import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

import { authFetch } from '../utils/authFetch';
import { API_URL } from '../config/api.js';
import {
    Timer, Zap, Clock, Target, Play, Pause, RotateCcw,
    CheckCircle2, XCircle, ArrowRight, Trophy, Brain, AlertCircle
} from 'lucide-react';

const MODES = [
    {
        id: 'quick-10',
        label: '10-Min Quick Round',
        desc: '5 problems in 10 minutes — warm up fast',
        icon: Zap,
        time: 10,
        count: 5,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
    },
    {
        id: 'full-30',
        label: '30-Min Full Mock',
        desc: '15 problems in 30 minutes — real test feel',
        icon: Target,
        time: 30,
        count: 15,
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.08)',
    },
    {
        id: 'last-day',
        label: 'Last-Day Revision',
        desc: '10 weak-area problems in 20 min — final polish',
        icon: Brain,
        time: 20,
        count: 10,
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.08)',
    },
];

export default function TimedPractice() {
    const [phase, setPhase] = useState('select'); // select | active | results
    const [selectedMode, setSelectedMode] = useState(null);
    const [session, setSession] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [paused, setPaused] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    // Start session
    const startSession = async (mode) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_URL}/api/practice/timed-session`, {
                method: 'POST',
                body: JSON.stringify({
                    difficulty: 'all',
                    duration: mode.time,
                    count: mode.count || 5,
                    mode: mode.id,
                    focus: mode.id === 'last-day' ? 'weak-areas' : 'general',
                }),
            });
            if (!res.ok) {
                const errPayload = await res.json().catch(() => null);
                throw new Error(errPayload?.error || 'Failed to start timed session');
            }
            const data = await res.json();
            const questions = Array.isArray(data.questions)
                ? data.questions
                : Array.isArray(data.problems)
                    ? data.problems
                    : [];
            if (questions.length === 0) {
                throw new Error('No practice problems are available for this session right now.');
            }
            const timeMinutes = Number(data.timeMinutes || data.duration || mode.time);
            setSession({ ...data, questions, timeMinutes });
            setTimeLeft(timeMinutes * 60);
            setSelectedMode(mode);
            setCurrentQ(0);
            setAnswers({});
            setPaused(false);
            setResults(null);
            setPhase('active');
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Failed to start timed session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const markAnswer = (qId, solved) => {
        setAnswers(prev => ({ ...prev, [qId]: solved }));
    };

    const finishSession = useCallback(async (remainingOverride) => {
        clearInterval(timerRef.current);
        if (!session) return;
        const resultsList = session.questions.map(q => ({
            problemId: q.id,
            solved: answers[q.id] === true,
        }));
        const solved = resultsList.filter(r => r.solved).length;
        const total = resultsList.length;
        const totalSeconds = (Number(session.timeMinutes) || Number(selectedMode?.time) || 0) * 60;
        const remainingSeconds = typeof remainingOverride === 'number' ? remainingOverride : timeLeft;
        setResults({
            solved,
            total,
            accuracy: total > 0 ? Math.round((solved / total) * 100) : 0,
            timeUsed: Math.max(0, totalSeconds - remainingSeconds),
        });
        setPaused(false);
        setPhase('results');
    }, [session, answers, timeLeft, selectedMode]);

    // Timer countdown
    useEffect(() => {
        if (phase !== 'active' || paused) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase, paused]);

    // Auto-finish when countdown hits 0 using the latest finishSession state
    useEffect(() => {
        if (phase === 'active' && session && timeLeft <= 0) {
            finishSession(0);
        }
    }, [phase, session, timeLeft, finishSession]);

    const timePercent = session ? ((timeLeft / (session.timeMinutes * 60)) * 100) : 100;
    const isLowTime = timeLeft < 60;

    // Mode Selection
    if (phase === 'select') {
        return (
            <div className="tp-container">
                <div className="tp-header">
                    <Timer size={28} style={{ color: 'var(--accent)' }} />
                    <div>
                        <h1 className="tp-title">Timed Practice</h1>
                        <p className="tp-subtitle">Choose a mode and race against the clock</p>
                    </div>
                </div>
                {error && (
                    <div
                        role="alert"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            marginBottom: '16px',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}
                    >
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}
                <div className="tp-modes">
                    {MODES.map(mode => {
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.id}
                                className="tp-mode-card"
                                onClick={() => startSession(mode)}
                                disabled={loading}
                                style={{ '--mode-color': mode.color }}
                            >
                                <div className="tp-mode-icon" style={{ background: mode.bg, color: mode.color }}>
                                    <Icon size={24} />
                                </div>
                                <div className="tp-mode-info">
                                    <h3>{mode.label}</h3>
                                    <p>{mode.desc}</p>
                                </div>
                                <div className="tp-mode-time">
                                    <Clock size={14} />
                                    <span>{mode.time} min</span>
                                </div>
                                <ArrowRight size={16} className="tp-mode-arrow" />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Active Session
    if (phase === 'active' && session) {
        const q = session.questions?.[currentQ];
        if (!q) {
            return (
                <div className="tp-container">
                    <div role="alert" className="tp-question-card">
                        <h2 className="tp-q-title">No practice problems available</h2>
                        <p className="tp-subtitle">Unable to load questions for this session.</p>
                        <button
                            className="tp-btn-primary"
                            onClick={() => {
                                setPaused(false);
                                setSession(null);
                                setPhase('select');
                            }}
                        >
                            <RotateCcw size={16} /> Back to Modes
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="tp-container">
                {/* Timer bar */}
                <div className="tp-timer-bar">
                    <div className="tp-timer-fill" style={{
                        width: `${timePercent}%`,
                        background: isLowTime ? '#ef4444' : 'var(--accent)',
                    }} />
                </div>

                <div className="tp-active-header">
                    <div className="tp-timer-display" style={{ color: isLowTime ? '#ef4444' : 'var(--accent)' }}>
                        <Timer size={18} />
                        <span className={isLowTime ? 'anim-flame-pulse' : ''}>{formatTime(timeLeft)}</span>
                    </div>
                    <div className="tp-progress-text">
                        {currentQ + 1} / {session.questions.length}
                    </div>
                    <div className="tp-active-actions">
                        <button className="tp-btn-icon" aria-label={paused ? 'Resume timer' : 'Pause timer'} onClick={() => setPaused(p => !p)}>
                            {paused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button className="tp-btn-finish" onClick={() => finishSession()}>
                            Finish Early
                        </button>
                    </div>
                </div>

                {/* Question */}
                <div className="tp-question-card">
                    <div className="tp-q-header">
                        <span className={`tp-q-diff tp-diff-${q.difficulty}`}>{q.difficulty}</span>
                        <span className="tp-q-pattern">{q.pattern}</span>
                    </div>
                    <h2 className="tp-q-title">{q.title}</h2>
                    {q.companies?.length > 0 && (
                        <div className="tp-q-companies">
                            {q.companies.slice(0, 3).map(c => (
                                <span key={c} className="tp-q-company">{c}</span>
                            ))}
                        </div>
                    )}

                    <div className="tp-q-actions">
                        <button
                            className={`tp-q-btn tp-q-solved ${answers[q.id] === true ? 'active' : ''}`}
                            onClick={() => markAnswer(q.id, true)}
                        >
                            <CheckCircle2 size={18} /> Solved
                        </button>
                        <button
                            className={`tp-q-btn tp-q-skip ${answers[q.id] === false ? 'active' : ''}`}
                            onClick={() => markAnswer(q.id, false)}
                        >
                            <XCircle size={18} /> Skip
                        </button>
                    </div>

                    <Link to={`/dsa-editor/${q.id}`} target="_blank" className="tp-open-editor">
                        Open in Editor →
                    </Link>
                </div>

                {/* Navigation dots */}
                <div className="tp-q-nav">
                    {session.questions.map((_, i) => (
                        <button
                            key={i}
                            className={`tp-q-dot ${i === currentQ ? 'current' : ''} ${answers[session.questions[i].id] === true ? 'solved' : answers[session.questions[i].id] === false ? 'skipped' : ''}`}
                            onClick={() => setCurrentQ(i)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Results
    if (phase === 'results' && results) {
        return (
            <div className="tp-container">
                <div className="tp-results">
                    <div className="tp-results-header anim-score-reveal">
                        <Trophy size={40} style={{ color: '#f59e0b' }} />
                        <h1>Session Complete!</h1>
                    </div>

                    <div className="tp-results-grid">
                        <div className="tp-result-card">
                            <span className="tp-result-val anim-counter-bounce">{results.solved}</span>
                            <span className="tp-result-label">Solved</span>
                        </div>
                        <div className="tp-result-card">
                            <span className="tp-result-val">{results.total}</span>
                            <span className="tp-result-label">Total</span>
                        </div>
                        <div className="tp-result-card">
                            <span className="tp-result-val" style={{ color: results.accuracy >= 70 ? '#22c55e' : results.accuracy >= 40 ? '#f59e0b' : '#ef4444' }}>
                                {results.accuracy}%
                            </span>
                            <span className="tp-result-label">Accuracy</span>
                        </div>
                        <div className="tp-result-card">
                            <span className="tp-result-val">{formatTime(results.timeUsed)}</span>
                            <span className="tp-result-label">Time Used</span>
                        </div>
                    </div>

                    <div className="tp-results-actions">
                        <button
                            className="tp-btn-primary"
                            onClick={() => {
                                setPaused(false);
                                setSession(null);
                                setResults(null);
                                setError(null);
                                setPhase('select');
                            }}
                        >
                            <RotateCcw size={16} /> Try Another Session
                        </button>
                        <Link to="/problems" className="tp-btn-secondary">
                            Browse Problems →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
