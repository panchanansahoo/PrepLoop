import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Play, ChevronRight, Trophy, Star, BarChart3, CheckCircle, Clock, ArrowRight, RotateCcw, Zap, Code2, Users, Brain, Briefcase, Award, Target, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import {  COMPANIES, ROLES, DIFFICULTIES } from '../data/companyPrepMeta';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { Link, useNavigate } from 'react-router-dom';

import { API_URL } from '../config/api.js';

// ─── Bar-Raiser Veto Thresholds & Weights ───
const BAR_RAISER_THRESHOLDS = {
    dsa: 65,
    coding: 65,
    'system-design': 60,
    behavioral: 60,
    hr: 55,
    default: 60
};

const ROUND_WEIGHTS = {
    dsa: 35,
    coding: 35,
    'system-design': 30,
    behavioral: 20,
    hr: 15,
    default: 20
};

function normalizeClientRoundType(round) {
    if (!round) return 'default';
    const raw = typeof round === 'string'
        ? round
        : (round.roundId || round.id || round.stage || round.name || '');
    const lower = String(raw).trim().toLowerCase();
    if (lower.includes('dsa') || lower.includes('coding') || lower.includes('algorithm')) return 'dsa';
    if (lower.includes('system') || lower.includes('design') || lower.includes('architecture')) return 'system-design';
    if (lower.includes('behavioral') || lower.includes('leadership')) return 'behavioral';
    if (lower.includes('hr')) return 'hr';
    return 'default';
}

function evaluateBarRaiserClient(results, company = '', role = '') {
    if (!results || results.length === 0) return null;
    const roundEvaluations = [];
    const vetoReasons = [];
    let totalScoreSum = 0;
    let weightedScoreSum = 0;
    let totalWeightSum = 0;

    results.forEach((r, idx) => {
        const normKey = normalizeClientRoundType(r);
        const threshold = BAR_RAISER_THRESHOLDS[normKey] || BAR_RAISER_THRESHOLDS.default;
        const score = Math.round(Number(r.score ?? r.percentage ?? r.finalScore?.percentage ?? 0));
        const passed = score >= threshold;
        const isVeto = !passed;
        const roundName = r.name || r.stage || r.roundId || `Round ${idx + 1}`;

        if (isVeto) {
            vetoReasons.push(`[Bar-Raiser Veto] ${roundName} score of ${score}% failed the mandatory threshold of ${threshold}%.`);
        }

        const weight = ROUND_WEIGHTS[normKey] || ROUND_WEIGHTS.default;
        totalScoreSum += score;
        weightedScoreSum += score * weight;
        totalWeightSum += weight;

        roundEvaluations.push({
            roundIndex: idx,
            roundId: r.roundId || normKey,
            name: roundName,
            stage: r.stage || roundName,
            score,
            threshold,
            passed,
            veto: isVeto,
            weight,
            strengths: Array.isArray(r.strengths) ? r.strengths : [],
            improvements: Array.isArray(r.improvements) ? r.improvements : [],
            feedback: r.feedback || ''
        });
    });

    const averageScore = Math.round(totalScoreSum / results.length);
    const weightedScore = totalWeightSum > 0 ? Math.round(weightedScoreSum / totalWeightSum) : averageScore;
    const vetoTriggered = vetoReasons.length > 0;

    let status = 'NO_HIRE';
    let verdict = 'Needs Improvement 📚';
    let badge = 'Needs Improvement 📚';
    let color = '#ef4444';
    let recommendation = '';

    if (vetoTriggered) {
        status = 'VETOED';
        verdict = 'No Hire (Bar-Raiser Veto)';
        badge = 'Vetoed by Bar-Raiser ❌';
        color = '#ef4444';
        const failedRoundsStr = roundEvaluations
            .filter((re) => re.veto)
            .map((re) => `${re.name} (${re.score}% vs min ${re.threshold}%)`)
            .join(', ');
        recommendation = `The Hiring Committee has issued a Bar-Raiser Veto. While average performance across rounds was ${averageScore}%, the candidate failed to satisfy minimum required competencies in: ${failedRoundsStr}. In calibrated committee deliberation, high scores in non-core rounds cannot override a failure to meet the baseline standard.`;
    } else if (weightedScore >= 85) {
        status = 'STRONG_HIRE';
        verdict = 'Strong Hire 🌟';
        badge = 'Strong Hire 🌟';
        color = '#22c55e';
        recommendation = `Outstanding performance across all interview dimensions. Candidate comfortably surpassed all bar-raiser thresholds with a weighted score of ${weightedScore}%, demonstrating clear domain mastery and communication excellence.`;
    } else if (weightedScore >= 70) {
        status = 'HIRE';
        verdict = 'Would Advance 👍';
        badge = 'Would Advance 👍';
        color = '#3b82f6';
        recommendation = `Consistently satisfied all competency bars with a calibrated score of ${weightedScore}%. The candidate meets the role requirements across technical and behavioral dimensions with positive committee consensus.`;
    } else if (weightedScore >= 60) {
        status = 'BORDERLINE';
        verdict = 'Borderline 🤔';
        badge = 'Borderline 🤔';
        color = '#f59e0b';
        recommendation = `Candidate met minimum passing thresholds across rounds (weighted score ${weightedScore}%), but performance was near the margin. Hiring Committee recommends an additional targeted debrief before a final leveling decision.`;
    } else {
        status = 'NO_HIRE';
        verdict = 'Needs Improvement 📚';
        badge = 'Needs Improvement 📚';
        color = '#ef4444';
        recommendation = `Overall calibrated score of ${weightedScore}% fell below the advancement threshold. Candidate should focus on targeted technical practice before reapplying.`;
    }

    return {
        status,
        verdict,
        badge,
        color,
        vetoTriggered,
        vetoReasons,
        averageScore,
        weightedScore,
        company,
        role,
        roundEvaluations,
        recommendation,
        passingThresholds: BAR_RAISER_THRESHOLDS
    };
}

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

    // Read stored context if returning from an individual round
    const initialCtx = useRef((() => {
        try {
            const raw = sessionStorage.getItem('multiRoundContext');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })());

    // Configuration
    const [company, setCompany] = useState(() => initialCtx.current?.company || 'google');
    const [role, setRole] = useState(() => initialCtx.current?.role || 'SDE');
    const [difficulty, setDifficulty] = useState(() => initialCtx.current?.difficulty || 'Medium');
    const [selectedRounds, setSelectedRounds] = useState(() => initialCtx.current?.selectedRounds || ['dsa', 'system-design', 'behavioral']);

    // Progress
    const [phase, setPhase] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                if (sessionStorage.getItem('multiRoundResult')) {
                    const rawCtx = sessionStorage.getItem('multiRoundContext');
                    if (rawCtx) {
                        const ctx = JSON.parse(rawCtx);
                        const nextIdx = (ctx.currentRoundIdx ?? 0) + 1;
                        const total = ctx.totalRounds ?? (ctx.selectedRounds ? ctx.selectedRounds.length : 3);
                        return nextIdx < total ? 'transition' : 'report';
                    }
                    return 'transition';
                }
                if (initialCtx.current?.currentRoundIdx > 0 && initialCtx.current?.previousRounds?.length > 0) {
                    const total = initialCtx.current.totalRounds ?? (initialCtx.current.selectedRounds ? initialCtx.current.selectedRounds.length : 3);
                    return initialCtx.current.currentRoundIdx < total ? 'transition' : 'report';
                }
            }
        } catch {}
        return 'setup';
    });
    const [currentRoundIdx, setCurrentRoundIdx] = useState(() => {
        try {
            if (typeof window !== 'undefined' && sessionStorage.getItem('multiRoundResult')) {
                const rawCtx = sessionStorage.getItem('multiRoundContext');
                if (rawCtx) {
                    const ctx = JSON.parse(rawCtx);
                    return (ctx.currentRoundIdx ?? 0) + 1;
                }
            }
        } catch {}
        return initialCtx.current?.currentRoundIdx || 0;
    });
    const [roundResults, setRoundResults] = useState(() => {
        try {
            if (typeof window !== 'undefined' && sessionStorage.getItem('multiRoundResult')) {
                const rawResult = sessionStorage.getItem('multiRoundResult');
                const prev = initialCtx.current?.previousRounds || [];
                if (rawResult) {
                    const parsed = JSON.parse(rawResult);
                    const score = Math.round(Number(parsed.score ?? parsed.percentage ?? parsed.finalScore?.percentage ?? 0));
                    return [...prev, { ...parsed, score }];
                }
            }
        } catch {}
        return initialCtx.current?.previousRounds || [];
    });
    const saveIdempotencyKeyRef = useRef(
        `multi-round-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    );

    // Multi-round persistent session & hiring decision state
    const [sessionId, setSessionId] = useState(() => {
        return initialCtx.current?.sessionId ||
            (typeof window !== 'undefined' ? sessionStorage.getItem('multiRoundSessionId') : null) ||
            null;
    });
    const [hiringDecision, setHiringDecision] = useState(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('multiRoundHiringDecision');
                return stored ? JSON.parse(stored) : null;
            }
        } catch {}
        return null;
    });

    const companyObj = COMPANIES.find(c => c.id === company) || COMPANIES[0];
    const activeRounds = ROUND_TYPES.filter(r => selectedRounds.includes(r.id));

    const getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    // Restore multi-round session from database to prevent tab-close data loss
    React.useEffect(() => {
        let isMounted = true;
        const restoreSession = async () => {
            const storedSessionId = sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('multiRoundSessionId') : null);
            if (!storedSessionId) return;

            try {
                const res = await authFetch(`${API_URL}/api/company-interview/multi-round/session/${storedSessionId}`, {
                    headers: getAuthHeaders()
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted || !data?.session) return;
                const s = data.session;
                if (s.company) setCompany(s.company);
                if (s.role) setRole(s.role);
                if (Array.isArray(s.round_scores) && s.round_scores.length > 0) {
                    setRoundResults(s.round_scores);
                    if (s.status === 'completed') {
                        setPhase('report');
                    } else if (typeof s.current_round === 'number') {
                        setCurrentRoundIdx(s.current_round);
                        setPhase('transition');
                    }
                }
                if (s.hiring_decision) {
                    setHiringDecision(s.hiring_decision);
                    try {
                        sessionStorage.setItem('multiRoundHiringDecision', JSON.stringify(s.hiring_decision));
                    } catch {}
                }
            } catch (e) {
                console.warn('[multi-round] Session restore fallback to local state:', e?.message);
            }
        };

        restoreSession();
        return () => { isMounted = false; };
    }, []);

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

    // Start interview loop - initializes or resumes multi-round session in database
    const handleStartLoop = async () => {
        let currentId = sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('multiRoundSessionId') : null);
        if (!currentId) {
            currentId = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `multi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }
        setSessionId(currentId);
        try {
            sessionStorage.setItem('multiRoundSessionId', currentId);
        } catch {}

        try {
            const res = await authFetch(`${API_URL}/api/company-interview/multi-round/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    company,
                    role,
                    difficulty,
                    selectedRounds,
                    sessionId: currentId,
                    resume: true
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.session?.id) {
                    currentId = data.session.id;
                    setSessionId(currentId);
                    try {
                        sessionStorage.setItem('multiRoundSessionId', currentId);
                    } catch {}
                }
            }
        } catch (e) {
            console.warn('[multi-round] Session start fallback to offline/guest:', e?.message);
        }

        setPhase('transition');
        setCurrentRoundIdx(0);
    };

    // Start interview → navigate to CodingAssessment or CompanyInterview with the right config
    const startRound = () => {
        const round = activeRounds[currentRoundIdx];
        if (!round) return;

        const effectiveSessionId = sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('multiRoundSessionId') : null) || saveIdempotencyKeyRef.current;

        // Store multi-round context in sessionStorage for CodingAssessment / CompanyInterview to pick up
        sessionStorage.setItem('multiRoundContext', JSON.stringify({
            multiRound: true,
            sessionId: effectiveSessionId,
            company,
            role,
            difficulty,
            selectedRounds,
            currentRoundIdx,
            totalRounds: activeRounds.length,
            roundId: round.id,
            stage: round.stage,
            questionsPerRound: round.questions,
            previousRounds: roundResults
        }));

        if (round.id === 'dsa') {
            navigate(`/coding-round?multiRound=true&company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`);
            return;
        }

        navigate(`/company-interview?multiRound=true&stage=${encodeURIComponent(round.stage)}&company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}&difficulty=${encodeURIComponent(difficulty)}`);
    };

    // Save session to backend and local history
    const saveMultiRoundSession = async (results, sessionCompany = company, sessionRole = role, sessionDiff = difficulty) => {
        const overallScore = Math.round(results.reduce((s, r) => s + (r.score || 0), 0) / (results.length || 1));
        const localSessionId = sessionId || saveIdempotencyKeyRef.current || `multi-${Date.now()}`;
        try {
            const historyKey = "preploop_local_interview_history";
            const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
            const newLocal = {
                id: localSessionId,
                session_id: localSessionId,
                session_type: "multi-round",
                company: sessionCompany || "General",
                role: sessionRole || "Software Engineer",
                stage: "Multi-Round",
                difficulty: sessionDiff || "medium",
                overall_score: overallScore,
                score: overallScore,
                rounds: results,
                completed_at: new Date().toISOString()
            };
            localStorage.setItem(historyKey, JSON.stringify([newLocal, ...existing.filter(s => s.id !== localSessionId)].slice(0, 50)));
        } catch { /* empty */ }
        try {
            await authFetch(`${API_URL}/api/company-interview/save-session`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Idempotency-Key": localSessionId,
                },
                body: JSON.stringify({
                    sessionId: localSessionId,
                    type: "multi-round",
                    company: sessionCompany,
                    role: sessionRole,
                    difficulty: sessionDiff,
                    rounds: results,
                    overallScore,
                    completedAt: new Date().toISOString()
                })
            });
        } catch (e) {
            console.error("Failed to save multi-round session:", e);
        }
    };

    // Check for returning from a round
    React.useEffect(() => {
        const returnData = sessionStorage.getItem('multiRoundResult');
        const ctx = initialCtx.current;
        if (returnData) {
            sessionStorage.removeItem('multiRoundResult');
            let result = null;
            try {
                result = JSON.parse(returnData);
            } catch (e) {
                console.error("Failed to parse multiRoundResult:", e);
            }
            if (result) {
                const roundScore = Math.round(Number(result.score ?? result.percentage ?? result.finalScore?.percentage ?? 0));
                const normalizedResult = {
                    roundId: result.roundId || ctx?.roundId || 'dsa',
                    stage: result.stage || ctx?.stage || 'DSA / Coding',
                    strengths: Array.isArray(result.strengths) && result.strengths.length > 0
                        ? result.strengths
                        : [
                            result.passedProblems !== undefined ? `Passed ${result.passedProblems}/${result.totalProblems || result.passedProblems} problems` : 'Coding assessment completed',
                            result.verdict || `${roundScore}% score`
                        ],
                    improvements: Array.isArray(result.improvements) ? result.improvements : [],
                    ...result,
                    score: roundScore
                };

                const prevRounds = ctx?.previousRounds || [];
                const updatedResults = [...prevRounds, normalizedResult];
                setRoundResults(updatedResults);

                const restoredIdx = ctx ? (ctx.currentRoundIdx ?? 0) : 0;
                const nextIdx = restoredIdx + 1;
                setCurrentRoundIdx(nextIdx);

                const total = ctx?.totalRounds ?? (ctx?.selectedRounds ? ctx.selectedRounds.length : activeRounds.length);
                const isCompleted = nextIdx >= total;
                const targetSessionId = sessionId || ctx?.sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('multiRoundSessionId') : null) || saveIdempotencyKeyRef.current;

                // Client-side fallback Bar-Raiser decision
                const localDecision = evaluateBarRaiserClient(updatedResults, ctx?.company || company, ctx?.role || role);
                if (localDecision) {
                    setHiringDecision(localDecision);
                    try {
                        sessionStorage.setItem('multiRoundHiringDecision', JSON.stringify(localDecision));
                    } catch {}
                }

                // Checkpoint completed round to backend database session
                if (targetSessionId) {
                    authFetch(`${API_URL}/api/company-interview/multi-round/session/${targetSessionId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeaders()
                        },
                        body: JSON.stringify({
                            current_round: nextIdx,
                            roundScores: updatedResults,
                            roundScore: normalizedResult,
                            status: isCompleted ? 'completed' : 'in_progress',
                            totalRounds: total,
                            company: ctx?.company || company,
                            role: ctx?.role || role
                        })
                    })
                    .then(async (res) => {
                        if (res.ok) {
                            const data = await res.json();
                            if (data.hiringDecision) {
                                setHiringDecision(data.hiringDecision);
                                try {
                                    sessionStorage.setItem('multiRoundHiringDecision', JSON.stringify(data.hiringDecision));
                                } catch {}
                            }
                            if (data.session?.id) {
                                setSessionId(data.session.id);
                                try {
                                    sessionStorage.setItem('multiRoundSessionId', data.session.id);
                                } catch {}
                            }
                        }
                    })
                    .catch((err) => {
                        console.warn('[multi-round] Checkpoint PUT fallback:', err?.message);
                    });
                }

                if (!isCompleted) {
                    setPhase('transition');
                    sessionStorage.setItem('multiRoundContext', JSON.stringify({
                        ...(ctx || {}),
                        multiRound: true,
                        sessionId: targetSessionId,
                        company: ctx?.company || company,
                        role: ctx?.role || role,
                        difficulty: ctx?.difficulty || difficulty,
                        selectedRounds: ctx?.selectedRounds || selectedRounds,
                        currentRoundIdx: nextIdx,
                        totalRounds: total,
                        previousRounds: updatedResults
                    }));
                } else {
                    setPhase('report');
                    sessionStorage.removeItem('multiRoundContext');
                    saveMultiRoundSession(
                        updatedResults,
                        ctx?.company || company,
                        ctx?.role || role,
                        ctx?.difficulty || difficulty
                    );
                }
            }
        }
    }, [company, role, difficulty, activeRounds.length, sessionId]);

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
                            color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', fontSize: 13,
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginBottom: 20, transition: 'color 0.2s', fontWeight: 500
                        }}>
                            ← Back to Dashboard
                        </Link>
                        <h1 style={{
                            fontSize: 32, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px',
                            background: 'linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>
                            <Zap size={26} style={{ color: '#8b5cf6', verticalAlign: '-3px', marginRight: 8 }} />
                            Full Interview Loop
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 14, fontWeight: 500 }}>
                            Simulate a complete multi-round interview cycle — just like the real thing
                        </p>
                    </div>

                    {/* Interview Setup Card */}
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid rgba(99,102,241,0.1)',
                        borderRadius: 20, padding: 28, marginBottom: 20,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Top gradient line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)'
                        }} />
                        <h3 style={{
                            fontSize: 13, fontWeight: 700, marginBottom: 18,
                            color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px'
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
                                        fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', display: 'block',
                                        marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px'
                                    }}>{field.label}</label>
                                    <select
                                        value={field.value}
                                        onChange={field.onChange}
                                        style={{
                                            width: '100%', padding: '11px 36px 11px 14px',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
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
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)'
                        }} />
                        <h3 style={{
                            fontSize: 13, fontWeight: 700, marginBottom: 18,
                            color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px'
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
                                                : 'rgba(255, 255, 255, 0.02)',
                                            border: `1.5px solid ${isSelected ? round.color + '35' : 'rgba(255, 255, 255, 0.08)'}`,
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
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44,
                                            borderRadius: 12,
                                            background: isSelected ? round.color + '18' : 'rgba(255, 255, 255, 0.04)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isSelected ? round.color : 'rgba(255, 255, 255, 0.4)',
                                            transition: 'all 0.3s',
                                            flexShrink: 0,
                                            border: `1px solid ${isSelected ? round.color + '25' : 'rgba(255, 255, 255, 0.08)'}`
                                        }}>
                                            {round.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 700, fontSize: 14,
                                                color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                                                transition: 'color 0.3s'
                                            }}>{round.name}</div>
                                            <div style={{
                                                fontSize: 12, color: 'rgba(255, 255, 255, 0.5)',
                                                marginTop: 3, lineHeight: 1.4
                                            }}>{round.description}</div>
                                            <div style={{
                                                fontSize: 11, color: isSelected ? round.color : 'rgba(255, 255, 255, 0.4)',
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
                                            border: `2px solid ${isSelected ? round.color : 'rgba(255, 255, 255, 0.2)'}`,
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
                        onClick={handleStartLoop}
                        disabled={selectedRounds.length === 0}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: selectedRounds.length > 0
                                ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #8b5cf6 100%)'
                                : 'rgba(255, 255, 255, 0.04)',
                            color: selectedRounds.length > 0 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                            border: selectedRounds.length > 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
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
                                ? '0 6px 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
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
                                ? '0 6px 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none';
                        }}
                    >
                        <Play size={18} />
                        Start {selectedRounds.length}-Round Interview Loop
                    </button>

                    {/* Privacy note */}
                    <div style={{
                        textAlign: 'center', marginTop: 16, fontSize: 11,
                        color: 'rgba(255, 255, 255, 0.45)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 4
                    }}>
                        🔒 Audio is never stored. Transcripts are anonymized before AI evaluation.
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
                                background: i < currentRoundIdx ? '#22c55e' : i === currentRoundIdx ? round.color : 'rgba(255, 255, 255, 0.1)',
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
        const effectiveDecision = hiringDecision || evaluateBarRaiserClient(roundResults, company, role);
        const isVetoed = Boolean(effectiveDecision?.vetoTriggered);
        const finalScore = effectiveDecision?.weightedScore ?? overallScore;
        const avgScore = effectiveDecision?.averageScore ?? overallScore;
        const verdictObj = effectiveDecision ? {
            text: effectiveDecision.verdict,
            color: effectiveDecision.color,
            badge: effectiveDecision.badge
        } : getVerdict(overallScore);

        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                color: 'var(--text-primary)',
                padding: '40px 20px',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <Trophy size={40} style={{ color: '#f59e0b', marginBottom: 12 }} />
                        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
                            Interview Loop Complete
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            {companyObj.name} · {role} · {roundResults.length} rounds completed
                        </p>
                    </div>

                    {/* Hiring Committee Bar-Raiser Deliberation Banner */}
                    <div style={{
                        background: isVetoed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1.5px solid ${isVetoed ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`,
                        borderRadius: 16,
                        padding: '20px 24px',
                        marginBottom: 24,
                        backdropFilter: 'blur(10px)',
                        boxShadow: isVetoed ? '0 0 30px rgba(239, 68, 68, 0.15)' : '0 0 30px rgba(34, 197, 94, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {isVetoed ? (
                                    <ShieldAlert size={24} color="#ef4444" />
                                ) : (
                                    <ShieldCheck size={24} color="#22c55e" />
                                )}
                                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: isVetoed ? '#fca5a5' : '#86efac' }}>
                                    {isVetoed ? 'Bar-Raiser Veto Triggered' : 'Bar-Raiser Cleared — Hiring Consensus'}
                                </h2>
                            </div>
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                background: isVetoed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                color: isVetoed ? '#ef4444' : '#22c55e',
                                border: `1px solid ${isVetoed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`
                            }}>
                                {isVetoed ? 'Veto Enforced' : 'Passed Bar'}
                            </span>
                        </div>

                        {isVetoed ? (
                            <div>
                                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                                    The candidate failed to satisfy the non-negotiable minimum competency threshold in core evaluation areas:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                    {effectiveDecision?.vetoReasons?.map((reason, idx) => (
                                        <div key={idx} style={{ fontSize: 12, color: '#fca5a5', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                            <span style={{ color: '#ef4444', fontWeight: 800 }}>•</span>
                                            <span>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    borderLeft: '3px solid #ef4444'
                                }}>
                                    💡 <strong>Committee Calibration Principle:</strong> Standard tech hiring committee policies dictate that exceptional scores in other rounds cannot override a failure in a core technical or behavioral competency.
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.5 }}>
                                Candidate met or exceeded the minimum bar-raiser competency thresholds across all scheduled interview rounds.
                            </p>
                        )}
                    </div>

                    {/* Committee Deliberation & Scoring Grid */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 24
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 12,
                                padding: '16px 14px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                    Calibrated Score
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: verdictObj.color }}>
                                    {finalScore}%
                                </div>
                                <div style={{ fontSize: 11, color: verdictObj.color, marginTop: 4, fontWeight: 600 }}>
                                    {verdictObj.text}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 12,
                                padding: '16px 14px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                    Arithmetic Average
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#94a3b8' }}>
                                    {avgScore}%
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                    Raw Mean Score
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 12,
                                padding: '16px 14px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                    Bar-Raiser Gate
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: isVetoed ? '#ef4444' : '#22c55e' }}>
                                    {isVetoed ? 'VETOED' : 'CLEARED'}
                                </div>
                                <div style={{ fontSize: 11, color: isVetoed ? '#ef4444' : '#22c55e', marginTop: 4, fontWeight: 600 }}>
                                    {isVetoed ? 'Competency Failed' : 'All Bars Passed'}
                                </div>
                            </div>
                        </div>

                        {/* Executive Committee Recommendation */}
                        {effectiveDecision?.recommendation && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 12,
                                padding: 16
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                    Hiring Committee Evaluation
                                </div>
                                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', margin: 0, lineHeight: 1.6 }}>
                                    {effectiveDecision.recommendation}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Per-Round Competency Evaluation Breakdown */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 24
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#818cf8' }}>
                            Competency Breakdown & Bar Checks
                        </h3>
                        {roundResults.map((result, i) => {
                            const round = activeRounds[i] || ROUND_TYPES.find(r => r.id === result.roundId) || { name: result.stage || `Round ${i + 1}`, color: '#8b5cf6' };
                            const evalMatch = effectiveDecision?.roundEvaluations?.[i];
                            const threshold = evalMatch?.threshold || (BAR_RAISER_THRESHOLDS[result.roundId] ?? 60);
                            const passed = evalMatch ? evalMatch.passed : (result.score >= threshold);
                            const vetoed = evalMatch ? evalMatch.veto : (!passed);

                            return (
                                <div key={i} style={{
                                    padding: '14px 0',
                                    borderBottom: i < roundResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                        <div style={{
                                            width: 36, height: 36,
                                            borderRadius: 8,
                                            background: round?.color + '15',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: round?.color,
                                            flexShrink: 0
                                        }}>
                                            {round?.icon || <CheckCircle size={18} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14 }}>{round?.name || result.stage}</span>
                                                <span style={{
                                                    fontSize: 10,
                                                    padding: '2px 8px',
                                                    borderRadius: 12,
                                                    fontWeight: 700,
                                                    background: vetoed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                    color: vetoed ? '#ef4444' : '#22c55e',
                                                    border: `1px solid ${vetoed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                                                }}>
                                                    {vetoed ? 'BAR-RAISER VETO ✗' : 'PASSED BAR ✓'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                Required Bar: ≥{threshold}% · Candidate Score: {result.score}%
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 20, fontWeight: 800,
                                            color: vetoed ? '#ef4444' : result.score >= 80 ? '#22c55e' : '#f59e0b'
                                        }}>
                                            {result.score}%
                                        </div>
                                    </div>
                                    {Array.isArray(result.strengths) && result.strengths.length > 0 && (
                                        <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', marginTop: 4, marginLeft: 48 }}>
                                            <strong>Observed:</strong> {result.strengths.slice(0, 2).join(' · ')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('multiRoundContext');
                                sessionStorage.removeItem('multiRoundResult');
                                sessionStorage.removeItem('multiRoundSessionId');
                                sessionStorage.removeItem('multiRoundHiringDecision');
                                setSessionId(null);
                                setHiringDecision(null);
                                setPhase('setup');
                                setCurrentRoundIdx(0);
                                setRoundResults([]);
                            }}
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
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
