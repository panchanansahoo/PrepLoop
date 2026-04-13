import React, { useState, useEffect } from 'react';
import {
    Clock, Star, ChevronRight, ArrowLeft, Briefcase,
    Code2, Brain, Users, Zap, Filter, Loader2,
    MessageSquare, BarChart3, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InterviewHistory() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [filterCompany, setFilterCompany] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const normalizeText = (value) => (value || '').toString().toLowerCase();

    const extractSessionSummary = (session) => {
        if (!session) return 'No summary available yet.';

        const explicitSummary =
            session.summary ||
            session.summary_text ||
            session.session_summary ||
            session.ai_summary ||
            session.overall_feedback;

        if (explicitSummary && typeof explicitSummary === 'string') {
            return explicitSummary;
        }

        const feedbackMessage = Array.isArray(session.conversation)
            ? session.conversation.find((item) => item?.role === 'feedback' && item?.content)
            : null;
        if (feedbackMessage?.content) {
            return feedbackMessage.content;
        }

        const candidateTurns = Array.isArray(session.conversation)
            ? session.conversation.filter((item) => item?.role === 'candidate' && item?.content)
            : [];

        if (candidateTurns.length === 0) {
            return 'Session completed. Review the transcript for details.';
        }

        return candidateTurns
            .slice(0, 2)
            .map((item) => item.content)
            .join(' ')
            .slice(0, 220);
    };

    const filteredSessions = sessions.filter((session) => {
        if (filterCompany && normalizeText(session.company) !== normalizeText(filterCompany)) {
            return false;
        }

        if (!searchQuery.trim()) return true;

        const haystack = [
            session.company,
            session.role,
            session.stage,
            session.difficulty,
            extractSessionSummary(session),
        ]
            .map(normalizeText)
            .join(' ');

        return haystack.includes(normalizeText(searchQuery.trim()));
    });

    const getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    useEffect(() => { fetchSessions(); }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/company-interview/sessions?limit=50`;
            if (filterCompany) url += `&company=${filterCompany}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            const data = await res.json();
            setSessions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error fetching sessions:', e);
        }
        setLoading(false);
    };

    const fetchSessionDetail = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/company-interview/sessions/${id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setSelectedSession(data);
        } catch (e) {
            console.error('Error fetching session detail:', e);
        }
    };

    const getStageIcon = (stage) => {
        if (stage?.includes('DSA') || stage?.includes('Coding')) return <Code2 size={16} />;
        if (stage?.includes('System')) return <Brain size={16} />;
        if (stage?.includes('Behavioral') || stage?.includes('HR')) return <Users size={16} />;
        return <Briefcase size={16} />;
    };

    // Session Detail View
    if (selectedSession) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
                color: '#e2e8f0',
                padding: '32px 20px',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <button
                        onClick={() => setSelectedSession(null)}
                        style={{
                            background: 'none', border: 'none', color: '#64748b',
                            display: 'flex', alignItems: 'center', gap: 6,
                            cursor: 'pointer', fontSize: 13, marginBottom: 20
                        }}
                    >
                        <ArrowLeft size={14} /> Back to History
                    </button>

                    {/* Session Header */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 20,
                        display: 'flex', alignItems: 'center', gap: 16
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24
                        }}>
                            {selectedSession.session_type === 'multi-round' ? <Zap size={24} color="white" /> : getStageIcon(selectedSession.stage)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', margin: 0 }}>
                                {selectedSession.company} · {selectedSession.role}
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
                                {selectedSession.stage} · {selectedSession.difficulty} · {new Date(selectedSession.completed_at).toLocaleString()}
                            </p>
                        </div>
                        <div style={{
                            fontSize: 32, fontWeight: 700,
                            color: selectedSession.overall_score >= 80 ? '#22c55e' : selectedSession.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                        }}>
                            {selectedSession.overall_score}%
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BarChart3 size={14} style={{ color: '#22c55e' }} /> Session Summary
                        </h3>
                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.65 }}>
                            {extractSessionSummary(selectedSession)}
                        </p>
                    </div>

                    {/* Conversation Replay */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquare size={14} style={{ color: '#8b5cf6' }} /> Conversation Replay
                        </h3>
                        {(selectedSession.conversation || []).filter(c => c.role !== 'feedback').map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: 10,
                                marginBottom: 12,
                                flexDirection: msg.role === 'candidate' ? 'row-reverse' : 'row'
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    background: msg.role === 'interviewer' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, flexShrink: 0,
                                    color: msg.role === 'interviewer' ? '#8b5cf6' : '#3b82f6'
                                }}>
                                    {msg.role === 'interviewer' ? '🤖' : '👤'}
                                </div>
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    background: msg.role === 'interviewer' ? 'rgba(139,92,246,0.08)' : 'rgba(59,130,246,0.08)',
                                    border: `1px solid ${msg.role === 'interviewer' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)'}`,
                                    fontSize: 13, lineHeight: 1.6
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── List View ──
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
            color: '#e2e8f0',
            padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Link to="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                            <Clock size={22} style={{ color: '#f59e0b' }} /> Interview History
                        </h1>
                        <Link to="/interview-analytics" style={{
                            padding: '8px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                            borderRadius: 8, color: '#8b5cf6', fontSize: 12, fontWeight: 600,
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
                        }}>
                            <BarChart3 size={14} /> Analytics
                        </Link>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 10,
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'rgba(15,23,42,0.72)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: '8px 10px'
                    }}>
                        <Search size={14} color="#94a3b8" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by company, role, stage, summary..."
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#e2e8f0',
                                fontSize: 12,
                            }}
                        />
                    </div>
                    <input
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        placeholder="Company"
                        style={{
                            width: 130,
                            background: 'rgba(15,23,42,0.72)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            padding: '9px 10px',
                            color: '#e2e8f0',
                            fontSize: 12,
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6' }} />
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 60,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 16
                    }}>
                        <Clock size={40} style={{ color: '#475569', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                            {sessions.length === 0 ? 'No interview sessions yet' : 'No sessions match this search'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                            {sessions.length === 0
                                ? 'Complete an interview to see your history here'
                                : 'Try a different keyword, stage, or company filter'}
                        </p>
                        <Link to="/company-interview" style={{
                            padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none'
                        }}>
                            Start an Interview
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => fetchSessionDetail(session.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 18px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: session.session_type === 'multi-round' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: session.session_type === 'multi-round' ? '#f59e0b' : '#8b5cf6',
                                    flexShrink: 0
                                }}>
                                    {session.session_type === 'multi-round' ? <Zap size={18} /> : getStageIcon(session.stage)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
                                        {session.company} · {session.role}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                                        {session.stage} · {session.difficulty} · {new Date(session.completed_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.5 }}>
                                        {extractSessionSummary(session)}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: 18, fontWeight: 700,
                                    color: session.overall_score >= 80 ? '#22c55e' : session.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {session.overall_score}%
                                </div>
                                <ChevronRight size={16} style={{ color: '#475569' }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
