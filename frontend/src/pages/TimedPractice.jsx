import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { authFetch } from '../utils/authFetch';
import {
    Timer, Zap, Clock, Target, Play, Pause, RotateCcw,
    CheckCircle2, XCircle, ArrowRight, Trophy, Brain
} from 'lucide-react';

const MODES = [
    {
        id: 'quick-10',
        label: '10-Min Quick Round',
        desc: '5 problems in 10 minutes — warm up fast',
        icon: Zap,
        time: 10,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
    },
    {
        id: 'full-30',
        label: '30-Min Full Mock',
        desc: '15 problems in 30 minutes — real test feel',
        icon: Target,
        time: 30,
        color: '#6366f1',
        bg: 'rgba(99, 102, 241, 0.08)',
    },
    {
        id: 'last-day',
        label: 'Last-Day Revision',
        desc: '10 weak-area problems in 20 min — final polish',
        icon: Brain,
        time: 20,
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.08)',
    },
];

export default function TimedPractice() {
    const { _user } = useAuth();
    const [phase, setPhase] = useState('select'); // select | active | results
    const [selectedMode, setSelectedMode] = useState(null);
    const [session, setSession] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [paused, setPaused] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    // Start session
    const startSession = async (mode) => {
        setLoading(true);
        try {
            const res = await authFetch('/api/practice/timed-session', {
                method: 'POST',
                body: JSON.stringify({ mode: mode.id }),
            });
            const data = await res.json();
            setSession(data);
            setTimeLeft(data.timeMinutes * 60);
            setSelectedMode(mode);
            setCurrentQ(0);
            setAnswers({});
            setPhase('active');
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // Timer
    useEffect(() => {
        if (phase !== 'active' || paused) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    finishSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase, paused]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const markAnswer = (qId, solved) => {
        setAnswers(prev => ({ ...prev, [qId]: solved }));
    };

    const finishSession = useCallback(async () => {
        clearInterval(timerRef.current);
        if (!session) return;
        const resultsList = session.questions.map(q => ({
            problemId: q.id,
            solved: answers[q.id] === true,
        }));
        const solved = resultsList.filter(r => r.solved).length;
        const total = resultsList.length;
        setResults({
            solved,
            total,
            accuracy: total > 0 ? Math.round((solved / total) * 100) : 0,
            timeUsed: (selectedMode?.time * 60 || 0) - timeLeft,
        });
        setPhase('results');
    }, [session, answers, timeLeft, selectedMode]);

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
        const q = session.questions[currentQ];
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
                        <button className="tp-btn-icon" onClick={() => setPaused(p => !p)}>
                            {paused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button className="tp-btn-finish" onClick={finishSession}>
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

                    <Link to={`/editor/${q.id}`} target="_blank" className="tp-open-editor">
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
                        <button className="tp-btn-primary" onClick={() => setPhase('select')}>
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
