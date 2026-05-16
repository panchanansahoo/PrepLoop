import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, ChevronRight, Sparkles, CheckCircle, Star,
    Award, TrendingUp, BarChart3, Target, Brain, Shield,
    ThumbsUp, AlertTriangle, Download, Share2,
    RefreshCw, ArrowLeft, FileText, User, Building2,
    Lightbulb, ChevronDown, ChevronUp, Eye, Timer,
    Trophy, Gauge, MessageSquare, Code2, Zap, Pause,
} from 'lucide-react';

/**
 * InterviewResults — Summary/Results dashboard.
 *
 * Props:
 *  - analysisResult:      The analysis object (scores, categories, moments, etc.)
 *  - analysisLoading:     Boolean indicating AI analysis is in progress
 *  - interviewer:         { name, company } object
 *  - interviewType:       'hr' | 'technical' | etc.
 *  - conversation:        Array of { role, content } messages
 *  - onStartNew:          Callback to reset and start a new interview
 */
function InterviewResults({
    analysisResult,
    analysisLoading,
    interviewer,
    interviewType,
    conversation,
    onStartNew,
}) {
    const navigate = useNavigate();
    const [resultTab, setResultTab] = useState('overview');
    const [expandedMoment, setExpandedMoment] = useState(null);

    const a = analysisResult; // shorthand
    // Enrichment fields from backend intelligence
    const benchmarkTier = a?.benchmark_tier || a?.benchmarkTier;
    const timingAnalysis = a?.timing_analysis || a?.timingAnalysis;
    const perQBreakdown = a?.per_question_breakdown || a?.perQuestionBreakdown;

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

const ensureArray = (val) => Array.isArray(val) ? val : (typeof val === 'string' && val.trim().length > 0 ? [val] : []);

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
                    <button className="ai-result-action-btn">
                        <Share2 size={14} /> Share
                    </button>
                    <button className="ai-result-action-btn ai-result-action-btn--primary">
                        <Download size={14} /> Export
                    </button>
                </div>
            </header>

            <div className="ai-result-page">
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
                                <span className="ai-result-score-num" style={{ color: a?.performanceColor }}>{a?.overallScore || '—'}</span>
                                <span className="ai-result-score-of">/10</span>
                            </div>
                        </div>
                        <div className="ai-result-verdict" style={{ background: `${a?.performanceColor}18`, color: a?.performanceColor, borderColor: `${a?.performanceColor}40` }}>
                            {a?.overallScore >= 7 ? <Trophy size={14} /> : a?.overallScore >= 5 ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                            {benchmarkTier ? `${benchmarkTier.emoji || ''} ${benchmarkTier.label}` : (a?.performanceLabel || 'Analyzing...')}
                        </div>
                        {benchmarkTier?.description && (
                            <div className="ai-results-ai-badge" style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {benchmarkTier.description}
                            </div>
                        )}
                        {a?.aiGenerated && (
                            <div className="ai-results-ai-badge">
                                <Sparkles size={11} /> AI-Analyzed by Groq
                            </div>
                        )}
                    </div>
                </div>

                {/* ── AI Summary ── */}
                {a?.summary && (
                    <div className="ai-results-summary-card">
                        <div className="ai-results-summary-header">
                            <Brain size={14} className="ai-results-summary-icon" /> AI Summary
                        </div>
                        {a.summary}
                    </div>
                )}

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
                                    {ensureArray(a.categories).map((cat, i) => (
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
                                        {ensureArray(a.strengths).map((s, i) => (
                                            <li key={i}><CheckCircle size={14} className="ai-result-list-icon ai-result-list-icon--green" /> {s}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="ai-result-card ai-result-card--amber">
                                    <h3 className="ai-result-card-title"><Lightbulb size={16} style={{ color: '#f59e0b' }} /> Areas to Improve</h3>
                                    <ul className="ai-result-list">
                                        {ensureArray(a.improvements).map((s, i) => (
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
                                <h3 className="ai-result-card-title"><Brain size={16} /> AI Analysis Summary</h3>
                                <p className="ai-result-analysis-text">
                                    Based on your {a.stats.questionsAnswered} questions answered across {a.stats.duration} of interview time,
                                    here is a detailed breakdown of your performance across each competency area.
                                    Your strongest area was <strong>{ensureArray(a.categories).length > 0 ? ensureArray(a.categories).reduce((acc, curr) => acc.score > curr.score ? acc : curr).name : 'General'}</strong> with
                                    a score of {ensureArray(a.categories).length > 0 ? ensureArray(a.categories).reduce((acc, curr) => acc.score > curr.score ? acc : curr).score : (a.overallScore || 0)}/10.
                                </p>
                            </div>
                            {ensureArray(a.categories).map((cat, i) => (
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
                                                    </div>
                                                </div>
                                                <div className="ai-result-analysis-score" style={{
                                                    color: (q.scoreEstimate || 0) >= 7 ? '#22c55e' : (q.scoreEstimate || 0) >= 5 ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {q.scoreEstimate || '—'}/10
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
                                        ensureArray(conversation).map((msg, i) => (
                                            <div key={i} className={`ai-result-transcript-msg ai-result-transcript-msg--${msg.role}`}>
                                                <div className="ai-result-transcript-role">
                                                    {msg.role === 'interviewer' ? <Sparkles size={12} /> : <User size={12} />}
                                                    {msg.role === 'interviewer' ? interviewer.name : 'You'}
                                                </div>
                                                <div className="ai-result-transcript-text">{msg.content || msg.text}</div>
                                            </div>
                                        ))
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
                            {ensureArray(a.nextSteps).map((step, i) => (
                                <div key={i} className="ai-results-next-step-item">
                                    <span className="ai-results-next-step-num">{i + 1}</span>
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Bottom Actions ── */}
                <div className="ai-result-actions">
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
