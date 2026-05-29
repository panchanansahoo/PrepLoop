import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart3, TrendingUp, Trophy, Star, Clock, Target,
    Briefcase, Code2, Brain, Users, ArrowLeft, ChevronRight,
    Award, Zap, AlertTriangle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InterviewAnalytics() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, sessionsRes] = await Promise.all([
                authFetch(`${API_URL}/api/company-interview/analytics`),
                authFetch(`${API_URL}/api/company-interview/sessions?limit=10`)
            ]);
            const analyticsData = await analyticsRes.json();
            const sessionsData = await sessionsRes.json();
            setAnalytics(analyticsData);
            setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        } catch (e) {
            console.error('Analytics fetch error:', e);
        }
        setLoading(false);
    };

    // ── Score Trend Chart (Pure CSS) ──
    const ScoreTrendChart = ({ data }) => {
        if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet. Complete an interview to see your trend.</p>;

        const maxScore = 100;
        const chartWidth = 100; // percentage
        const barWidth = Math.min(40, chartWidth / data.length);

        return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 4px' }}>
                {data.slice(-15).map((point, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{point.score}</span>
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
                        <span style={{ fontSize: 8, color: 'var(--text-secondary)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 40, overflow: 'hidden' }}>
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
                background: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
            }}>
                <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const improvement = analytics?.recentImprovement || 0;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <BarChart3 size={24} style={{ color: 'var(--accent-primary)' }} /> Interview Analytics
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your interview performance and improvement over time</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        {
                            label: 'Total Sessions', value: analytics?.totalSessions || 0,
                            icon: <Trophy size={18} />, color: 'var(--warning-main)'
                        },
                        {
                            label: 'Avg Score', value: `${analytics?.averageScore || 0}%`,
                            icon: <Star size={18} />, color: 'var(--accent-primary)'
                        },
                        {
                            label: 'Improvement', value: `${improvement >= 0 ? '+' : ''}${improvement}%`,
                            icon: <TrendingUp size={18} />, color: improvement >= 0 ? '#22c55e' : '#ef4444'
                        },
                        {
                            label: 'Companies', value: Object.keys(analytics?.companyBreakdown || {}).length,
                            icon: <Briefcase size={18} />, color: 'var(--info-main)'
                        }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 14,
                            padding: '16px 20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Score Trend */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={14} style={{ color: 'var(--accent-primary)' }} /> Score Trend
                        </h3>
                        <ScoreTrendChart data={analytics?.scoreTrend || []} />
                    </div>

                    {/* Company Breakdown */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Briefcase size={14} style={{ color: 'var(--info-main)' }} /> By Company
                        </h3>
                        {Object.entries(analytics?.companyBreakdown || {}).length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>
                        ) : (
                            Object.entries(analytics?.companyBreakdown || {}).map(([company, stats]) => (
                                <div key={company} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border-light)'
                                }}>
                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{company}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stats.count} session{stats.count !== 1 ? 's' : ''}</span>
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
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 24
                }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Target size={14} style={{ color: 'var(--success-main)' }} /> Performance by Round Type
                    </h3>
                    {Object.entries(analytics?.stageBreakdown || {}).length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 12 }}>
                            {Object.entries(analytics?.stageBreakdown || {}).map(([stage, stats]) => (
                                <div key={stage} style={{
                                    padding: 16,
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{stage}</div>
                                    <div style={{
                                        fontSize: 24, fontWeight: 700,
                                        color: stats.avgScore >= 80 ? '#22c55e' : stats.avgScore >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {stats.avgScore}%
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                                        {stats.count} session{stats.count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Sessions */}
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                            <Clock size={14} style={{ color: 'var(--warning-main)' }} /> Recent Sessions
                        </h3>
                        <Link to="/interview-history" style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ChevronRight size={12} />
                        </Link>
                    </div>
                    {sessions.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sessions yet. Start an interview to see your history.</p>
                    ) : (
                        sessions.map((session, i) => (
                            <div key={session.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0',
                                borderBottom: i < sessions.length - 1 ? '1px solid var(--border-light)' : 'none'
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'var(--bg-tertiary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--accent-primary)', flexShrink: 0, fontSize: 14
                                }}>
                                    {session.session_type === 'multi-round' ? <Zap size={16} /> : <Star size={16} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                                        {session.company} · {session.role}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
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
