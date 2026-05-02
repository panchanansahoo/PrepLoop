import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, TrendingUp, Trophy, Star, Clock, Target,
    Briefcase, Code2, Brain, Users, ArrowLeft, ChevronRight,
    Award, Zap, AlertTriangle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';
import FetchError from '../components/FetchError';
import { Link } from 'react-router-dom';

export default function InterviewAnalytics() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const [analyticsData, sessionsData] = await Promise.all([
                apiFetch.get('/api/company-interview/analytics', { signal }),
                apiFetch.get('/api/company-interview/sessions?limit=10', { signal })
            ]);
            setAnalytics(analyticsData);
            setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        } catch (e) {
            if (e?.code === 'ERR_CANCELED') return;
            console.error('Analytics fetch error:', e);
            setError(e.message || 'Failed to load analytics data');
        }
        if (!signal?.aborted) setLoading(false);
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, []);

    // ── Score Trend Chart (Pure CSS) ──
    const ScoreTrendChart = ({ data }) => {
        if (!data || data.length === 0) return <p style={{ color: '#64748b', fontSize: 13 }}>No data yet. Complete an interview to see your trend.</p>;

        const maxScore = 100;
        const chartWidth = 100; // percentage
        const barWidth = Math.min(40, chartWidth / data.length);

        return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 4px' }}>
                {data.slice(-15).map((point, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: '#64748b' }}>{point.score}</span>
                        <div style={{
                            width: '100%',
                            maxWidth: 32,
                            height: `${(point.score / maxScore) * 100}%`,
                            minHeight: 4,
                            background: point.score >= 80 ? 'linear-gradient(180deg, #22c55e, #16a34a)' :
                                point.score >= 60 ? 'linear-gradient(180deg, #f59e0b, #d97706)' :
                                    'linear-gradient(180deg, #ef4444, #dc2626)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.5s ease'
                        }} />
                        <span style={{ fontSize: 8, color: '#475569', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 40, overflow: 'hidden' }}>
                            {new Date(point.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
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
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0'
            }}>
                <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
            }}>
                <FetchError
                    message={error}
                    onRetry={() => fetchData()}
                />
            </div>
        );
    }

    const improvement = analytics?.recentImprovement || 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
            color: '#e2e8f0',
            padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <BarChart3 size={24} style={{ color: '#8b5cf6' }} /> Interview Analytics
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Track your interview performance and improvement over time</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        {
                            label: 'Total Sessions', value: analytics?.totalSessions || 0,
                            icon: <Trophy size={18} />, color: '#f59e0b'
                        },
                        {
                            label: 'Avg Score', value: `${analytics?.averageScore || 0}%`,
                            icon: <Star size={18} />, color: '#8b5cf6'
                        },
                        {
                            label: 'Improvement', value: `${improvement >= 0 ? '+' : ''}${improvement}%`,
                            icon: <TrendingUp size={18} />, color: improvement >= 0 ? '#22c55e' : '#ef4444'
                        },
                        {
                            label: 'Companies', value: Object.keys(analytics?.companyBreakdown || {}).length,
                            icon: <Briefcase size={18} />, color: '#3b82f6'
                        }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14,
                            padding: '16px 20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Score Trend */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} style={{ color: '#8b5cf6' }} /> Score Trend
                        </h3>
                        <ScoreTrendChart data={analytics?.scoreTrend || []} />
                    </div>

                    {/* Company Breakdown */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Briefcase size={14} style={{ color: '#3b82f6' }} /> By Company
                        </h3>
                        {Object.entries(analytics?.companyBreakdown || {}).length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: 13 }}>No data yet</p>
                        ) : (
                            Object.entries(analytics?.companyBreakdown || {}).map(([company, stats]) => (
                                <div key={company} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '8px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)'
                                }}>
                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{company}</span>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>{stats.count} session{stats.count !== 1 ? 's' : ''}</span>
                                    <span style={{
                                        fontSize: 14, fontWeight: 700,
                                        color: stats.avgScore >= 80 ? '#22c55e' : stats.avgScore >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {stats.avgScore}%
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Stage Breakdown */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 24
                }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Target size={14} style={{ color: '#22c55e' }} /> Performance by Round Type
                    </h3>
                    {Object.entries(analytics?.stageBreakdown || {}).length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: 13 }}>No data yet</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                            {Object.entries(analytics?.stageBreakdown || {}).map(([stage, stats]) => (
                                <div key={stage} style={{
                                    padding: 16,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 10,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{stage}</div>
                                    <div style={{
                                        fontSize: 24, fontWeight: 700,
                                        color: stats.avgScore >= 80 ? '#22c55e' : stats.avgScore >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {stats.avgScore}%
                                    </div>
                                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                                        {stats.count} session{stats.count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Sessions */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                            <Clock size={14} style={{ color: '#f59e0b' }} /> Recent Sessions
                        </h3>
                        <Link to="/interview-history" style={{ fontSize: 12, color: '#8b5cf6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    {sessions.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: 13 }}>No sessions yet. Start an interview to see your history.</p>
                    ) : (
                        sessions.map((session, i) => (
                            <div key={session.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0',
                                borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(139,92,246,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#8b5cf6', flexShrink: 0, fontSize: 14
                                }}>
                                    {session.session_type === 'multi-round' ? <Zap size={16} /> : <Star size={16} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                                        {session.company} · {session.role}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                        {session.stage} · {session.difficulty} · {new Date(session.completed_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: 16, fontWeight: 700,
                                    color: session.overall_score >= 80 ? '#22c55e' : session.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {session.overall_score}%
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
