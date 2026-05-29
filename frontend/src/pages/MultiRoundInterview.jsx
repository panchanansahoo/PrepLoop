import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Play, ChevronRight, Trophy, Star, BarChart3,
    CheckCircle, Clock, ArrowRight, RotateCcw, Zap,
    Code2, Users, Brain, Briefcase, Award, Target
} from 'lucide-react';
import { COMPANIES, ROLES, DIFFICULTIES } from '../data/companyPrepMeta';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { Link, useNavigate } from 'react-router-dom';

import { API_URL } from '../config/api.js';

// ─── Interview Round Definitions ───
const ROUND_TYPES = [
    {
        id: 'dsa',
        name: 'DSA / Coding',
        stage: 'DSA / Coding',
        icon: <Code2 size={20} />,
        color: '#8b5cf6',
        description: 'Coding problems — like what you\'d see on LeetCode 🧩',
        duration: '25 min',
        questions: 4
    },
    {
        id: 'system-design',
        name: 'System Design',
        stage: 'System Design',
        icon: <Brain size={20} />,
        color: '#3b82f6',
        description: 'Design real systems — think big picture & architecture 🏛️',
        duration: '20 min',
        questions: 3
    },
    {
        id: 'behavioral',
        name: 'Behavioral',
        stage: 'Behavioral',
        icon: <Users size={20} />,
        color: '#22c55e',
        description: 'Your experiences & teamwork stories — college projects count! 🤝',
        duration: '15 min',
        questions: 3
    },
    {
        id: 'hr',
        name: 'HR Discussion',
        stage: 'HR',
        icon: <Briefcase size={20} />,
        color: '#f59e0b',
        description: 'Get to know you — your goals, interests & personality 😊',
        duration: '10 min',
        questions: 2
    }
];

export default function MultiRoundInterview() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Configuration
    const [company, setCompany] = useState('google');
    const [role, setRole] = useState('SDE');
    const [difficulty, setDifficulty] = useState('Medium');
    const [selectedRounds, setSelectedRounds] = useState(['dsa', 'system-design', 'behavioral']);

    // Progress
    const [phase, setPhase] = useState('setup'); // setup | transition | active | report
    const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
    const [roundResults, setRoundResults] = useState([]); // {roundId, score, strengths, improvements, conversation}

    const companyObj = COMPANIES.find(c => c.id === company) || COMPANIES[0];
    const activeRounds = ROUND_TYPES.filter(r => selectedRounds.includes(r.id));

    const getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    // Toggle round selection
    const toggleRound = (roundId) => {
        setSelectedRounds(prev =>
            prev.includes(roundId)
                ? prev.filter(id => id !== roundId)
                : [...prev, roundId]
        );
    };

    // Get overall stats
    const overallScore = useMemo(() => {
        if (roundResults.length === 0) return 0;
        return Math.round(roundResults.reduce((sum, r) => sum + (r.score || 0), 0) / roundResults.length);
    }, [roundResults]);

    const getVerdict = (score) => {
        if (score >= 85) return { text: 'Strong Hire 🌟', color: '#22c55e' };
        if (score >= 70) return { text: 'Would Advance 👍', color: '#3b82f6' };
        if (score >= 55) return { text: 'Borderline 🤔', color: '#f59e0b' };
        return { text: 'Needs Improvement 📚', color: '#ef4444' };
    };

    // Start interview → navigate to CompanyInterview with the right config
    const startRound = () => {
        const round = activeRounds[currentRoundIdx];
        if (!round) return;

        // Store multi-round context in sessionStorage for CompanyInterview to pick up
        sessionStorage.setItem('multiRoundContext', JSON.stringify({
            multiRound: true,
            company,
            role,
            difficulty,
            currentRoundIdx,
            totalRounds: activeRounds.length,
            roundId: round.id,
            stage: round.stage,
            questionsPerRound: round.questions,
            previousRounds: roundResults
        }));

        navigate(`/company-interview?multiRound=true&stage=${encodeURIComponent(round.stage)}&company=${company}&role=${role}&difficulty=${difficulty}`);
    };

    // Record round result (called when returning from interview)
    const recordRoundResult = useCallback((result) => {
        setRoundResults(prev => [...prev, result]);
        if (currentRoundIdx + 1 < activeRounds.length) {
            setCurrentRoundIdx(prev => prev + 1);
            setPhase('transition');
        } else {
            setPhase('report');
            // Save full session
            saveMultiRoundSession([...roundResults, result]);
        }
    }, [currentRoundIdx, activeRounds.length, roundResults]);

    // Save session to backend
    const saveMultiRoundSession = async (results) => {
        try {
            await authFetch(`${API_URL}/api/company-interview/save-session`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'multi-round',
                    company,
                    role,
                    difficulty,
                    rounds: results,
                    overallScore: Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / results.length),
                    completedAt: new Date().toISOString()
                })
            });
        } catch (e) {
            console.error('Failed to save multi-round session:', e);
        }
    };

    // Check for returning from a round
    React.useEffect(() => {
        const returnData = sessionStorage.getItem('multiRoundResult');
        if (returnData) {
            sessionStorage.removeItem('multiRoundResult');
            const result = JSON.parse(returnData);
            recordRoundResult(result);
        }
    }, [recordRoundResult]);

    // ═══════════════════════════════════════════
    //  SETUP PHASE — Select company, rounds
    // ═══════════════════════════════════════════
    if (phase === 'setup') {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#080811',
                color: 'var(--text-primary)',
                padding: '48px 24px',
                fontFamily: "'Inter', system-ui, sans-serif",
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Effects */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `
                        radial-gradient(ellipse 60% 50% at 20% 15%, rgba(99,102,241,0.1) 0%, transparent 65%),
                        radial-gradient(ellipse 40% 40% at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 65%)`,
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `
                        repeating-linear-gradient(90deg, rgba(99,102,241,0.012) 0px, rgba(99,102,241,0.012) 1px, transparent 1px, transparent 60px),
                        repeating-linear-gradient(0deg, rgba(99,102,241,0.012) 0px, rgba(99,102,241,0.012) 1px, transparent 1px, transparent 60px)`,
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <Link to="/dashboard" style={{
                            color: 'var(--border)', textDecoration: 'none', fontSize: 13,
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginBottom: 20, transition: 'color 0.2s', fontWeight: 500
                        }}>
                            ← Back to Dashboard
                        </Link>
                        <h1 style={{
                            fontSize: 32, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg, #fff 0%, var(--border) 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>
                            <Zap size={26} style={{ color: '#8b5cf6', verticalAlign: '-3px', marginRight: 8 }} />
                            Full Interview Loop
                        </h1>
                        <p style={{ color: 'var(--border)', fontSize: 14, fontWeight: 500 }}>
                            Simulate a complete multi-round interview cycle — just like the real thing
                        </p>
                    </div>

                    {/* Interview Setup Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid rgba(99,102,241,0.1)',
                        borderRadius: 20, padding: 28, marginBottom: 20,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 var(--border)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Top gradient line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)'
                        }} />
                        <h3 style={{
                            fontSize: 13, fontWeight: 700, marginBottom: 18,
                            color: 'var(--border)', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            Interview Setup
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                            {[
                                { label: 'Company', value: company, onChange: e => setCompany(e.target.value), options: COMPANIES.map(c => ({ value: c.id, label: c.name })) },
                                { label: 'Role', value: role, onChange: e => setRole(e.target.value), options: ROLES.map(r => ({ value: r, label: r })) },
                                { label: 'Difficulty', value: difficulty, onChange: e => setDifficulty(e.target.value), options: DIFFICULTIES.map(d => ({ value: d, label: d })) }
                            ].map((field, i) => (
                                <div key={i}>
                                    <label style={{
                                        fontSize: 10, color: 'var(--border)', display: 'block',
                                        marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px'
                                    }}>{field.label}</label>
                                    <select
                                        value={field.value}
                                        onChange={field.onChange}
                                        style={{
                                            width: '100%', padding: '11px 36px 11px 14px',
                                            background: 'var(--border)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 12, color: '#fff', fontSize: 13,
                                            fontWeight: 600, fontFamily: 'inherit',
                                            outline: 'none', cursor: 'pointer', appearance: 'none',
                                            transition: 'all 0.25s',
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 12px center'
                                        }}
                                    >
                                        {field.options.map(o => <option key={o.value} value={o.value} style={{ background: '#13131f' }}>{o.label}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Round Selection Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid rgba(99,102,241,0.1)',
                        borderRadius: 20, padding: 28, marginBottom: 24,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 var(--border)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)'
                        }} />
                        <h3 style={{
                            fontSize: 13, fontWeight: 700, marginBottom: 18,
                            color: 'var(--border)', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            Select Interview Rounds
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                            {ROUND_TYPES.map(round => {
                                const isSelected = selectedRounds.includes(round.id);
                                return (
                                    <div
                                        key={round.id}
                                        onClick={() => toggleRound(round.id)}
                                        style={{
                                            padding: '18px 20px',
                                            background: isSelected
                                                ? `linear-gradient(145deg, ${round.color}12, ${round.color}08)`
                                                : 'var(--border)',
                                            border: `1.5px solid ${isSelected ? round.color + '35' : 'var(--border)'}`,
                                            borderRadius: 16,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transform: isSelected ? 'scale(1)' : 'scale(1)',
                                            boxShadow: isSelected ? `0 0 24px ${round.color}12` : 'none'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'var(--border)';
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'var(--border)';
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44,
                                            borderRadius: 12,
                                            background: isSelected ? round.color + '18' : 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isSelected ? round.color : 'var(--border)',
                                            transition: 'all 0.3s',
                                            flexShrink: 0,
                                            border: `1px solid ${isSelected ? round.color + '25' : 'var(--border)'}`
                                        }}>
                                            {round.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 700, fontSize: 14,
                                                color: isSelected ? '#fff' : 'var(--border)',
                                                transition: 'color 0.3s'
                                            }}>{round.name}</div>
                                            <div style={{
                                                fontSize: 12, color: 'var(--border)',
                                                marginTop: 3, lineHeight: 1.4
                                            }}>{round.description}</div>
                                            <div style={{
                                                fontSize: 11, color: isSelected ? round.color : 'var(--border)',
                                                marginTop: 5, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                transition: 'color 0.3s'
                                            }}>
                                                <span>⏱ {round.duration}</span>
                                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', opacity: 0.4 }} />
                                                <span>{round.questions} questions</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: 22, height: 22,
                                            borderRadius: 7,
                                            border: `2px solid ${isSelected ? round.color : 'var(--border)'}`,
                                            background: isSelected ? round.color : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            flexShrink: 0,
                                            boxShadow: isSelected ? `0 0 12px ${round.color}40` : 'none'
                                        }}>
                                            {isSelected && <CheckCircle size={13} color="white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={() => { setPhase('transition'); setCurrentRoundIdx(0); }}
                        disabled={selectedRounds.length === 0}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: selectedRounds.length > 0
                                ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)'
                                : 'var(--border)',
                            color: selectedRounds.length > 0 ? 'white' : 'var(--border)',
                            border: selectedRounds.length > 0 ? 'none' : '1px solid var(--border)',
                            borderRadius: 16,
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: selectedRounds.length > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            fontFamily: 'inherit',
                            boxShadow: selectedRounds.length > 0
                                ? '0 6px 30px rgba(99,102,241,0.35), inset 0 1px 0 var(--border)'
                                : 'none',
                            letterSpacing: '0.3px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                            if (selectedRounds.length > 0) {
                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                e.currentTarget.style.boxShadow = '0 20px 48px rgba(99,102,241,0.5), 0 0 0 4px rgba(99,102,241,0.15)';
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = selectedRounds.length > 0
                                ? '0 6px 30px rgba(99,102,241,0.35), inset 0 1px 0 var(--border)' : 'none';
                        }}
                    >
                        <Play size={18} />
                        Start {selectedRounds.length}-Round Interview Loop
                    </button>

                    {/* Privacy note */}
                    <div style={{
                        textAlign: 'center', marginTop: 16, fontSize: 11,
                        color: 'var(--border)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 4
                    }}>
                        🔒 Your interview data is private and never shared
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  TRANSITION SCREEN — Between rounds
    // ═══════════════════════════════════════════
    if (phase === 'transition') {
        const currentRound = activeRounds[currentRoundIdx];
        const prevResult = roundResults[currentRoundIdx - 1];

        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ maxWidth: 500, textAlign: 'center', padding: 40 }}>
                    {/* Round progress dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                        {activeRounds.map((round, i) => (
                            <div key={round.id} style={{
                                width: i === currentRoundIdx ? 32 : 10,
                                height: 10,
                                borderRadius: 5,
                                background: i < currentRoundIdx ? '#22c55e' : i === currentRoundIdx ? round.color : 'var(--border)',
                                transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>

                    {/* Previous round score */}
                    {prevResult && (
                        <div style={{
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 24,
                            animation: 'fadeIn 0.5s ease'
                        }}>
                            <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 4 }}>
                                ✅ Round {currentRoundIdx} Complete
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                                {prevResult.score}%
                            </div>
                        </div>
                    )}

                    {/* Next round info */}
                    <div style={{
                        width: 64, height: 64,
                        borderRadius: 16,
                        background: currentRound?.color + '20',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        color: currentRound?.color,
                        fontSize: 28
                    }}>
                        {currentRound?.icon}
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                        Round {currentRoundIdx + 1}: {currentRound?.name}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
                        {currentRound?.description}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 32 }}>
                        {currentRound?.questions} questions · {currentRound?.duration}
                    </p>

                    <button
                        onClick={startRound}
                        style={{
                            padding: '14px 32px',
                            background: `linear-gradient(135deg, ${currentRound?.color}, ${currentRound?.color}dd)`,
                            color: 'white',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            margin: '0 auto',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ArrowRight size={16} />
                        Begin Round {currentRoundIdx + 1}
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  FINAL REPORT — All rounds complete
    // ═══════════════════════════════════════════
    if (phase === 'report') {
        const verdict = getVerdict(overallScore);

        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                color: 'var(--text-primary)',
                padding: '40px 20px',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Trophy size={40} style={{ color: '#f59e0b', marginBottom: 12 }} />
                        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                            Interview Complete!
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {companyObj.name} · {role} · {activeRounds.length} rounds completed
                        </p>
                    </div>

                    {/* Overall Score */}
                    <div style={{
                        background: 'var(--border)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 32,
                        textAlign: 'center',
                        marginBottom: 24
                    }}>
                        <div style={{
                            width: 100, height: 100,
                            borderRadius: '50%',
                            background: `conic-gradient(${verdict.color} ${overallScore * 3.6}deg, var(--border) 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <div style={{
                                width: 80, height: 80,
                                borderRadius: '50%',
                                background: '#0f0f23',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 28, fontWeight: 700, color: verdict.color
                            }}>
                                {overallScore}
                            </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: verdict.color, marginBottom: 4 }}>
                            {verdict.text}
                        </div>
                    </div>

                    {/* Per-Round Breakdown */}
                    <div style={{
                        background: 'var(--border)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 24
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Round Breakdown</h3>
                        {roundResults.map((result, i) => {
                            const round = activeRounds[i];
                            return (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 0',
                                    borderBottom: i < roundResults.length - 1 ? '1px solid var(--border)' : 'none'
                                }}>
                                    <div style={{
                                        width: 34, height: 34,
                                        borderRadius: 8,
                                        background: round?.color + '15',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: round?.color,
                                        flexShrink: 0
                                    }}>
                                        {round?.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{round?.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {result.strengths?.slice(0, 2).join(' · ')}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 18, fontWeight: 700,
                                        color: result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {result.score}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                            onClick={() => { setPhase('setup'); setCurrentRoundIdx(0); setRoundResults([]); }}
                            style={{
                                padding: '12px 24px',
                                background: 'var(--border)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6
                            }}
                        >
                            <RotateCcw size={14} /> Interview Again
                        </button>
                        <Link
                            to="/interview-analytics"
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                border: 'none',
                                borderRadius: 10,
                                color: 'white',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                                textDecoration: 'none'
                            }}
                        >
                            <BarChart3 size={14} /> View Analytics
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
