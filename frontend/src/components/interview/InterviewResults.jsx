import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInterviewTelemetrySummary } from '../../pages/aiInterviewTiming';
import { Clock, ChevronRight, Sparkles, CheckCircle, Star, Award, TrendingUp, BarChart3, Target, Brain, Shield, ThumbsUp, AlertTriangle, Download, Share2, RefreshCw, ArrowLeft, FileText, User, Building2, Lightbulb, ChevronDown, ChevronUp, Eye, Timer, Trophy, Gauge, MessageSquare, Code2, Zap, Pause, Activity } from 'lucide-react';

const ensureArray = (val) => Array.isArray(val) ? val : (typeof val === 'string' && val.trim().length > 0 ? [val] : []);

/**
 * InterviewResults — Summary/Results dashboard.
 *
 * Props:
 *  - analysisResult:      The analysis object (scores, categories, moments, etc.)
 *  - analysisLoading:     Boolean indicating AI analysis is in progress
 *  - interviewer:         { name, company } object
 *  - interviewType:       'hr' | 'technical' | etc.
 *  - conversation:        Array of { role, content } messages
 *  - submissionStatus:    Custom interview submission state
 *  - onStartNew:          Callback to reset and start a new interview
 */
function InterviewResults({
    analysisResult,
    analysisLoading,
    interviewer,
    interviewType,
    conversation,
    submissionStatus,
    realismScore,
    onRetrySubmission,
    onRetryAnalysis,
    onStartNew,
}) {
    const navigate = useNavigate();
    const [resultTab, setResultTab] = useState('overview');
    const [expandedMoment, setExpandedMoment] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [surveySoundHuman, setSurveySoundHuman] = useState(null);
    const [surveyListened, setSurveyListened] = useState(null);
    const [surveyCutOff, setSurveyCutOff] = useState(null);
    const [surveyPacing, setSurveyPacing] = useState(null);
    const [surveyFairness, setSurveyFairness] = useState(null);
    const [surveyNotes, setSurveyNotes] = useState('');
    const [surveyCopied, setSurveyCopied] = useState(false);
    const [turnFlags, setTurnFlags] = useState({});

    const handleToggleTurnFlag = (turnIdx, flag) => {
        setTurnFlags(prev => {
            const next = { ...prev };
            if (next[turnIdx] === flag) {
                delete next[turnIdx];
            } else {
                next[turnIdx] = flag;
            }
            return next;
        });
    };

    const a = analysisResult; // shorthand
    // Enrichment fields from backend intelligence
    const benchmarkTier = a?.benchmark_tier || a?.benchmarkTier;
    const timingAnalysis = a?.timing_analysis || a?.timingAnalysis;
    const perQBreakdown = a?.per_question_breakdown || a?.perQuestionBreakdown;
    const categories = ensureArray(a?.categories)
        .filter(category => category && Number.isFinite(Number(category.score)))
        .map(category => ({ ...category, score: Number(category.score) }));
    const weakestCategory = categories.length > 0
        ? categories.reduce((weakest, category) => category.score < weakest.score ? category : weakest)
        : null;
    const firstImprovement = ensureArray(a?.improvements)[0];

    const startFocusedPractice = (focus) => {
        const params = new URLSearchParams();
        if (focus) params.set('focus', focus);
        const query = params.toString();
        navigate(`/ai-interview${query ? `?${query}` : ''}`);
    };

    const showActionMessage = (message) => {
        setActionMessage(message);
        window.setTimeout(() => setActionMessage(''), 3500);
    };

    const handleShare = async () => {
        const shareText = a?.analysisUnavailable
            ? `I completed a ${interviewType} interview practice session on PrepLoop. The transcript is ready to review.`
            : `I scored ${a?.overallScore ?? '—'}/10 in my ${interviewType} interview practice session.`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'My PrepLoop interview result', text: shareText });
                return;
            }
            await navigator.clipboard.writeText(shareText);
            showActionMessage('Result summary copied to your clipboard.');
        } catch (error) {
            if (error?.name !== 'AbortError') {
                showActionMessage('Sharing is unavailable in this browser.');
            }
        }
    };

    const handleCopyPilotPacket = async () => {
        const telemetry = getInterviewTelemetrySummary();

        // Calculate quote verified & fallback rate
        const interviewerTurns = ensureArray(conversation).filter(m => m.role === 'interviewer');
        const totalInterviewerTurns = interviewerTurns.length;
        const quoteVerifiedTurns = interviewerTurns.filter(m => m.quoteVerified === true).length;
        const fallbackTurns = interviewerTurns.filter(m => m.quoteVerified === false).length;
        const quoteVerifiedRatePct = totalInterviewerTurns > 0 ? ((quoteVerifiedTurns / totalInterviewerTurns) * 100).toFixed(1) : '0.0';
        const fallbackRatePct = totalInterviewerTurns > 0 ? ((fallbackTurns / totalInterviewerTurns) * 100).toFixed(1) : '0.0';
        const isFallbackRateHigh = Number(fallbackRatePct) > 20.0;

        // Recursive PII sanitizer: removes transcripts, texts, emails, usernames, keys, tokens
        const sanitizeTelemetry = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sanitizeTelemetry);
            const clean = {};
            for (const [k, v] of Object.entries(obj)) {
                if (/transcript|content|text|userAnswer|email|key|token|user_id|userId|password|secret|code|rawText/i.test(k)) {
                    continue; // strip PII / raw text
                }
                clean[k] = sanitizeTelemetry(v);
            }
            return clean;
        };

        const pilotPacket = {
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            browser: /chrome/i.test(navigator?.userAgent || '') ? 'Chrome' : /safari/i.test(navigator?.userAgent || '') && !/chrome/i.test(navigator?.userAgent || '') ? 'Safari' : 'Other',
            survey: {
                didInterviewerSoundHuman: surveySoundHuman || 'Not answered',
                didFollowUpsShowItListened: surveyListened || 'Not answered',
                didItCutYouOff: surveyCutOff || 'Not answered',
                didItFeelSlow: surveyPacing || 'Not answered',
                wasScoreFair: surveyFairness || 'Not answered',
                targetAchieved: surveySoundHuman === 'natural' && surveyListened === 'yes',
                candidateNotes: surveyNotes || 'None',
            },
            telemetrySummary: {
                totalTurns: telemetry.totalTurns || (conversation || []).filter(m => m.role === 'candidate').length,
                resumeRatePct: telemetry.resumeRate,
                resumedTurns: telemetry.resumedTurns,
                quoteVerifiedCount: quoteVerifiedTurns,
                quoteVerifiedRatePct: `${quoteVerifiedRatePct}%`,
                genericFallbackCount: fallbackTurns,
                fallbackRatePct: `${fallbackRatePct}%`,
                fallbackRateAlert: isFallbackRateHigh ? 'WARNING: Fallback rate >20%. Prompt evidence quote extraction needs tuning.' : 'OK (<=20%)',
                lastSpeechToAudioLatency: {
                    samples: telemetry.samples,
                    p50Ms: telemetry.p50,
                    p95Ms: telemetry.p95,
                    minMs: telemetry.min,
                    maxMs: telemetry.max,
                },
            },
            interviewMeta: {
                interviewType,
                company: interviewer?.company,
                overallScore: a?.overallScore,
                categories: categories.map(c => ({ name: c.name, score: c.score })),
            },
            sanitizedTelemetryEvents: sanitizeTelemetry(telemetry.allEvents || []),
            turnTimelines: sanitizeTelemetry(telemetry.turnTimelines || []),
            turnFeedbackFlags: {
                totalTurnFlagsGiven: Object.keys(turnFlags).length,
                soundedRoboticCount: Object.values(turnFlags).filter(f => f === 'sounded_robotic').length,
                didNotListenCount: Object.values(turnFlags).filter(f => f === 'didnt_listen').length,
                flagsByTurn: turnFlags,
            },
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(pilotPacket, null, 2));
            showActionMessage(isFallbackRateHigh ? '⚠️ Copied! Note: Fallback rate >20% flagged in packet.' : '✓ Pilot telemetry & survey copied to clipboard! Share with team.');
            setSurveyCopied(true);
        } catch {
            showActionMessage('Telemetry logged to developer console.');
            console.log('[Pilot Telemetry Packet]', pilotPacket);
        }
    };

    const handleExport = () => {
        const exportData = {
            score: a?.overallScore ?? null,
            performance: a?.performanceLabel || null,
            interviewType,
            duration: a?.stats?.duration || null,
            categories: categories.map(({ name, score, detail }) => ({ name, score, detail })),
            strengths: ensureArray(a?.strengths),
            improvements: ensureArray(a?.improvements),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `preploop-interview-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showActionMessage('Interview report downloaded.');
    };

    const submissionMessage = {
        saved: 'Your interview result was saved.',
        'login-required': 'Please log in to save this interview result.',
        'already-submitted': 'This interview result was already submitted.',
        failed: 'We could not save your interview result. Please contact the administrator if needed.',
    }[submissionStatus];

    // Show loading state during AI analysis
    if (analysisLoading && !a) {
        return (
            <div className="ai-interview-page ai-results-loading">
                <div className="ai-results-loading-spinner" />
                <div className="ai-results-loading-title">Analyzing your interview with AI...</div>
                <div className="ai-results-loading-subtitle">This may take a few seconds</div>
            </div>
        );
    }

    return (
        <div className="ai-interview-page">
            <header className="ai-topbar">
                <div className="ai-topbar-left">
                    <div className="ai-breadcrumb">
                        <span className="ai-breadcrumb-link" onClick={() => navigate('/interview-suite')}>← Interview Suite</span>
                        <ChevronRight size={12} className="ai-breadcrumb-sep" />
                        <span className="ai-breadcrumb-current">Session Results</span>
                    </div>
                </div>
                <div className="ai-topbar-center">
                    <div className="ai-mode-badge" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        <CheckCircle size={12} />
                        Complete
                    </div>
                </div>
                <div className="ai-topbar-right">
                    <button className="ai-result-action-btn" onClick={() => navigate('/interview-history')}>
                        <Clock size={14} /> History
                    </button>
                    {onRetryAnalysis && (
                        <button className="ai-result-action-btn" onClick={onRetryAnalysis} title="Re-evaluate interview">
                            <RefreshCw size={14} /> Re-evaluate
                        </button>
                    )}
                    <button className="ai-result-action-btn" onClick={handleShare}>
                        <Share2 size={14} /> Share
                    </button>
                    <button className="ai-result-action-btn ai-result-action-btn--primary" onClick={handleExport}>
                        <Download size={14} /> Export
                    </button>
                </div>
            </header>

            <div className="ai-result-page">
                {actionMessage && (
                    <div className="ai-results-action-message" role="status">{actionMessage}</div>
                )}
                {submissionMessage && (
                    <div role="status" style={{ margin: '16px 24px', padding: '12px 16px', borderRadius: '10px', background: submissionStatus === 'saved' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: submissionStatus === 'saved' ? '#86efac' : '#fcd34d' }}>
                        {submissionMessage}
                        {submissionStatus === 'failed' && onRetrySubmission && (
                            <button type="button" onClick={onRetrySubmission} style={{ marginLeft: '12px' }}>
                                Retry save
                            </button>
                        )}
                    </div>
                )}
                {/* ── Hero Section ── */}
                <div className="ai-result-hero">
                    <div className="ai-result-hero-left">
                        <div className="ai-result-label">Interview Feedback</div>
                        <h1 className="ai-result-title">
                              {interviewType === 'hr' ? 'HR Round' :
                               interviewType === 'technical' ? 'Technical Round' :
                               'General'} Interview
                        </h1>
                        <div className="ai-result-meta">
                            <span><Building2 size={13} /> {interviewer.company}</span>
                            <span><User size={13} /> {interviewer.name}</span>
                            <span><Clock size={13} /> {a?.stats?.duration || '00:00'}</span>
                        </div>
                    </div>
                    <div className="ai-result-hero-right">
                        <div className="ai-result-score-ring">
                            <svg viewBox="0 0 120 120" className="ai-result-score-svg">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                <circle cx="60" cy="60" r="52"
                                    fill="none"
                                    stroke={a?.performanceColor || '#8b5cf6'}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(a?.overallScore || 0) / 10 * 327} 327`}
                                    transform="rotate(-90 60 60)"
                                    className="ai-result-score-circle"
                                />
                            </svg>
                            <div className="ai-result-score-value">
                                <span className="ai-result-score-num" style={{ color: a?.performanceColor }}>
                                    {a?.isDeferred || a?.reportStatus === 'pending'
                                        ? '...'
                                        : (a?.isEstimated || a?.overallScore == null)
                                        ? '—'
                                        : (a?.overallScore || '—')}
                                </span>
                                <span className="ai-result-score-of">
                                    {a?.isDeferred || a?.reportStatus === 'pending'
                                        ? 'Pending'
                                        : a?.isEstimated
                                        ? 'Estimated'
                                        : a?.analysisUnavailable || a?.overallScore == null
                                        ? 'Not scored'
                                        : '/10'}
                                </span>
                            </div>
                        </div>
                        <div className="ai-result-verdict" style={{ background: `${a?.performanceColor}18`, color: a?.performanceColor, borderColor: `${a?.performanceColor}40` }}>
                            {a?.isDeferred || a?.reportStatus === 'pending' ? <Timer size={14} /> : a?.overallScore >= 7 ? <Trophy size={14} /> : a?.overallScore >= 5 ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                            {a?.isDeferred || a?.reportStatus === 'pending' ? 'Report Pending' : a?.isEstimated ? 'Estimated Assessment' : benchmarkTier ? `${benchmarkTier.emoji || ''} ${benchmarkTier.label}` : (a?.performanceLabel || 'Analyzing...')}
                        </div>
                        {benchmarkTier?.description && (
                            <div className="ai-results-ai-badge" style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {benchmarkTier.description}
                            </div>
                        )}
                        {a?.aiGenerated && (
                            <div className="ai-results-ai-badge">
                                <Sparkles size={11} /> AI-Analyzed by {a?.reportProvider === 'gemini' ? 'Google AI Studio (Gemini)' : a?.reportProvider === 'openrouter' ? 'OpenRouter' : 'Groq'}
                            </div>
                        )}
                        {a?.hasMixedScorers && (
                            <div className="ai-results-ai-badge" style={{ marginTop: 4, fontSize: 11, color: '#fde047', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 8px', borderRadius: 4 }}>
                                ⚡ Failover active: Turns scored across providers &amp; calibrated
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Deferred Evaluation Pending Banner ── */}
                {(a?.isDeferred || a?.reportStatus === 'pending') && (
                    <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 10, padding: '14px 18px', margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12, color: '#fef08a' }}>
                        <Timer size={20} className="animate-pulse" />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Evaluation Report Pending Background Processing</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Your spoken transcript is queued. You can safely navigate away; your full report will be available in your dashboard shortly.</div>
                        </div>
                    </div>
                )}

                {/* ── Estimated Score Notice ── */}
                {a?.isEstimated && (
                    <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 8, padding: '8px 14px', margin: '10px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#e9d5ff', fontSize: 12 }}>
                        <Activity size={14} />
                        <span>This is an estimated heuristic score while background rubric evaluation completes.</span>
                    </div>
                )}

                {/* ── AI Summary ── */}
                {a?.summary && (
                    <div className="ai-results-summary-card">
                        <div className="ai-results-summary-header">
                            <Brain size={14} className="ai-results-summary-icon" /> {a.analysisUnavailable ? 'Session review' : 'AI Summary'}
                        </div>
                        {a.summary}
                    </div>
                )}

                {a?.analysisUnavailable && (
                    <div className="ai-results-focus-card" role="status">
                        <div className="ai-results-focus-icon"><Target size={18} /></div>
                        <div className="ai-results-focus-content">
                            <div className="ai-results-focus-label">Keep your practice moving</div>
                            <h2>Review your answers, then try another {interviewType} round</h2>
                            <p>Your transcript is available below. This session has no AI score or competency feedback.</p>
                        </div>
                        <button type="button" className="ai-result-focus-btn" onClick={() => startFocusedPractice(interviewType)}>
                            Practice again <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {weakestCategory && (
                    <div className="ai-results-focus-card">
                        <div className="ai-results-focus-icon"><Target size={18} /></div>
                        <div className="ai-results-focus-content">
                            <div className="ai-results-focus-label">Your next practice focus</div>
                            <h2>{weakestCategory.name} <span>{weakestCategory.score}/10</span></h2>
                            <p>
                                {firstImprovement || `Build confidence in ${weakestCategory.name.toLowerCase()} with one focused practice round.`}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="ai-result-focus-btn"
                            onClick={() => navigate(`/ai-interview?focus=${encodeURIComponent(weakestCategory.name)}`)}
                        >
                            Practice this next <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* ── Pilot Survey & Experience Telemetry (3 Quick Questions) ── */}
                <div style={{
                    margin: '20px 24px',
                    padding: '20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={18} style={{ color: '#a78bfa' }} />
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Candidate Experience Pilot Survey</h3>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.2)', color: '#c4b5fd', fontWeight: 500 }}>Live Pilot Metric</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: surveySoundHuman === 'natural' && surveyListened === 'yes' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.18)', color: surveySoundHuman === 'natural' && surveyListened === 'yes' ? '#86efac' : '#a5b4fc', fontWeight: 500, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                {surveySoundHuman === 'natural' && surveyListened === 'yes' ? '✓ Target Met' : 'Target: ≥70% Natural & Yes'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyPilotPacket}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: surveyCopied ? '#059669' : '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            <Sparkles size={13} />
                            {surveyCopied ? '✓ Telemetry Copied!' : 'Copy Pilot Telemetry & Survey (JSON)'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                        {/* Q1: Human Voice Quality (Target: Natural) */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: surveySoundHuman === 'natural' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>1. Did the interviewer sound human?</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { id: 'natural', label: 'Natural & Conversational (Target)' },
                                    { id: 'okay', label: 'Okay / Acceptable' },
                                    { id: 'robotic', label: 'Robotic / Stiff' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSurveySoundHuman(opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            border: surveySoundHuman === opt.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: surveySoundHuman === opt.id ? (opt.id === 'natural' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(99, 102, 241, 0.3)') : 'rgba(255, 255, 255, 0.03)',
                                            color: surveySoundHuman === opt.id ? '#ffffff' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Q2: Follow-up Relevance (Target: Yes) */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: surveyListened === 'yes' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>2. Did follow-ups show it listened?</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { id: 'yes', label: 'Yes, referenced what I said (Target)' },
                                    { id: 'somewhat', label: 'Somewhat / Partial' },
                                    { id: 'no', label: 'No, felt generic or scripted' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSurveyListened(opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            border: surveyListened === opt.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: surveyListened === opt.id ? (opt.id === 'yes' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(99, 102, 241, 0.3)') : 'rgba(255, 255, 255, 0.03)',
                                            color: surveyListened === opt.id ? '#ffffff' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Q3: Cut-off */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>3. Did the interviewer cut you off?</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { id: 'never', label: 'Never / Natural pauses' },
                                    { id: 'once_twice', label: 'Once or twice' },
                                    { id: 'frequently', label: 'Frequently / Too aggressive' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSurveyCutOff(opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            border: surveyCutOff === opt.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: surveyCutOff === opt.id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                                            color: surveyCutOff === opt.id ? '#ffffff' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Q4: Latency */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>4. Did the interviewer feel slow?</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { id: 'snappy', label: 'Snappy & responsive' },
                                    { id: 'acceptable', label: 'Acceptable conversational pause' },
                                    { id: 'sluggish', label: 'Too sluggish / Delayed' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSurveyPacing(opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            border: surveyPacing === opt.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: surveyPacing === opt.id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                                            color: surveyPacing === opt.id ? '#ffffff' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Q5: Fairness */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>5. Was the score and feedback fair?</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[
                                    { id: 'fair', label: 'Accurate & Fair' },
                                    { id: 'too_harsh', label: 'Too harsh / Underscored' },
                                    { id: 'too_generous', label: 'Too generous / Inflated' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSurveyFairness(opt.id)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            textAlign: 'left',
                                            border: surveyFairness === opt.id ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                                            background: surveyFairness === opt.id ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                                            color: surveyFairness === opt.id ? '#ffffff' : '#94a3b8',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={surveyNotes}
                            onChange={(e) => setSurveyNotes(e.target.value)}
                            placeholder="Optional: Any notes on audio, questions, or echo issues?"
                            style={{
                                flex: 1,
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                color: '#f3f4f6',
                            }}
                        />
                    </div>
                </div>

                {/* ── Quick Stats ── */}
                <div className="ai-result-stats-row">
                    <div className="ai-result-stat">
                        <div className="ai-result-stat-icon"><Award size={18} /></div>
                        <div className="ai-result-stat-info">
                            <div className="ai-result-stat-label">Performance</div>
                            <div className="ai-result-stat-value">{a?.performanceLabel || '—'}</div>
                        </div>
                    </div>
                    <div className="ai-result-stat">
                        <div className="ai-result-stat-icon" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}><BarChart3 size={18} /></div>
                        <div className="ai-result-stat-info">
                            <div className="ai-result-stat-label">Category</div>
                            <div className="ai-result-stat-value">{interviewType}</div>
                        </div>
                    </div>
                    <div className="ai-result-stat">
                        <div className="ai-result-stat-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Star size={18} /></div>
                        <div className="ai-result-stat-info">
                            <div className="ai-result-stat-label">Key Moments</div>
                            <div className="ai-result-stat-value">{ensureArray(a?.keyMoments).length}</div>
                        </div>
                    </div>
                    <div className="ai-result-stat">
                        <div className="ai-result-stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}><Gauge size={18} /></div>
                        <div className="ai-result-stat-info">
                            <div className="ai-result-stat-label">Categories</div>
                            <div className="ai-result-stat-value">{ensureArray(a?.categories).length}</div>
                        </div>
                    </div>
                    {timingAnalysis && (
                        <div className="ai-result-stat">
                            <div className="ai-result-stat-icon" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}><Timer size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Avg Response</div>
                                <div className="ai-result-stat-value">{timingAnalysis.avg_response_seconds || timingAnalysis.avgResponseSeconds || '—'}s</div>
                            </div>
                        </div>
                    )}
                    {typeof realismScore === 'number' && (
                        <div className="ai-result-stat" title="How natural and authentic your conversational flow, response lengths, and pacing were">
                            <div className="ai-result-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}><Activity size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Realism</div>
                                <div className="ai-result-stat-value">{realismScore}%</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="ai-result-tabs">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'analysis', label: 'Detailed Analysis', icon: BarChart3 },
                        { id: 'breakdown', label: 'Question Breakdown', icon: Target },
                        { id: 'moments', label: 'Key Moments', icon: Star },
                        { id: 'session', label: 'Session Details', icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`ai-result-tab ${resultTab === tab.id ? 'ai-result-tab--active' : ''}`}
                            onClick={() => setResultTab(tab.id)}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab Content ── */}
                <div className="ai-result-content">
                    {/* OVERVIEW TAB */}
                    {resultTab === 'overview' && a && (
                        <div className="ai-result-overview">
                            {/* Category Scores */}
                            <div className="ai-result-card">
                                <h3 className="ai-result-card-title"><Target size={16} /> Competency Breakdown</h3>
                            <div className="ai-result-categories">
                                    {categories.length === 0 ? (
                                        <p className="ai-result-empty-state">No competency scores are available for this session.</p>
                                    ) : categories.map((cat, i) => (
                                        <div key={i} className="ai-result-cat">
                                            <div className="ai-result-cat-header">
                                                <div className="ai-result-cat-label">
                                                    {cat.icon && typeof cat.icon !== 'string' ? <cat.icon size={14} style={{ color: cat.color }} /> : <Target size={14} style={{ color: cat.color }} />}
                                                    {cat.name}
                                                </div>
                                                <span className="ai-result-cat-score" style={{ color: cat.color }}>{cat.score}/10</span>
                                            </div>
                                            <div className="ai-result-cat-bar">
                                                <div className="ai-result-cat-fill" style={{ width: `${cat.score * 10}%`, background: cat.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Improvements */}
                            <div className="ai-result-two-col">
                                <div className="ai-result-card ai-result-card--green">
                                    <h3 className="ai-result-card-title"><ThumbsUp size={16} style={{ color: '#22c55e' }} /> Strengths</h3>
                                    <ul className="ai-result-list">
                                        {ensureArray(a.strengths).length === 0 ? <li>No AI-generated strengths are available.</li> : ensureArray(a.strengths).map((s, i) => (
                                            <li key={i}><CheckCircle size={14} className="ai-result-list-icon ai-result-list-icon--green" /> {s}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="ai-result-card ai-result-card--amber">
                                    <h3 className="ai-result-card-title"><Lightbulb size={16} style={{ color: '#f59e0b' }} /> Areas to Improve</h3>
                                    <ul className="ai-result-list">
                                        {ensureArray(a.improvements).length === 0 ? <li>No AI-generated improvement suggestions are available.</li> : ensureArray(a.improvements).map((s, i) => (
                                            <li key={i}><AlertTriangle size={14} className="ai-result-list-icon ai-result-list-icon--amber" /> {s}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DETAILED ANALYSIS TAB */}
                    {resultTab === 'analysis' && a && (
                        <div className="ai-result-analysis">
                            <div className="ai-result-card">
                                <h3 className="ai-result-card-title"><Brain size={16} /> {a.analysisUnavailable ? 'Session analysis status' : 'AI Analysis Summary'}</h3>
                                <p className="ai-result-analysis-text">
                                    {a.analysisUnavailable
                                        ? `AI feedback is unavailable. You completed ${a.stats?.questionsAnswered || 0} answers across ${a.stats?.duration || '—'} of interview time; no competency score was assigned.`
                                        : <>Based on your {a.stats.questionsAnswered} questions answered across {a.stats.duration} of interview time, here is a detailed breakdown of your performance across each competency area. Your strongest area was <strong>{categories.length > 0 ? categories.reduce((acc, curr) => acc.score > curr.score ? acc : curr).name : 'General'}</strong> with a score of {categories.length > 0 ? categories.reduce((acc, curr) => acc.score > curr.score ? acc : curr).score : (a.overallScore || 0)}/10.</>}
                                </p>
                            </div>
                            {categories.map((cat, i) => (
                                <div key={i} className="ai-result-card">
                                    <div className="ai-result-analysis-cat-header">
                                        <div className="ai-result-cat-label">
                                            {cat.icon && typeof cat.icon !== 'string' ? <cat.icon size={18} style={{ color: cat.color }} /> : <Target size={18} style={{ color: cat.color }} />}
                                            <strong>{cat.name}</strong>
                                        </div>
                                        <div className="ai-result-analysis-score" style={{ color: cat.color }}>
                                            {cat.score}/10
                                        </div>
                                    </div>
                                    <div className="ai-result-cat-bar" style={{ marginTop: 12 }}>
                                        <div className="ai-result-cat-fill" style={{ width: `${cat.score * 10}%`, background: cat.color }} />
                                    </div>
                                    <p className="ai-result-analysis-detail">
                                        {cat.detail || (cat.score >= 7
                                            ? `Excellent performance in ${cat.name.toLowerCase()}. You demonstrated strong competency and clear understanding.`
                                            : cat.score >= 5
                                            ? `Solid foundation in ${cat.name.toLowerCase()}. Consider deepening your knowledge in edge cases and advanced patterns.`
                                            : `Focus on improving your ${cat.name.toLowerCase()} skills. Practice structured approaches and review fundamentals.`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* QUESTION BREAKDOWN TAB */}
                    {resultTab === 'breakdown' && a && (
                        <div className="ai-result-analysis">
                            {timingAnalysis?.recommendation && (
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><Timer size={16} /> Pacing Feedback</h3>
                                    <p className="ai-result-analysis-text">
                                        You averaged <strong>{timingAnalysis.avg_response_seconds || timingAnalysis.avgResponseSeconds || '—'}s</strong> per response
                                        across <strong>{timingAnalysis.total_turns || timingAnalysis.totalTurns || '—'}</strong> turns.
                                        {' '}{timingAnalysis.recommendation}
                                    </p>
                                </div>
                            )}
                            {ensureArray(perQBreakdown).length > 0 ? (
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><Target size={16} /> Per-Question Scores</h3>
                                    <div className="ai-result-q-breakdown">
                                        {ensureArray(perQBreakdown).map((q, i) => (
                                            <div key={i} className="ai-result-q-row">
                                                <div className="ai-result-q-num">Q{q.questionNumber || i + 1}</div>
                                                <div className="ai-result-q-content">
                                                    <div className="ai-result-q-question">{q.question}</div>
                                                    {q.answerSummary && <div className="ai-result-q-answer">{q.answerSummary}</div>}
                                                    <div className="ai-result-q-tags">
                                                        {q.strength && <span className="ai-result-q-tag ai-result-q-tag--strength">✓ {q.strength}</span>}
                                                        {q.gap && <span className="ai-result-q-tag ai-result-q-tag--gap">△ {q.gap}</span>}
                                                        {q.isFallbackModel && <span className="ai-result-q-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', borderColor: 'rgba(99, 102, 241, 0.3)' }}>Scored by fallback model</span>}
                                                        {q.isRescoredWithFinalModel && <span className="ai-result-q-tag" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.3)' }}>Re-scored by final scorer</span>}
                                                    </div>
                                                </div>
                                                <div className="ai-result-analysis-score" style={{
                                                    color: (q.isSkipped || q.status === 'unanswered' || q.status === 'estimated' || q.isEstimated || (q.scoreEstimate == null && q.score == null))
                                                        ? '#a1a1aa'
                                                        : (q.scoreEstimate || q.score || 0) >= 7 ? '#22c55e' : (q.scoreEstimate || q.score || 0) >= 5 ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {(q.isSkipped || q.status === 'unanswered')
                                                        ? 'Skipped'
                                                        : (q.status === 'estimated' || q.isEstimated)
                                                        ? 'Estimated'
                                                        : (q.status === 'not_scored' || (q.scoreEstimate == null && q.score == null))
                                                        ? 'Not scored'
                                                        : `${q.scoreEstimate || q.score || '—'}/10`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="ai-result-card ai-result-empty-state">
                                    <Target size={32} className="ai-result-empty-icon" />
                                    <p className="ai-result-empty-text">No per-question data available for this session</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KEY MOMENTS TAB */}
                    {resultTab === 'moments' && a && (
                        <div className="ai-result-moments">
                            {ensureArray(a.keyMoments).length === 0 ? (
                                <div className="ai-result-card ai-result-empty-state">
                                    <Star size={32} className="ai-result-empty-icon" />
                                    <p className="ai-result-empty-text">No key moments recorded for this session</p>
                                </div>
                            ) : (
                                ensureArray(a.keyMoments).map((moment, i) => (
                                    <div
                                        key={i}
                                        className={`ai-result-moment ${expandedMoment === i ? 'ai-result-moment--expanded' : ''}`}
                                        onClick={() => setExpandedMoment(expandedMoment === i ? null : i)}
                                    >
                                        <div className="ai-result-moment-header">
                                            <div className="ai-result-moment-left">
                                                <div className={`ai-result-moment-icon ai-result-moment-icon--${moment.type}`}>
                                                    {moment.type === 'question' ? <MessageSquare size={14} /> : <ThumbsUp size={14} />}
                                                </div>
                                                <div className="ai-result-moment-info">
                                                    <div className="ai-result-moment-type">{moment.type === 'question' ? 'Question Asked' : 'Strong Response'}</div>
                                                    <div className="ai-result-moment-time"><Timer size={11} /> {moment.time}</div>
                                                </div>
                                            </div>
                                            {expandedMoment === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                        {expandedMoment === i && (
                                            <div className="ai-result-moment-body">{moment.text}</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SESSION DETAILS TAB */}
                    {resultTab === 'session' && a && (
                        <div className="ai-result-session">
                            <div className="ai-result-card">
                                <h3 className="ai-result-card-title"><FileText size={16} /> Session Info</h3>
                                <div className="ai-result-session-grid">
                                    <div className="ai-result-session-item">
                                        <Clock size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Duration</div>
                                            <div className="ai-result-session-value">{a.stats.duration}</div>
                                        </div>
                                    </div>
                                    <div className="ai-result-session-item">
                                        <MessageSquare size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Questions</div>
                                            <div className="ai-result-session-value">{a.stats.questionsAnswered}</div>
                                        </div>
                                    </div>
                                    <div className="ai-result-session-item">
                                        <Code2 size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Lines of Code</div>
                                            <div className="ai-result-session-value">{a.stats.linesOfCode}</div>
                                        </div>
                                    </div>
                                    <div className="ai-result-session-item">
                                        <Zap size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Language</div>
                                            <div className="ai-result-session-value">{a.stats.language}</div>
                                        </div>
                                    </div>
                                    <div className="ai-result-session-item">
                                        <User size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Interviewer</div>
                                            <div className="ai-result-session-value">{interviewer.name}</div>
                                        </div>
                                    </div>
                                    <div className="ai-result-session-item">
                                        <Building2 size={16} />
                                        <div>
                                            <div className="ai-result-session-label">Company</div>
                                            <div className="ai-result-session-value">{interviewer.company}</div>
                                        </div>
                                    </div>
                                    {a.stats.pauseTime && (
                                        <div className="ai-result-session-item">
                                            <Pause size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Time Paused</div>
                                                <div className="ai-result-session-value">{a.stats.pauseTime}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conversation Transcript */}
                            <div className="ai-result-card">
                                <h3 className="ai-result-card-title"><Eye size={16} /> Conversation Transcript</h3>
                                <div className="ai-result-transcript">
                                    {ensureArray(conversation).length === 0 ? (
                                        <p className="ai-result-empty-text" style={{ textAlign: 'center', padding: 24 }}>No conversation data available</p>
                                    ) : (
                                        ensureArray(conversation).map((msg, i) => {
                                            const isInterviewerMsg = msg.role === 'interviewer';
                                            const isFeedbackMsg = msg.role === 'feedback';
                                            const RoleIcon = isInterviewerMsg ? Sparkles : isFeedbackMsg ? Star : User;
                                            const roleLabel = isInterviewerMsg
                                                ? interviewer.name
                                                : isFeedbackMsg
                                                    ? `Feedback${(msg.isEstimated || msg.status === 'estimated') ? ' · estimated' : msg.score != null ? ` · ${msg.score}%` : ' · not scored'}`
                                                    : 'You';

                                            // Candidate's previous response that prompted this interviewer message
                                            const candidateTurn = isInterviewerMsg
                                                ? ensureArray(conversation)
                                                    .slice(0, i)
                                                    .reverse()
                                                    .find(m => m.role === 'candidate' || m.role === 'user')
                                                : null;
                                            const candidateSnippet = candidateTurn ? (candidateTurn.content || candidateTurn.text || '') : '';
                                            const interviewerTurnNumber = isInterviewerMsg
                                                ? ensureArray(conversation)
                                                    .slice(0, i + 1)
                                                    .filter(m => m.role === 'interviewer').length
                                                : null;

                                            return (
                                                <div key={i} className={`ai-result-transcript-msg ai-result-transcript-msg--${msg.role}`}>
                                                    <div className="ai-result-transcript-role">
                                                        <RoleIcon size={12} />
                                                        {roleLabel}
                                                        {isInterviewerMsg && interviewerTurnNumber && (
                                                            <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#c7d2fe', fontWeight: 600 }}>
                                                                Turn #{interviewerTurnNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="ai-result-transcript-text">{msg.content || msg.text}</div>
                                                    {isInterviewerMsg && candidateSnippet && (
                                                        <div style={{
                                                            marginTop: 6,
                                                            padding: '6px 10px',
                                                            borderRadius: 6,
                                                            background: 'rgba(255, 255, 255, 0.03)',
                                                            borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                                                            fontSize: 11,
                                                            color: '#cbd5e1',
                                                            fontStyle: 'italic',
                                                            lineHeight: 1.4,
                                                        }}>
                                                            <span style={{ color: '#94a3b8', fontStyle: 'normal', fontWeight: 600 }}>Candidate snippet: </span>
                                                            "{candidateSnippet.length > 120 ? `${candidateSnippet.substring(0, 120)}...` : candidateSnippet}"
                                                        </div>
                                                    )}
                                                    {isInterviewerMsg && (
                                                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                                            {msg.answerType && (
                                                                <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                                                    Type: {msg.answerType}
                                                                </span>
                                                            )}
                                                            {msg.voiceSource && (
                                                                <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                                                    Voice: {msg.voiceSource}
                                                                </span>
                                                            )}
                                                            {msg.replyGapMs != null && (
                                                                <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                                                    Gap: {msg.replyGapMs}ms
                                                                </span>
                                                            )}
                                                            {msg.quoteVerified != null && (
                                                                <span style={{ padding: '2px 6px', borderRadius: 4, background: msg.quoteVerified ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)', color: msg.quoteVerified ? '#86efac' : '#94a3b8' }}>
                                                                    {msg.quoteVerified ? '✓ Quote verified' : 'Generic follow-up'}
                                                                </span>
                                                            )}
                                                            <div style={{ display: 'inline-flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                                                                <span style={{ fontSize: 10, color: '#64748b' }}>Rate turn #{interviewerTurnNumber}:</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleTurnFlag(i, 'sounded_robotic')}
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: 6,
                                                                        border: '1px solid',
                                                                        borderColor: turnFlags[i] === 'sounded_robotic' ? '#f87171' : 'rgba(255,255,255,0.12)',
                                                                        background: turnFlags[i] === 'sounded_robotic' ? 'rgba(239,68,68,0.2)' : 'transparent',
                                                                        color: turnFlags[i] === 'sounded_robotic' ? '#fca5a5' : '#94a3b8',
                                                                        cursor: 'pointer',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    🤖 Sounded robotic
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleTurnFlag(i, 'didnt_listen')}
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: 6,
                                                                        border: '1px solid',
                                                                        borderColor: turnFlags[i] === 'didnt_listen' ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                                                                        background: turnFlags[i] === 'didnt_listen' ? 'rgba(245,158,11,0.2)' : 'transparent',
                                                                        color: turnFlags[i] === 'didnt_listen' ? '#fcd34d' : '#94a3b8',
                                                                        cursor: 'pointer',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    🙉 Didn't listen
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {isFeedbackMsg && msg.hint && (
                                                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: '#a5b4fc' }}>
                                                            Hint: {msg.hint}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── AI Next Steps ── */}
                {ensureArray(a?.nextSteps).length > 0 && (
                    <div className="ai-results-next-steps">
                        <div className="ai-results-next-steps-header">
                            <Target size={15} /> Recommended Next Steps
                        </div>
                        <div className="ai-results-next-steps-list">
                            {ensureArray(a.nextSteps).map((step, i) => {
                                const stepText = typeof step === 'string' ? step : step?.action || step?.text || '';
                                const isCode = /coding|playground|algorithm|dsa/i.test(stepText);
                                const isMock = /mock|round|practice|interview/i.test(stepText);
                                const isPlan = /plan|schedule|study/i.test(stepText);
                                return (
                                    <div key={i} className="ai-results-next-step-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="ai-results-next-step-num">{i + 1}</span>
                                            <span>{stepText}</span>
                                        </div>
                                        {isCode ? (
                                            <button type="button" className="ai-result-focus-btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: 'fit-content' }} onClick={() => navigate('/coding-playground')}>
                                                Coding Playground <ChevronRight size={12} />
                                            </button>
                                        ) : isMock ? (
                                            <button type="button" className="ai-result-focus-btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: 'fit-content' }} onClick={() => startFocusedPractice(interviewType)}>
                                                Practice Now <ChevronRight size={12} />
                                            </button>
                                        ) : isPlan ? (
                                            <button type="button" className="ai-result-focus-btn" style={{ fontSize: '12px', padding: '6px 12px', minWidth: 'fit-content' }} onClick={() => navigate('/improvement-plan')}>
                                                View Plan <ChevronRight size={12} />
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Bottom Actions ── */}
                <div className="ai-result-actions">
                    {typeof window !== 'undefined' && Boolean(sessionStorage.getItem('multiRoundContext') || sessionStorage.getItem('multiRoundResult')) && (
                        <button
                            className="ai-result-cta"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderColor: '#8b5cf6' }}
                            onClick={() => navigate('/multi-round-interview')}
                        >
                            <Zap size={16} /> Continue Multi-Round Interview Loop
                        </button>
                    )}
                    <button className="ai-result-cta" style={{ background: '#8b5cf6', color: '#fff', borderColor: '#8b5cf6' }} onClick={() => navigate('/improvement-plan')}>
                        <TrendingUp size={16} /> View Improvement Plan
                    </button>
                    <button className="ai-result-cta ai-result-cta--secondary" onClick={onStartNew}>
                        <RefreshCw size={16} /> Start New Interview
                    </button>
                    <button className="ai-result-cta ai-result-cta--secondary" onClick={() => navigate('/interview-suite')}>
                        <ArrowLeft size={16} /> Back to Interview Suite
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(InterviewResults);
