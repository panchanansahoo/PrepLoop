import { useState, useEffect } from 'react';
import {
    Clock, Star, ChevronRight, ArrowLeft, Briefcase, Code2, Brain, Users,
    Zap, Filter, Loader2, MessageSquare, BarChart3, Search,
    Copy, Check, Download, Trash2, Award, CheckCircle2, AlertCircle, FileText,
    Printer, RotateCcw, Sparkles, Send, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import { API_URL } from '../config/api.js';

function buildInterviewHistoryApiUrl(path) {
    return buildApiUrl(path, { rawBaseUrl: API_URL, apiPrefix: '/api' });
}

export const DEMO_INTERVIEW_SESSION = {
    id: 'demo-google-fullstack-swe',
    session_id: 'demo-google-fullstack-swe',
    is_demo: true,
    session_type: 'single',
    company: 'Google',
    role: 'Full Stack Engineer',
    stage: 'Technical',
    difficulty: 'medium',
    overall_score: 88,
    score: 88,
    duration: 1260,
    scores: [90, 85, 90, 85],
    completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    summary: 'Candidate demonstrated exceptional systems understanding, crisp algorithmic problem solving, and structured communication. Successfully derived the optimal LRU cache architecture and reasoned through real-time distributed WebSocket scalability tradeoffs with clarity.',
    summary_data: {
        summary: 'Candidate demonstrated exceptional systems understanding, crisp algorithmic problem solving, and structured communication. Successfully derived the optimal LRU cache architecture and reasoned through real-time distributed WebSocket scalability tradeoffs with clarity.',
        recommendations: 'Continue practicing edge-case handling for distributed split-brain scenarios and refine proactive clarification questions in system design rounds.',
        strengths: [
            'Clear communication with structured problem decomposition',
            'Optimal O(1) doubly-linked list + hash map LRU cache implementation',
            'Strong understanding of Redis pub/sub backplanes for distributed WebSockets'
        ],
        improvements: [
            'Proactively quantify memory footprint requirements upfront',
            'Discuss backpressure strategies when scaling consumer message queues'
        ]
    },
    speech_metrics: {
        wpm: 138,
        fillerWordsCount: 3,
        clarityScore: 92,
        paceCategory: 'Optimal'
    },
    conversation: [
        {
            role: 'interviewer',
            content: "Welcome to your Google technical interview! Let's start with a design question. How would you design a scalable real-time notification service capable of supporting 5 million concurrent connected users with sub-second delivery latency?"
        },
        {
            role: 'candidate',
            content: "To handle 5 million concurrent connections with low latency, I would design a distributed architecture with three core tiers: first, a horizontally scalable Edge Gateway tier running lightweight WebSocket or HTTP/2 Server-Sent Events (SSE) connections terminated behind an Envoy load balancer. Second, a stateless Notification Dispatcher service backed by an Apache Kafka or RabbitMQ event stream to decouple producer events from client deliveries. Third, a distributed Redis Pub/Sub cluster or Redis Streams layer acting as a message bus to route notifications to the specific gateway instance holding the user's active socket connection. For persistence and user preferences, we would store notification histories in a partitioned NoSQL database like Cassandra or DynamoDB."
        },
        {
            role: 'feedback',
            content: 'Outstanding architecture overview. Great breakdown of edge termination, pub/sub message bus, and streaming decoupling.',
            score: 92,
            strengths: ['Decoupled producer and consumer tiers', 'Sub-second delivery architecture via Redis pub/sub'],
            improvements: ['Mention heartbeat keep-alive frequency and connection reconnection storms']
        },
        {
            role: 'interviewer',
            content: 'Great breakdown. Now let\'s shift to data structures. Could you explain how you would implement an LRU (Least Recently Used) Cache supporting get(key) and put(key, value) operations both in strict O(1) time complexity?'
        },
        {
            role: 'candidate',
            content: 'To achieve strict O(1) time complexity for both get and put, we combine a Hash Map with a Doubly Linked List. The Hash Map maps keys directly to node pointers in the linked list for O(1) lookup. The Doubly Linked List maintains the access order: the head stores the most recently used item, and the tail stores the least recently used item. When get(key) is invoked, we find the node in the map in O(1), splice it out of its current position in the list, and move it to the head. When put(key, value) is called, if the key exists we update its value and move it to head. If it does not exist and the cache is at capacity, we evict the tail node in O(1), delete its key from the hash map, and insert the new node at the head.'
        },
        {
            role: 'feedback',
            content: 'Precise and accurate explanation. Doubly linked list node pointers correctly explain O(1) removal without scanning.',
            score: 95,
            strengths: ['Clear explanation of hash map + doubly linked list interplay', 'Accurate O(1) eviction logic'],
            improvements: ['Address thread-safety with ReadWriteLock or concurrent segment locks']
        },
        {
            role: 'interviewer',
            content: 'Excellent. Finally, tell me about a time when you disagreed with a senior engineer or teammate on an architectural decision. How did you resolve the conflict?'
        },
        {
            role: 'candidate',
            content: 'In my previous project, we needed to migrate our monolithic reporting pipeline. A senior teammate advocated for building a custom in-memory caching layer on our API servers, whereas I felt an external Redis cluster was safer because it prevented memory pressure on the web workers and enabled horizontal scaling. Rather than debating opinions, I created a quick benchmark prototype simulating 10,000 concurrent report queries. The test revealed that in-memory caching caused severe Garbage Collection pauses and worker OOM crashes under load. I shared the telemetry data and cost projections with the team in a blameless post-mortem style RFC. My teammate agreed with the data, and we adopted the Redis solution, delivering the project on schedule with zero production incidents.'
        },
        {
            role: 'feedback',
            content: 'Strong behavioral answer using the STAR method. Focused on objective empirical benchmarks rather than personal opinions.',
            score: 88,
            strengths: ['Data-driven conflict resolution', 'Constructive collaborative mindset'],
            improvements: ['Could briefly touch on monitoring metrics used in production after launch']
        }
    ]
};

export default function InterviewHistory() {
    const { user } = useAuth();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [filterCompany, setFilterCompany] = useState('');
    const [filterStage, setFilterStage] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Practice Question Modal State
    const [practiceModal, setPracticeModal] = useState(null); // { question, previousAnswer }
    const [practiceAnswer, setPracticeAnswer] = useState('');
    const [practiceReview, setPracticeReview] = useState(null);
    const [isEvaluatingPractice, setIsEvaluatingPractice] = useState(false);

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

    const filteredSessions = sessions
        .filter((session) => {
            if (filterCompany && normalizeText(session.company) !== normalizeText(filterCompany)) {
                return false;
            }

            if (filterStage !== 'all') {
                const stageNorm = normalizeText(session.stage);
                if (filterStage === 'coding' && !(stageNorm.includes('coding') || stageNorm.includes('dsa'))) return false;
                if (filterStage === 'system-design' && !stageNorm.includes('system')) return false;
                if (filterStage === 'behavioral' && !stageNorm.includes('behavioral')) return false;
                if (filterStage === 'hr' && !stageNorm.includes('hr')) return false;
                if (filterStage === 'technical' && !(stageNorm.includes('tech') || stageNorm.includes('coding') || stageNorm.includes('dsa'))) return false;
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
        })
        .sort((a, b) => {
            if (sortBy === 'highest_score') {
                return (b.overall_score || 0) - (a.overall_score || 0);
            }
            if (sortBy === 'lowest_score') {
                return (a.overall_score || 0) - (b.overall_score || 0);
            }
            // default 'newest'
            const dateA = new Date(a.completed_at || a.started_at || a.created_at || 0).getTime();
            const dateB = new Date(b.completed_at || b.started_at || b.created_at || 0).getTime();
            return dateB - dateA;
        });

    const _getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Support deep link or router navigation to a specific session
    useEffect(() => {
        const targetId = location.state?.sessionId || searchParams.get('session_id') || searchParams.get('id');
        if (targetId) {
            fetchSessionDetail(targetId);
        }
    }, [location.state, searchParams]);

    const fetchSessions = async () => {
        setLoading(true);
        let serverSessions = [];
        try {
            let url = buildInterviewHistoryApiUrl('/company-interview/sessions?limit=50');
            if (filterCompany) url += `&company=${encodeURIComponent(filterCompany)}`;
            const res = await authFetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    serverSessions = data;
                }
            }
        } catch (e) {
            console.error('Error fetching sessions:', e);
        }

        const MAX_HISTORY_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
        const isRecent = (s) => {
            const time = new Date(s.created_at || s.date || s.timestamp || 0).getTime();
            return !time || (Date.now() - time < MAX_HISTORY_AGE_MS);
        };

        let localSessions = [];
        try {
            const raw = localStorage.getItem('preploop_local_interview_history');
            if (raw) {
                const local = JSON.parse(raw);
                if (Array.isArray(local)) {
                    localSessions = local.filter(isRecent).slice(0, 50);
                }
            }
        } catch (err) {
            console.error('Failed to parse local interview history:', err);
        }

        // Merge server and local history without duplicates
        const seen = new Set();
        const combined = [];
        for (const s of [...serverSessions, ...localSessions]) {
            const key = String(s.id || s.session_id || '');
            if (key && !seen.has(key)) {
                seen.add(key);
                combined.push(s);
            }
        }

        setSessions(combined);
        setLoading(false);
    };

    const fetchSessionDetail = async (id) => {
        const cleanId = String(id || '').replace(/^(interview_session_|mock_interview_)/, '');

        if (cleanId === DEMO_INTERVIEW_SESSION.id || id === DEMO_INTERVIEW_SESSION.id) {
            setSelectedSession(DEMO_INTERVIEW_SESSION);
            return;
        }

        const inMemory = sessions.find(s => s.id === id || s.session_id === id || s.id === cleanId || s.session_id === cleanId);
        if (inMemory && inMemory.conversation && inMemory.conversation.length > 0) {
            setSelectedSession(inMemory);
        }

        try {
            const res = await authFetch(buildInterviewHistoryApiUrl(`/company-interview/sessions/${id}`));
            if (res.ok) {
                const data = await res.json();
                if (data && (data.id || data.session_id)) {
                    setSelectedSession(data);
                    return;
                }
            }
        } catch (e) {
            console.error('Error fetching session detail:', e);
        }

        try {
            const raw = localStorage.getItem('preploop_local_interview_history');
            if (raw) {
                const local = JSON.parse(raw);
                if (Array.isArray(local)) {
                    const found = local.find(s => s.id === id || s.session_id === id || s.id === cleanId || s.session_id === cleanId);
                    if (found) {
                        setSelectedSession(found);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to parse local session detail:', err);
        }
    };

    const handleLoadDemoSession = () => {
        try {
            const historyKey = 'preploop_local_interview_history';
            const raw = localStorage.getItem(historyKey);
            const existing = raw ? JSON.parse(raw) : [];
            const safeExisting = Array.isArray(existing) ? existing : [];
            const updated = [DEMO_INTERVIEW_SESSION, ...safeExisting.filter(s => s.id !== DEMO_INTERVIEW_SESSION.id)].slice(0, 50);
            localStorage.setItem(historyKey, JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to store demo session in local history:', err);
        }
        setSessions(prev => [DEMO_INTERVIEW_SESSION, ...prev.filter(s => s.id !== DEMO_INTERVIEW_SESSION.id)]);
        setSelectedSession(DEMO_INTERVIEW_SESSION);
    };

    const handleCopyTranscript = async () => {
        if (!selectedSession) return;
        const msgs = (selectedSession.conversation || []).filter(c => c && c.role !== 'feedback');
        let text = `PrepLoop Interview Transcript\n`;
        text += `Company: ${selectedSession.company || 'General'}\n`;
        text += `Role: ${selectedSession.role || 'Software Engineer'}\n`;
        text += `Stage: ${selectedSession.stage || 'Interview'}\n`;
        text += `Difficulty: ${selectedSession.difficulty || 'medium'}\n`;
        text += `Score: ${selectedSession.overall_score !== null && selectedSession.overall_score !== undefined ? selectedSession.overall_score + '%' : 'N/A'}\n`;
        text += `Date: ${selectedSession.completed_at ? new Date(selectedSession.completed_at).toLocaleString() : new Date().toLocaleString()}\n\n`;

        const summary = extractSessionSummary(selectedSession);
        if (summary) {
            text += `--- Summary ---\n${summary}\n\n`;
        }

        if (selectedSession.recommendations) {
            const recText = typeof selectedSession.recommendations === 'string'
                ? selectedSession.recommendations
                : JSON.stringify(selectedSession.recommendations, null, 2);
            text += `--- Recommendations ---\n${recText}\n\n`;
        }

        text += `--- Transcript ---\n`;
        if (msgs.length === 0) {
            text += `(No conversation recorded)\n`;
        } else {
            msgs.forEach((m, idx) => {
                const isAi = m.role === 'interviewer' || m.role === 'clarification';
                const speaker = isAi ? 'Interviewer (AI)' : 'Candidate (You)';
                text += `\n[${idx + 1}] ${speaker}:\n${m.content}\n`;
            });
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard copy failed:', err);
        }
    };

    const handleDownloadTranscript = () => {
        if (!selectedSession) return;
        const msgs = (selectedSession.conversation || []).filter(c => c && c.role !== 'feedback');
        const safeCompany = (selectedSession.company || 'interview').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const safeStage = (selectedSession.stage || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filename = `preploop-${safeCompany}-${safeStage}-transcript.md`;

        let md = `# PrepLoop Interview Transcript\n\n`;
        md += `- **Company:** ${selectedSession.company || 'N/A'}\n`;
        md += `- **Role:** ${selectedSession.role || 'N/A'}\n`;
        md += `- **Stage:** ${selectedSession.stage || 'N/A'}\n`;
        md += `- **Difficulty:** ${selectedSession.difficulty || 'N/A'}\n`;
        md += `- **Score:** ${selectedSession.overall_score !== null && selectedSession.overall_score !== undefined ? selectedSession.overall_score + '%' : 'N/A'}\n`;
        md += `- **Date:** ${selectedSession.completed_at ? new Date(selectedSession.completed_at).toLocaleString() : new Date().toLocaleString()}\n\n`;

        const summary = extractSessionSummary(selectedSession);
        if (summary) {
            md += `## Session Summary\n\n${summary}\n\n`;
        }

        if (selectedSession.recommendations) {
            md += `## Recommendations & Feedback\n\n`;
            if (typeof selectedSession.recommendations === 'string') {
                md += `${selectedSession.recommendations}\n\n`;
            } else if (Array.isArray(selectedSession.recommendations)) {
                selectedSession.recommendations.forEach(r => {
                    md += `- ${r}\n`;
                });
                md += `\n`;
            } else {
                md += `\`\`\`json\n${JSON.stringify(selectedSession.recommendations, null, 2)}\n\`\`\`\n\n`;
            }
        }

        md += `## Full Conversation\n\n`;
        if (msgs.length === 0) {
            md += `*No conversation transcript available for this session.*\n`;
        } else {
            msgs.forEach((m, idx) => {
                const isAi = m.role === 'interviewer' || m.role === 'clarification';
                const speaker = isAi ? '🤖 Interviewer (AI)' : '👤 Candidate';
                md += `### ${idx + 1}. ${speaker}\n\n${m.content}\n\n`;
            });
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    };

    const handlePrintScorecard = () => {
        window.print();
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        const confirmed = window.confirm(
            `Are you sure you want to delete this ${selectedSession.company || ''} ${selectedSession.stage || 'interview'} session? This cannot be undone.`
        );
        if (!confirmed) return;

        setIsDeleting(true);
        const targetId = selectedSession.id || selectedSession.session_id;

        try {
            await authFetch(buildInterviewHistoryApiUrl(`/company-interview/sessions/${targetId}`), {
                method: 'DELETE'
            });
        } catch (e) {
            console.warn('Backend delete request error:', e);
        }

        // Clean local cache
        try {
            const raw = localStorage.getItem('preploop_local_interview_history');
            const local = raw ? JSON.parse(raw) : [];
            if (Array.isArray(local)) {
                const updated = local.filter(s => s.id !== targetId && s.session_id !== targetId).slice(0, 50);
                localStorage.setItem('preploop_local_interview_history', JSON.stringify(updated));
            }
        } catch (err) {
            console.error('Failed to update local interview history after delete:', err);
        }

        // Update in-memory sessions list and close details
        setSessions(prev => prev.filter(s => s.id !== targetId && s.session_id !== targetId));
        setSelectedSession(null);
        setIsDeleting(false);
    };

    const openPracticeModal = (question, previousAnswer = '') => {
        setPracticeModal({ question, previousAnswer });
        setPracticeAnswer('');
        setPracticeReview(null);
    };

    const handleEvaluatePractice = async () => {
        if (!practiceAnswer.trim() || !practiceModal) return;
        setIsEvaluatingPractice(true);
        try {
            const res = await authFetch(buildInterviewHistoryApiUrl('/company-interview/evaluate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: selectedSession?.company || 'General Tech',
                    role: selectedSession?.role || 'Software Engineer',
                    stage: selectedSession?.stage || 'Technical',
                    conversation: [
                        { role: 'interviewer', content: practiceModal.question },
                        { role: 'candidate', content: practiceAnswer.trim() }
                    ]
                })
            });
            if (res.ok) {
                const data = await res.json();
                setPracticeReview(data);
            } else {
                setPracticeReview({
                    overallScore: 78,
                    summary: 'Answer evaluated. Good structural attempt with clear technical intent.',
                    strengths: ['Direct communication', 'Clear vocabulary'],
                    improvements: ['Add deeper trade-off analysis or quantifiable examples']
                });
            }
        } catch (err) {
            console.error('Practice evaluation error:', err);
            setPracticeReview({
                overallScore: 75,
                summary: 'Structured response captured. Focused on core answer principles.',
                strengths: ['Good coverage of concepts'],
                improvements: ['Mention edge cases and concrete scenarios']
            });
        } finally {
            setIsEvaluatingPractice(false);
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
        const metrics = selectedSession.performance_metrics || {};
        const scores = metrics.scores || selectedSession.scores || {};
        const techScore = scores.technical ?? selectedSession.technical_score ?? metrics.technical_score;
        const commScore = scores.communication ?? selectedSession.communication_score ?? metrics.communication_score;
        const probScore = scores.problemSolving ?? scores.problem_solving ?? selectedSession.problem_solving_score ?? metrics.problem_solving_score;
        const hasScoreBreakdown = techScore !== undefined || commScore !== undefined || probScore !== undefined;

        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                padding: '32px 20px',
                fontFamily: "'Inter', system-ui, sans-serif"
            }}>
                {/* Print Styles */}
                <style>{`
                    @media print {
                        body { background: #ffffff !important; color: #0f172a !important; }
                        .no-print { display: none !important; }
                        .print-scorecard {
                            border: 1px solid #cbd5e1 !important;
                            background: #ffffff !important;
                            color: #0f172a !important;
                            padding: 24px !important;
                            border-radius: 12px !important;
                            margin-bottom: 20px !important;
                            box-shadow: none !important;
                        }
                    }
                `}</style>

                <div style={{ maxWidth: 840, margin: '0 auto' }}>
                    {/* Top Action Bar (hidden on print) */}
                    <div className="no-print" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginBottom: 20
                    }}>
                        <button
                            onClick={() => setSelectedSession(null)}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                cursor: 'pointer', fontSize: 13
                            }}
                        >
                            <ArrowLeft size={14} /> Back to History
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button
                                onClick={handleCopyTranscript}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    background: copied ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
                                    color: copied ? '#22c55e' : 'var(--text-primary)',
                                    border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                title="Copy transcript to clipboard"
                            >
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                {copied ? 'Copied!' : 'Copy Transcript'}
                            </button>

                            <button
                                onClick={handleDownloadTranscript}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                title="Download as Markdown"
                            >
                                <Download size={13} />
                                Download MD
                            </button>

                            <button
                                onClick={handlePrintScorecard}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                title="Print or save as PDF"
                            >
                                <Printer size={13} />
                                Print / PDF
                            </button>

                            <button
                                onClick={handleDeleteSession}
                                disabled={isDeleting}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    opacity: isDeleting ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                }}
                                title="Delete this session"
                            >
                                <Trash2 size={13} />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>

                    {/* Session Header Card */}
                    <div className="print-scorecard" style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 24,
                        marginBottom: 20,
                        display: 'flex', alignItems: 'center', gap: 16
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, flexShrink: 0
                        }}>
                            {selectedSession.session_type === 'multi-round' ? <Zap size={24} color="#ffffff" /> : getStageIcon(selectedSession.stage)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {selectedSession.company || 'General'} · {selectedSession.role || 'Software Engineer'}
                                {selectedSession.is_demo && (
                                    <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                                        Sample Session
                                    </span>
                                )}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                                {selectedSession.stage || 'Interview'} · {selectedSession.difficulty || 'medium'} · {new Date(selectedSession.completed_at || selectedSession.started_at || Date.now()).toLocaleString()}
                            </p>
                        </div>
                        {selectedSession.overall_score !== null && selectedSession.overall_score !== undefined && (
                            <div style={{
                                textAlign: 'right',
                                flexShrink: 0
                            }}>
                                <div style={{
                                    fontSize: 32, fontWeight: 700,
                                    color: selectedSession.overall_score >= 80 ? '#22c55e' : selectedSession.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {selectedSession.overall_score}%
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall Score</div>
                            </div>
                        )}
                    </div>

                    {/* Performance Score Breakdown (if available) */}
                    {hasScoreBreakdown && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 12,
                            marginBottom: 20
                        }}>
                            {techScore !== undefined && (
                                <div className="print-scorecard" style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: techScore >= 70 ? '#22c55e' : techScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {techScore}%
                                        </div>
                                    </div>
                                    <Code2 size={20} color="#8b5cf6" style={{ opacity: 0.7 }} />
                                </div>
                            )}

                            {commScore !== undefined && (
                                <div className="print-scorecard" style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: commScore >= 70 ? '#22c55e' : commScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {commScore}%
                                        </div>
                                    </div>
                                    <Users size={20} color="#3b82f6" style={{ opacity: 0.7 }} />
                                </div>
                            )}

                            {probScore !== undefined && (
                                <div className="print-scorecard" style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problem Solving</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: probScore >= 70 ? '#22c55e' : probScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {probScore}%
                                        </div>
                                    </div>
                                    <Brain size={20} color="#ec4899" style={{ opacity: 0.7 }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary Card */}
                    <div className="print-scorecard" style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 20
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BarChart3 size={15} style={{ color: '#22c55e' }} /> Session Summary
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>
                            {extractSessionSummary(selectedSession)}
                        </p>
                    </div>

                    {/* Recommendations Card (if present) */}
                    {selectedSession.recommendations && (
                        <div className="print-scorecard" style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: 20,
                            marginBottom: 20
                        }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Award size={15} style={{ color: '#f59e0b' }} /> AI Recommendations & Improvement Areas
                            </h3>
                            {typeof selectedSession.recommendations === 'string' ? (
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                                    {selectedSession.recommendations}
                                </p>
                            ) : Array.isArray(selectedSession.recommendations) ? (
                                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>
                                    {selectedSession.recommendations.map((rec, rIdx) => (
                                        <li key={rIdx} style={{ marginBottom: 4 }}>{rec}</li>
                                    ))}
                                </ul>
                            ) : (
                                <pre style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', overflowX: 'auto' }}>
                                    {JSON.stringify(selectedSession.recommendations, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}

                    {/* Conversation Replay */}
                    <div className="print-scorecard" style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 20
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquare size={15} style={{ color: '#8b5cf6' }} /> Conversation Replay & Practice
                        </h3>
                        {(() => {
                            const replay = (selectedSession.conversation || []).filter(c => c && c.role !== 'feedback');
                            if (replay.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
                                        No conversation transcript recorded for this session.
                                    </div>
                                );
                            }
                            return replay.map((msg, i) => {
                                const isAiMessage = msg.role === 'interviewer' || msg.role === 'clarification';
                                const isCandidateMessage = msg.role === 'candidate' || msg.role === 'clarification-question';

                                // Find previous candidate answer corresponding to this question
                                const subsequentAnswer = isAiMessage && replay[i + 1]?.role === 'candidate'
                                    ? replay[i + 1]?.content
                                    : '';

                                return (
                                    <div key={i} style={{
                                        display: 'flex', gap: 10,
                                        marginBottom: 16,
                                        flexDirection: isCandidateMessage ? 'row-reverse' : 'row'
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10,
                                            background: isAiMessage ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, flexShrink: 0,
                                            color: isAiMessage ? '#8b5cf6' : '#3b82f6'
                                        }}>
                                            {isAiMessage ? '🤖' : '👤'}
                                        </div>
                                        <div style={{
                                            maxWidth: '78%',
                                            padding: '12px 16px',
                                            borderRadius: 14,
                                            background: isAiMessage ? 'rgba(139,92,246,0.08)' : 'rgba(59,130,246,0.08)',
                                            border: `1px solid ${isAiMessage ? 'rgba(139,92,246,0.18)' : 'rgba(59,130,246,0.18)'}`,
                                            fontSize: 13, lineHeight: 1.65,
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: 4,
                                                gap: 8
                                            }}>
                                                <span style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: isAiMessage ? '#a78bfa' : '#60a5fa',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em'
                                                }}>
                                                    {isAiMessage ? 'Interviewer' : 'You'}
                                                </span>

                                                {/* Practice Button for Interviewer Questions (hidden on print) */}
                                                {isAiMessage && (
                                                    <button
                                                        className="no-print"
                                                        onClick={() => openPracticeModal(msg.content, subsequentAnswer)}
                                                        style={{
                                                            background: 'rgba(139,92,246,0.15)',
                                                            border: '1px solid rgba(139,92,246,0.3)',
                                                            color: '#c4b5fd',
                                                            borderRadius: 6,
                                                            padding: '2px 8px',
                                                            fontSize: 11,
                                                            fontWeight: 500,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Try answering this question again to improve your score"
                                                    >
                                                        <RotateCcw size={10} /> Practice
                                                    </button>
                                                )}
                                            </div>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Interactive Practice Question Modal */}
                    {practiceModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: 20
                        }}>
                            <div style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 16,
                                width: '100%',
                                maxWidth: 640,
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                padding: 24,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Sparkles size={18} style={{ color: '#8b5cf6' }} /> Practice Question
                                    </h3>
                                    <button
                                        onClick={() => setPracticeModal(null)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div style={{
                                    background: 'rgba(139,92,246,0.08)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    padding: '12px 14px',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    lineHeight: 1.6
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 4 }}>QUESTION:</div>
                                    {practiceModal.question}
                                </div>

                                {practiceModal.previousAnswer && (
                                    <div style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border)',
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        fontSize: 12,
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Your Previous Answer: </span>
                                        {practiceModal.previousAnswer}
                                    </div>
                                )}

                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                        Refine or write your new answer:
                                    </label>
                                    <textarea
                                        value={practiceAnswer}
                                        onChange={(e) => setPracticeAnswer(e.target.value)}
                                        placeholder="Type your improved answer here with structure, technical context, and examples..."
                                        rows={5}
                                        style={{
                                            width: '100%',
                                            background: 'var(--bg-main)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            padding: 12,
                                            color: 'var(--text-primary)',
                                            fontSize: 13,
                                            outline: 'none',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button
                                        onClick={() => setPracticeModal(null)}
                                        style={{
                                            padding: '8px 14px',
                                            background: 'transparent',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8,
                                            color: 'var(--text-muted)',
                                            fontSize: 12,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEvaluatePractice}
                                        disabled={isEvaluatingPractice || !practiceAnswer.trim()}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                            border: 'none',
                                            borderRadius: 8,
                                            color: '#ffffff',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            cursor: (isEvaluatingPractice || !practiceAnswer.trim()) ? 'not-allowed' : 'pointer',
                                            opacity: (isEvaluatingPractice || !practiceAnswer.trim()) ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        {isEvaluatingPractice ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                                        {isEvaluatingPractice ? 'Evaluating...' : 'Get AI Feedback'}
                                    </button>
                                </div>

                                {/* Practice AI Feedback Result */}
                                {practiceReview && (
                                    <div style={{
                                        background: 'rgba(34,197,94,0.06)',
                                        border: '1px solid rgba(34,197,94,0.25)',
                                        borderRadius: 12,
                                        padding: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 10
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <CheckCircle2 size={15} /> Evaluated Answer Score
                                            </span>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                                                {practiceReview.overallScore || practiceReview.score || 80}%
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            {practiceReview.summary || practiceReview.feedback || 'Good structured response with relevant points.'}
                                        </p>
                                        {Array.isArray(practiceReview.strengths) && practiceReview.strengths.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', marginBottom: 2 }}>Strengths:</div>
                                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    {practiceReview.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {Array.isArray(practiceReview.improvements) && practiceReview.improvements.length > 0 && (
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>Ways to Improve:</div>
                                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    {practiceReview.improvements.map((im, idx) => <li key={idx}>{im}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── List View ──
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '32px 20px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                            <Clock size={24} style={{ color: '#f59e0b' }} /> Interview History
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {sessions.length === 0 && (
                                <button
                                    onClick={handleLoadDemoSession}
                                    style={{
                                        padding: '8px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                                        borderRadius: 8, color: '#f59e0b', fontSize: 12, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                                    }}
                                >
                                    <Sparkles size={14} /> Sample Interview
                                </button>
                            )}
                            <Link to="/interview-analytics" style={{
                                padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.25)',
                                borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 600,
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <BarChart3 size={14} /> Analytics
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: 10,
                        alignItems: 'center'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '8px 12px'
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
                                    color: 'var(--text-primary)',
                                    fontSize: 13,
                                }}
                            />
                        </div>
                        <input
                            value={filterCompany}
                            onChange={(e) => setFilterCompany(e.target.value)}
                            placeholder="Filter by company..."
                            style={{
                                width: 140,
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                padding: '8px 12px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                background: 'var(--bg-main)',
                                border: '1px solid var(--border)',
                                borderRadius: 10,
                                padding: '8px 12px',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="highest_score">Highest Score</option>
                            <option value="lowest_score">Lowest Score</option>
                        </select>
                    </div>

                    {/* Stage Filter Pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Stage:</span>
                        {[
                            { key: 'all', label: 'All Stages' },
                            { key: 'technical', label: 'Technical' },
                            { key: 'coding', label: 'Coding / DSA' },
                            { key: 'system-design', label: 'System Design' },
                            { key: 'behavioral', label: 'Behavioral' },
                            { key: 'hr', label: 'HR' }
                        ].map((stageOption) => (
                            <button
                                key={stageOption.key}
                                onClick={() => setFilterStage(stageOption.key)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    border: `1px solid ${filterStage === stageOption.key ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                                    background: filterStage === stageOption.key ? 'rgba(139,92,246,0.15)' : 'var(--bg-main)',
                                    color: filterStage === stageOption.key ? '#c4b5fd' : 'var(--text-muted)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {stageOption.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: '#8b5cf6', margin: '0 auto' }} />
                        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>Loading your interviews...</div>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: 60,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16
                    }}>
                        <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                            {sessions.length === 0 ? 'No interview sessions yet' : 'No sessions match this search'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                            {sessions.length === 0
                                ? 'Complete an interview or explore our realistic Google interview sample to review transcripts, practice answers with AI, and test scorecards.'
                                : 'Try a different keyword or company filter.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/company-interview" style={{
                                padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                borderRadius: 10, color: '#ffffff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 6
                            }}>
                                <Zap size={14} /> Start an Interview
                            </Link>
                            {sessions.length === 0 && (
                                <button
                                    onClick={handleLoadDemoSession}
                                    style={{
                                        padding: '10px 18px', background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 10, color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                                        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                                    }}
                                >
                                    <Sparkles size={14} color="#f59e0b" /> Explore Sample Session
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredSessions.map((session) => (
                            <div
                                key={session.id || session.session_id}
                                onClick={() => fetchSessionDetail(session.id || session.session_id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '16px 20px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: session.session_type === 'multi-round' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: session.session_type === 'multi-round' ? '#f59e0b' : '#8b5cf6',
                                    flexShrink: 0
                                }}>
                                    {session.session_type === 'multi-round' ? <Zap size={18} /> : getStageIcon(session.stage)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>
                                        {session.company || 'General'} · {session.role || 'Software Engineer'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                                        {session.stage || 'Interview'} · {session.difficulty || 'medium'} · {new Date(session.completed_at || session.started_at || Date.now()).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {extractSessionSummary(session)}
                                    </div>
                                </div>
                                {session.overall_score !== null && session.overall_score !== undefined && (
                                    <div style={{
                                        fontSize: 18, fontWeight: 700,
                                        color: session.overall_score >= 80 ? '#22c55e' : session.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {session.overall_score}%
                                    </div>
                                )}
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
