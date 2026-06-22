import { useState } from 'react';
import { BarChart3, CheckCircle, AlertCircle, Target, Brain, ChevronDown, ChevronUp, Star, TrendingUp, Zap, Volume2, Award, Sparkles, ExternalLink, MessageSquare, BookOpen, Calendar, User, Bot, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DetailedReport.css';

export default function DetailedReport({ data, companyName, companyColor, companyLogo, conversation }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedQ, setExpandedQ] = useState(null);

    if (!data) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
        { id: 'questions', label: 'Questions', icon: <Target size={14} /> },
        { id: 'transcript', label: 'Transcript', icon: <MessageSquare size={14} /> },
        { id: 'suggestions', label: 'AI Suggestions', icon: <BookOpen size={14} /> },
        { id: 'speech', label: 'Speech', icon: <Volume2 size={14} /> },
        { id: 'recommendations', label: 'Next Steps', icon: <Sparkles size={14} /> },
    ];

    const getScoreColor = (score) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getVerdictClass = (verdict) => {
        if (!verdict) return '';
        if (verdict.includes('Strong Hire')) return 'strong-hire';
        if (verdict.includes('Advance')) return 'advance';
        if (verdict.includes('Borderline')) return 'borderline';
        return 'not-advance';
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    // Get priority badge color
    const getPriorityColor = (priority) => {
        if (priority === 'high') return '#ef4444';
        if (priority === 'medium') return '#f59e0b';
        return '#22c55e';
    };

    return (
        <div className="dr-container">
            {/* Tab Navigation */}
            <div className="dr-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`dr-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={activeTab === tab.id ? { borderColor: companyColor, color: companyColor } : {}}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="dr-panel dr-overview">
                    {/* Score Ring */}
                    <div className="dr-score-hero">
                        <div className="dr-score-ring" style={{ '--score-color': getScoreColor(data.overallScore) }}>
                            <svg viewBox="0 0 120 120" className="dr-ring-svg">
                                <circle cx="60" cy="60" r="52" className="dr-ring-bg" />
                                <circle
                                    cx="60" cy="60" r="52"
                                    className="dr-ring-fill"
                                    style={{
                                        strokeDasharray: `${(data.overallScore / 100) * 327} 327`,
                                        stroke: getScoreColor(data.overallScore)
                                    }}
                                />
                            </svg>
                            <div className="dr-score-value">{data.overallScore}</div>
                            <div className="dr-score-label">Overall</div>
                        </div>
                        <div className={`dr-verdict ${getVerdictClass(data.verdict)}`}>
                            <span className="dr-verdict-emoji">{data.verdictEmoji}</span>
                            <span>{data.verdict}</span>
                        </div>
                    </div>

                    <p className="dr-summary">{data.summary}</p>

                    {/* Category Breakdown */}
                    {data.categoryScores && (
                        <div className="dr-categories">
                            <h4><Brain size={14} /> Skill Breakdown</h4>
                            {Object.entries(data.categoryScores).map(([key, val]) => (
                                <div key={key} className="dr-category-bar">
                                    <div className="dr-cat-label">
                                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span style={{ color: getScoreColor(val) }}>{val}%</span>
                                    </div>
                                    <div className="dr-bar-track">
                                        <div
                                            className="dr-bar-fill"
                                            style={{ width: `${val}%`, background: getScoreColor(val) }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Company Fit */}
                    {data.companyFitScore && (
                        <div className="dr-company-fit">
                            <div className="dr-fit-header">
                                <span>{companyLogo} {companyName} Fit</span>
                                <span style={{ color: getScoreColor(data.companyFitScore) }}>{data.companyFitScore}%</span>
                            </div>
                            <p>{data.companyFitNotes}</p>
                        </div>
                    )}

                    {/* Strengths & Improvements */}
                    <div className="dr-lists">
                        {data.strengths?.length > 0 && (
                            <div className="dr-list-col">
                                <h4><CheckCircle size={14} /> Strengths</h4>
                                {data.strengths.map((s, i) => <div key={i} className="dr-list-item good">✅ {s}</div>)}
                            </div>
                        )}
                        {data.improvements?.length > 0 && (
                            <div className="dr-list-col">
                                <h4><AlertCircle size={14} /> Areas to Improve</h4>
                                {data.improvements.map((s, i) => <div key={i} className="dr-list-item improve">📝 {s}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Questions Breakdown Tab */}
            {activeTab === 'questions' && (
                <div className="dr-panel dr-questions">
                    <h4><Target size={14} /> Question-by-Question Analysis</h4>
                    {(data.questionBreakdown || []).map((q, idx) => (
                        <div key={idx} className="dr-q-card">
                            <div
                                className="dr-q-header"
                                onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                            >
                                <div className="dr-q-num">Q{q.questionNumber || idx + 1}</div>
                                <div className="dr-q-info">
                                    <p className="dr-q-text">{q.question?.substring(0, 120)}{q.question?.length > 120 ? '...' : ''}</p>
                                    <div className="dr-q-meta">
                                        {q.category && <span className="dr-q-category">{q.category}</span>}
                                        {q.questionSource === 'database' && <span className="dr-q-source">📋 Real</span>}
                                    </div>
                                </div>
                                <div className="dr-q-score" style={{ color: getScoreColor(q.score) }}>
                                    {q.score}%
                                </div>
                                {expandedQ === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            {expandedQ === idx && (
                                <div className="dr-q-detail">
                                    {q.candidateAnswer && (
                                        <div className="dr-q-answer">
                                            <strong>Your Answer:</strong>
                                            <p>{q.candidateAnswer}</p>
                                        </div>
                                    )}
                                    <div className="dr-q-feedback">
                                        <strong>Feedback:</strong>
                                        <p>{q.feedback}</p>
                                    </div>
                                    {q.idealAnswerPoints?.length > 0 && (
                                        <div className="dr-q-ideal">
                                            <strong>Key Points to Cover:</strong>
                                            {q.idealAnswerPoints.map((pt, i) => (
                                                <div key={i} className="dr-ideal-point">💡 {pt}</div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="dr-q-lists">
                                        {q.strengths?.length > 0 && (
                                            <div className="dr-q-list">
                                                {q.strengths.map((s, i) => <span key={i} className="dr-fb-good">✅ {s}</span>)}
                                            </div>
                                        )}
                                        {q.improvements?.length > 0 && (
                                            <div className="dr-q-list">
                                                {q.improvements.map((s, i) => <span key={i} className="dr-fb-improve">📝 {s}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/*  TRANSCRIPT TAB — Full Conversation History */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === 'transcript' && (
                <div className="dr-panel dr-transcript">
                    <h4><MessageSquare size={14} /> Full Conversation History</h4>
                    {conversation && conversation.length > 0 ? (
                        <div className="dr-transcript-list">
                            {conversation.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`dr-msg ${msg.role === 'interviewer' ? 'dr-msg-interviewer' : msg.role === 'candidate' ? 'dr-msg-candidate' : 'dr-msg-feedback'}`}
                                >
                                    <div className="dr-msg-avatar">
                                        {msg.role === 'interviewer' ? (
                                            <div className="dr-msg-icon dr-msg-icon-ai" style={{ background: companyColor || '#6366f1' }}>
                                                <Bot size={14} />
                                            </div>
                                        ) : msg.role === 'candidate' ? (
                                            <div className="dr-msg-icon dr-msg-icon-user">
                                                <User size={14} />
                                            </div>
                                        ) : (
                                            <div className="dr-msg-icon dr-msg-icon-feedback">
                                                <Star size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="dr-msg-body">
                                        <div className="dr-msg-header">
                                            <span className="dr-msg-role">
                                                {msg.role === 'interviewer' ? `AI Interviewer` : msg.role === 'candidate' ? 'You' : 'Feedback'}
                                            </span>
                                            {msg.timestamp && (
                                                <span className="dr-msg-time">
                                                    <Clock size={10} /> {formatTimestamp(msg.timestamp)}
                                                </span>
                                            )}
                                            {msg.role === 'feedback' && msg.score && (
                                                <span className="dr-msg-score" style={{ color: getScoreColor(msg.score) }}>
                                                    {msg.score}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="dr-msg-content">{msg.content}</div>
                                        {/* Show feedback details */}
                                        {msg.role === 'feedback' && (
                                            <div className="dr-msg-feedback-details">
                                                {msg.strengths?.length > 0 && (
                                                    <div className="dr-msg-fb-list">
                                                        {msg.strengths.map((s, i) => (
                                                            <span key={i} className="dr-msg-fb-chip good">✅ {s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {msg.improvements?.length > 0 && (
                                                    <div className="dr-msg-fb-list">
                                                        {msg.improvements.map((s, i) => (
                                                            <span key={i} className="dr-msg-fb-chip improve">📝 {s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="dr-empty">
                            <MessageSquare size={32} />
                            <p>No conversation history available</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/*  AI SUGGESTIONS TAB — Topics, Practice, Study Plan */}
            {/* ═══════════════════════════════════════════ */}
            {activeTab === 'suggestions' && (
                <div className="dr-panel dr-suggestions">
                    <h4><BookOpen size={14} /> AI-Powered Improvement Plan</h4>

                    {/* Suggested Topics */}
                    {data.suggestedTopics?.length > 0 && (
                        <div className="dr-suggest-section">
                            <h5><Target size={13} /> Topics to Focus On</h5>
                            <div className="dr-topics-grid">
                                {data.suggestedTopics.map((t, i) => (
                                    <div key={i} className="dr-topic-card">
                                        <div className="dr-topic-header">
                                            <span className="dr-topic-name">{t.topic}</span>
                                            <span
                                                className="dr-topic-priority"
                                                style={{ background: `${getPriorityColor(t.priority)}20`, color: getPriorityColor(t.priority), border: `1px solid ${getPriorityColor(t.priority)}40` }}
                                            >
                                                {t.priority}
                                            </span>
                                        </div>
                                        <p className="dr-topic-reason">{t.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Practice Questions */}
                    {data.practiceQuestions?.length > 0 && (
                        <div className="dr-suggest-section">
                            <h5><Zap size={13} /> Practice Questions for You</h5>
                            <div className="dr-practice-list">
                                {data.practiceQuestions.map((q, i) => (
                                    <div key={i} className="dr-practice-item">
                                        <span className="dr-practice-num">{i + 1}</span>
                                        <span className="dr-practice-text">{q}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 7-Day Study Plan */}
                    {data.studyPlan?.length > 0 && (
                        <div className="dr-suggest-section">
                            <h5><Calendar size={13} /> Your 7-Day Study Plan</h5>
                            <div className="dr-study-plan">
                                {data.studyPlan.map((day, i) => (
                                    <div key={i} className="dr-plan-day">
                                        <div className="dr-plan-day-header">
                                            <span className="dr-plan-day-label">{day.day}</span>
                                            <span className="dr-plan-day-focus">{day.focus}</span>
                                        </div>
                                        <div className="dr-plan-tasks">
                                            {(day.tasks || []).map((task, j) => (
                                                <div key={j} className="dr-plan-task">
                                                    <span className="dr-plan-check">○</span>
                                                    <span>{task}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fallback if no suggestions */}
                    {!data.suggestedTopics?.length && !data.practiceQuestions?.length && !data.studyPlan?.length && (
                        <div className="dr-empty">
                            <BookOpen size={32} />
                            <p>AI suggestions will appear here after your interview is evaluated</p>
                        </div>
                    )}
                </div>
            )}

            {/* Speech Analysis Tab */}
            {activeTab === 'speech' && (
                <div className="dr-panel dr-speech">
                    <h4><Volume2 size={14} /> Speech Analysis</h4>
                    {data.speechAnalysis ? (
                        <>
                            <div className="dr-speech-stats">
                                <div className="dr-speech-stat">
                                    <span className="dr-stat-value">{data.speechAnalysis.overallWPM}</span>
                                    <span className="dr-stat-label">Avg WPM</span>
                                </div>
                                <div className="dr-speech-stat">
                                    <span className="dr-stat-value">{data.speechAnalysis.totalFillers}</span>
                                    <span className="dr-stat-label">Total Fillers</span>
                                </div>
                                <div className="dr-speech-stat">
                                    <span className="dr-stat-value">
                                        {data.speechAnalysis.clarityTrend?.length > 0
                                            ? Math.round(data.speechAnalysis.clarityTrend.reduce((a, b) => a + b, 0) / data.speechAnalysis.clarityTrend.length)
                                            : 'N/A'}%
                                    </span>
                                    <span className="dr-stat-label">Avg Clarity</span>
                                </div>
                            </div>

                            {/* Trend Bars */}
                            {data.speechAnalysis.clarityTrend?.length > 0 && (
                                <div className="dr-trend-section">
                                    <h5>Clarity Trend</h5>
                                    <div className="dr-trend-bars">
                                        {data.speechAnalysis.clarityTrend.map((val, i) => (
                                            <div key={i} className="dr-trend-bar-wrap">
                                                <div
                                                    className="dr-trend-bar"
                                                    style={{ height: `${val}%`, background: getScoreColor(val) }}
                                                />
                                                <span className="dr-trend-label">Q{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.speechAnalysis.confidenceTrend?.length > 0 && (
                                <div className="dr-trend-section">
                                    <h5>Confidence Trend</h5>
                                    <div className="dr-trend-bars">
                                        {data.speechAnalysis.confidenceTrend.map((val, i) => (
                                            <div key={i} className="dr-trend-bar-wrap">
                                                <div
                                                    className="dr-trend-bar"
                                                    style={{ height: `${val}%`, background: getScoreColor(val) }}
                                                />
                                                <span className="dr-trend-label">Q{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="dr-empty">
                            <Volume2 size={32} />
                            <p>Speech data not available for text-only interviews</p>
                        </div>
                    )}
                </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
                <div className="dr-panel dr-recs">
                    <h4><Sparkles size={14} /> Personalized Recommendations</h4>
                    {(data.recommendations || []).map((rec, idx) => (
                        <div key={idx} className="dr-rec-card">
                            <div className="dr-rec-area">
                                <Zap size={14} /> {rec.area}
                            </div>
                            <p className="dr-rec-action">{rec.action}</p>
                            {rec.resources?.length > 0 && (
                                <div className="dr-rec-links">
                                    {rec.resources.map((r, i) => (
                                        <Link key={i} to={r} className="dr-rec-link">
                                            <ExternalLink size={12} /> Practice Now
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {data.recommendation && (
                        <div className="dr-rec-highlight">
                            <Award size={16} />
                            <p>{data.recommendation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
