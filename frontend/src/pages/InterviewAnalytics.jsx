import React, { useState, useEffect } from 'react';
import {
    BarChart3, TrendingUp, Trophy, Star, Clock, Target,
    Briefcase, ArrowLeft, ChevronRight,
    Zap, Loader2, Flame, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { Link } from 'react-router-dom';

import { API_URL } from '../utils/safeApiUrl';

export default function InterviewAnalytics() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [analytics, setAnalytics] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = buildAuthHeaders(user);
            const [analyticsRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/api/analytics/overview`, { headers }),
                fetch(`${API_URL}/api/ai/interview/history`, { headers })
            ]);

            if (!analyticsRes.ok) {
                throw new Error(`Analytics request failed (${analyticsRes.status})`);
            }

            const analyticsData = await analyticsRes.json();
            setAnalytics(analyticsData);

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setSessions(Array.isArray(historyData?.interviews) ? historyData.interviews : []);
            }
        } catch (e) {
            console.error('Analytics fetch error:', e);
            setError('Unable to load analytics. Please try again.');
        }
        setLoading(false);
    };

    // ── Theme-aware styling ──
    const pageBg = isLight
        ? 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f1f5f9 100%)'
        : 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)';
    const textPrimary = isLight ? '#0f172a' : '#e2e8f0';
    const textSecondary = isLight ? '#475569' : '#94a3b8';
    const textMuted = isLight ? '#64748b' : '#64748b';
    const cardBg = isLight
        ? 'rgba(255,255,255,0.8)'
        : 'rgba(255,255,255,0.03)';
    const cardBorder = isLight
        ? '1px solid rgba(15,23,42,0.08)'
        : '1px solid rgba(255,255,255,0.06)';
    const cardShadow = isLight
        ? '0 4px 24px rgba(0,0,0,0.04)'
        : 'none';
    const innerCardBg = isLight
        ? 'rgba(241,245,249,0.6)'
        : 'rgba(255,255,255,0.02)';
    const innerCardBorder = isLight
        ? '1px solid rgba(15,23,42,0.06)'
        : '1px solid rgba(255,255,255,0.05)';
    const dividerColor = isLight
        ? 'rgba(15,23,42,0.06)'
        : 'rgba(255,255,255,0.04)';

    // ── Score Trend Chart (Pure CSS) ──
    const ScoreTrendChart = ({ data }) => {
        if (!data || data.length === 0) return <p style={{ color: textMuted, fontSize: 13 }}>No data yet. Complete an interview to see your trend.</p>;

        return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 4px' }}>
                {data.slice(-15).map((point, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: textMuted }}>{Math.round(point.score)}</span>
                        <div style={{
                            width: '100%',
                            maxWidth: 32,
                            height: `${(point.score / 100) * 100}%`,
                            minHeight: 4,
                            background: point.score >= 80 ? 'linear-gradient(180deg, #22c55e, #16a34a)' :
                                point.score >= 60 ? 'linear-gradient(180deg, #f59e0b, #d97706)' :
                                    'linear-gradient(180deg, #ef4444, #dc2626)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.5s ease'
                        }} />
                        <span style={{ fontSize: 8, color: textSecondary, writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 40, overflow: 'hidden' }}>
                            {point.date ? new Date(point.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : `#${i + 1}`}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: pageBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: textPrimary
            }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: pageBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: textPrimary,
                flexDirection: 'column', gap: 16
            }}>
                <p style={{ color: textSecondary }}>{error}</p>
                <button onClick={fetchData} style={{
                    padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: '#8b5cf6', color: '#fff', fontWeight: 600, fontSize: 13
                }}>Retry</button>
            </div>
        );
    }

    const scoreTrendValue = analytics?.scoreTrend || 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: pageBg,
            color: textPrimary,
            padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Link to="/dashboard" style={{ color: textMuted, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, color: textPrimary }}>
                        <BarChart3 size={24} style={{ color: '#8b5cf6' }} /> Interview Analytics
                    </h1>
                    <p style={{ color: textSecondary, fontSize: 14 }}>Track your interview performance and improvement over time</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        {
                            label: 'Total Sessions', value: analytics?.totalInterviews || 0,
                            icon: <Trophy size={18} />, color: '#f59e0b'
                        },
                        {
                            label: 'Avg Score', value: `${analytics?.averageOverallScore || 0}%`,
                            icon: <Star size={18} />, color: '#8b5cf6'
                        },
                        {
                            label: 'Trend', value: `${scoreTrendValue >= 0 ? '+' : ''}${scoreTrendValue}%`,
                            icon: <TrendingUp size={18} />, color: scoreTrendValue >= 0 ? '#22c55e' : '#ef4444'
                        },
                        {
                            label: 'Streak', value: `${analytics?.currentStreak || 0} 🔥`,
                            icon: <Flame size={18} />, color: '#f97316'
                        }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: cardBg,
                            border: cardBorder,
                            borderRadius: 14,
                            padding: '16px 20px',
                            textAlign: 'center',
                            boxShadow: cardShadow,
                            backdropFilter: 'blur(12px)'
                        }}>
                            <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Skill Scores Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Communication', value: analytics?.averageCommunicationScore || 0, color: '#06b6d4' },
                        { label: 'Technical', value: analytics?.averageTechnicalScore || 0, color: '#8b5cf6' },
                        { label: 'Problem Solving', value: analytics?.averageProblemSolvingScore || 0, color: '#22c55e' }
                    ].map((skill, i) => (
                        <div key={i} style={{
                            background: cardBg, border: cardBorder, borderRadius: 14,
                            padding: '16px 20px', boxShadow: cardShadow, backdropFilter: 'blur(12px)'
                        }}>
                            <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>{skill.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: skill.value >= 80 ? '#22c55e' : skill.value >= 60 ? '#f59e0b' : '#ef4444' }}>
                                {skill.value}%
                            </div>
                            <div style={{
                                marginTop: 8, height: 4, borderRadius: 4,
                                background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'
                            }}>
                                <div style={{
                                    width: `${Math.min(skill.value, 100)}%`, height: '100%', borderRadius: 4,
                                    background: `linear-gradient(90deg, ${skill.color}, ${skill.color}bb)`,
                                    transition: 'width 0.8s ease'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Score Trend */}
                    <div style={{
                        background: cardBg, border: cardBorder, borderRadius: 14,
                        padding: 20, boxShadow: cardShadow, backdropFilter: 'blur(12px)'
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: textPrimary }}>
                            <TrendingUp size={14} style={{ color: '#8b5cf6' }} /> Score Trend
                        </h3>
                        <ScoreTrendChart data={analytics?.recentTrend || []} />
                    </div>

                    {/* By Interview Type */}
                    <div style={{
                        background: cardBg, border: cardBorder, borderRadius: 14,
                        padding: 20, boxShadow: cardShadow, backdropFilter: 'blur(12px)'
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: textPrimary }}>
                            <Briefcase size={14} style={{ color: '#3b82f6' }} /> By Interview Type
                        </h3>
                        {Object.entries(analytics?.byType || {}).length === 0 ? (
                            <p style={{ color: textMuted, fontSize: 13 }}>No data yet</p>
                        ) : (
                            Object.entries(analytics?.byType || {}).map(([type, stats]) => (
                                <div key={type} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '8px 0',
                                    borderBottom: `1px solid ${dividerColor}`
                                }}>
                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textTransform: 'capitalize', color: textPrimary }}>{type}</span>
                                    <span style={{ fontSize: 11, color: textMuted }}>{stats.count} session{stats.count !== 1 ? 's' : ''}</span>
                                    <span style={{
                                        fontSize: 14, fontWeight: 700,
                                        color: (stats.avg || stats.average || 0) >= 80 ? '#22c55e' : (stats.avg || stats.average || 0) >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {stats.avg || stats.average || 0}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* By Difficulty */}
                <div style={{
                    background: cardBg, border: cardBorder, borderRadius: 14,
                    padding: 20, marginBottom: 24, boxShadow: cardShadow, backdropFilter: 'blur(12px)'
                }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: textPrimary }}>
                        <Target size={14} style={{ color: '#22c55e' }} /> Performance by Difficulty
                    </h3>
                    {Object.entries(analytics?.byDifficulty || {}).length === 0 ? (
                        <p style={{ color: textMuted, fontSize: 13 }}>No data yet</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                            {Object.entries(analytics?.byDifficulty || {}).map(([level, stats]) => (
                                <div key={level} style={{
                                    padding: 16, background: innerCardBg,
                                    border: innerCardBorder, borderRadius: 10, textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 12, color: textSecondary, marginBottom: 4, textTransform: 'capitalize' }}>{level}</div>
                                    <div style={{
                                        fontSize: 24, fontWeight: 700,
                                        color: (stats.avg || stats.average || 0) >= 80 ? '#22c55e' : (stats.avg || stats.average || 0) >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {stats.avg || stats.average || 0}%
                                    </div>
                                    <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>
                                        {stats.count} session{stats.count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Consistency & Best Score */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div style={{
                        background: cardBg, border: cardBorder, borderRadius: 14,
                        padding: 20, boxShadow: cardShadow, backdropFilter: 'blur(12px)', textAlign: 'center'
                    }}>
                        <Award size={20} style={{ color: '#8b5cf6', marginBottom: 8 }} />
                        <div style={{ fontSize: 28, fontWeight: 700, color: textPrimary }}>{analytics?.bestScore || 0}%</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Best Score</div>
                    </div>
                    <div style={{
                        background: cardBg, border: cardBorder, borderRadius: 14,
                        padding: 20, boxShadow: cardShadow, backdropFilter: 'blur(12px)', textAlign: 'center'
                    }}>
                        <Target size={20} style={{ color: '#06b6d4', marginBottom: 8 }} />
                        <div style={{ fontSize: 28, fontWeight: 700, color: textPrimary }}>{analytics?.consistency || 0}%</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Consistency</div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div style={{
                    background: cardBg, border: cardBorder, borderRadius: 14,
                    padding: 20, boxShadow: cardShadow, backdropFilter: 'blur(12px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: 0, color: textPrimary }}>
                            <Clock size={14} style={{ color: '#f59e0b' }} /> Recent Sessions
                        </h3>
                        <Link to="/interview-history" style={{ fontSize: 12, color: '#8b5cf6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    {sessions.length === 0 ? (
                        <p style={{ color: textMuted, fontSize: 13 }}>No sessions yet. Start an interview to see your history.</p>
                    ) : (
                        sessions.slice(0, 10).map((session, i) => (
                            <div key={session.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0',
                                borderBottom: i < Math.min(sessions.length, 10) - 1 ? `1px solid ${dividerColor}` : 'none'
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: isLight ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#8b5cf6', flexShrink: 0, fontSize: 14
                                }}>
                                    {session.interview_type === 'system-design' ? <Zap size={16} /> : <Star size={16} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize', color: textPrimary }}>
                                        {session.interview_type || 'Interview'}
                                    </div>
                                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                                        {session.difficulty || 'medium'} · {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : 'In progress'}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: 16, fontWeight: 700,
                                    color: (session.overall_score || 0) >= 80 ? '#22c55e' : (session.overall_score || 0) >= 60 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {session.overall_score || 0}%
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
