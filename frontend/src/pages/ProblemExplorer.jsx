import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, ChevronDown, ChevronUp, Check, X,
    Clock, Building2, Tag, BarChart3, Target, Flame,
    ArrowUpDown, CheckCircle2, Circle, AlertCircle,
    ExternalLink, SlidersHorizontal, Bookmark, Shuffle,
    Zap, Star, Sparkles, History, StickyNote,
    ChevronRight, Trophy, BarChart2, Eye, EyeOff,
    ChevronLeft, ListFilter, BookOpen, TrendingUp,
    Lock, MessageSquare, Play, Code2, List
} from 'lucide-react';
import { PROBLEMS, COMPANIES, TOPICS, PATTERNS, getDifficultyCounts } from '../data/problemsDatabase';
import { useTheme } from '../context/ThemeContext';
import { filterAndSortProblems } from '../features/problemExplorer/filtering';
import { ProblemExplorerFiltersPanel } from '../features/problemExplorer/ProblemExplorerFiltersPanel';
import { ProblemExplorerAllQuestionsView } from '../features/problemExplorer/ProblemExplorerAllQuestionsView';
import { ProblemExplorerViewControls } from '../features/problemExplorer/ProblemExplorerViewControls';
import { ProblemExplorerPatternView } from '../features/problemExplorer/ProblemExplorerPatternView';
import { ProblemExplorerNotesModal } from '../features/problemExplorer/ProblemExplorerNotesModal';
import { ProblemExplorerSearchToolbar } from '../features/problemExplorer/ProblemExplorerSearchToolbar';
import { ProblemExplorerInsightsPanels } from '../features/problemExplorer/ProblemExplorerInsightsPanels';
import { PATTERN_CATEGORIES } from '../data/problemExplorerConfig';
import { useDsaPatterns } from '../hooks/useDsaPatterns';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX'];



const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const FREQUENCIES = ['high', 'medium', 'low'];
const TIME_ESTIMATES = [10, 15, 20, 25, 30, 45];

// Daily challenge: deterministic pick based on date
function getDailyChallenge() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    return PROBLEMS[seed % PROBLEMS.length];
}

// Top companies for quick prep
const QUICK_PREP_COMPANIES = ['google', 'amazon', 'meta', 'microsoft', 'apple'];
const ITEMS_PER_PAGE = 30;

// Study plan presets
const STUDY_PLANS = [
    { id: 'top-interview-150', label: '🏆 Interview Top 150', desc: 'LeetCode Top Interview 150', filter: p => p.studyPlans && p.studyPlans.includes('top-interview-150') },
    { id: 'beginner', label: '🌱 Beginner 50', desc: 'Easy problems to build confidence', filter: p => p.difficulty === 'Easy', limit: 50 },
    { id: 'top-medium', label: '🔥 Top Medium', desc: 'Most asked medium problems', filter: p => p.difficulty === 'Medium' && p.frequency === 'high', limit: 50 },
    { id: 'hard-grind', label: '💪 Hard Grind', desc: 'Challenge yourself', filter: p => p.difficulty === 'Hard', limit: 30 },
    { id: 'arrays-strings', label: '📚 Arrays & Strings', desc: 'Foundation topics', filter: p => p.topics.includes('Arrays') || p.topics.includes('Strings'), limit: 50 },
    { id: 'trees-graphs', label: '🌳 Trees & Graphs', desc: 'Tree and graph mastery', filter: p => p.topics.includes('Trees') || p.topics.includes('Graphs'), limit: 40 },
    { id: 'dp-master', label: '🧠 DP Master', desc: 'Dynamic programming focus', filter: p => p.topics.includes('Dynamic Programming'), limit: 45 },
];



// Calculate streak from solved dates
function calcStreak() {
    try {
        const dates = JSON.parse(localStorage.getItem('cl_solve_dates') || '[]');
        if (!dates.length) return 0;
        const unique = [...new Set(dates)].sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        let streak = 0;
        for (let i = 0; i < unique.length; i++) {
            const expected = new Date();
            expected.setDate(expected.getDate() - i);
            const exp = expected.toISOString().slice(0, 10);
            if (unique[i] === exp || (i === 0 && unique[0] === new Date(Date.now() - 86400000).toISOString().slice(0, 10))) {
                streak++;
            } else if (i === 0 && unique[0] !== today) {
                // check if yesterday
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                if (unique[0] === yesterday) { streak = 1; continue; }
                break;
            } else break;
        }
        return streak;
    } catch { return 0; }
}

function getWeekSolved() {
    try {
        const dates = JSON.parse(localStorage.getItem('cl_solve_dates') || '[]');
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().slice(0, 10);
        return dates.filter(d => d >= weekStr).length;
    } catch { return 0; }
}

function useProblemExplorerState() {
    const [search, setSearch] = useState('');
    const [selectedDifficulties, setSelectedDifficulties] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [selectedPatterns, setSelectedPatterns] = useState([]);
    const [selectedFrequency, setSelectedFrequency] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [hideSolved, setHideSolved] = useState(false);
    const [activePlan, setActivePlan] = useState(null);
    const [viewMode, setViewMode] = useState('patterns'); // 'patterns' | 'all'
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(() => {
        try { return parseInt(localStorage.getItem('cl_weekly_goal') || '7'); } catch { return 7; }
    });
    const [showGoalEdit, setShowGoalEdit] = useState(false);
    const [showTopicMastery, setShowTopicMastery] = useState(false);
    const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
    const [activeNote, setActiveNote] = useState(null); // problemId being edited
    const [noteText, setNoteText] = useState('');
    const [expandedPatterns, setExpandedPatterns] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [expandedSubPatterns, setExpandedSubPatterns] = useState({});
    const [solvedSet, setSolvedSet] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('cl_solved') || '[]')); } catch { return new Set(); }
    });
    const [bookmarks, setBookmarks] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('cl_bookmarks') || '[]')); } catch { return new Set(); }
    });
    const [notes, setNotes] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cl_notes') || '{}'); } catch { return {}; }
    });
    const [recentlyViewed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cl_recent') || '[]'); } catch { return []; }
    });

    return {
        search,
        setSearch,
        selectedDifficulties,
        setSelectedDifficulties,
        selectedTopics,
        setSelectedTopics,
        selectedCompanies,
        setSelectedCompanies,
        selectedPatterns,
        setSelectedPatterns,
        selectedFrequency,
        setSelectedFrequency,
        maxTime,
        setMaxTime,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        showFilters,
        setShowFilters,
        showBookmarksOnly,
        setShowBookmarksOnly,
        hideSolved,
        setHideSolved,
        activePlan,
        setActivePlan,
        viewMode,
        setViewMode,
        page,
        setPage,
        isLoading,
        setIsLoading,
        initialLoading,
        setInitialLoading,
        weeklyGoal,
        setWeeklyGoal,
        showGoalEdit,
        setShowGoalEdit,
        showTopicMastery,
        setShowTopicMastery,
        showRecentlyViewed,
        setShowRecentlyViewed,
        activeNote,
        setActiveNote,
        noteText,
        setNoteText,
        expandedPatterns,
        setExpandedPatterns,
        expandedCategories,
        setExpandedCategories,
        expandedSubPatterns,
        setExpandedSubPatterns,
        solvedSet,
        setSolvedSet,
        bookmarks,
        setBookmarks,
        notes,
        setNotes,
        recentlyViewed,
    };
}

export default function ProblemExplorer() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const {
        search,
        setSearch,
        selectedDifficulties,
        setSelectedDifficulties,
        selectedTopics,
        setSelectedTopics,
        selectedCompanies,
        setSelectedCompanies,
        selectedPatterns,
        setSelectedPatterns,
        selectedFrequency,
        setSelectedFrequency,
        maxTime,
        setMaxTime,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        showFilters,
        setShowFilters,
        showBookmarksOnly,
        setShowBookmarksOnly,
        hideSolved,
        setHideSolved,
        activePlan,
        setActivePlan,
        viewMode,
        setViewMode,
        page,
        setPage,
        isLoading,
        setIsLoading,
        initialLoading,
        setInitialLoading,
        weeklyGoal,
        setWeeklyGoal,
        showGoalEdit,
        setShowGoalEdit,
        showTopicMastery,
        setShowTopicMastery,
        showRecentlyViewed,
        setShowRecentlyViewed,
        activeNote,
        setActiveNote,
        noteText,
        setNoteText,
        expandedPatterns,
        setExpandedPatterns,
        expandedCategories,
        setExpandedCategories,
        expandedSubPatterns,
        setExpandedSubPatterns,
        solvedSet,
        setSolvedSet,
        bookmarks,
        setBookmarks,
        notes,
        setNotes,
        recentlyViewed,
    } = useProblemExplorerState();

    const dailyChallenge = useMemo(() => getDailyChallenge(), []);
    const streak = useMemo(() => calcStreak(), []);
    const weekSolved = useMemo(() => getWeekSolved(), []);

    const dsaPatterns = useDsaPatterns(solvedSet);

    // Simulate smooth initial loading
    useEffect(() => {
        const timer = setTimeout(() => setInitialLoading(false), 700);
        return () => clearTimeout(timer);
    }, []);

    const toggleListItem = (list, setter, item) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const toggleBookmark = useCallback((e, problemId) => {
        e.stopPropagation();
        setBookmarks(prev => {
            const next = new Set(prev);
            if (next.has(problemId)) next.delete(problemId);
            else next.add(problemId);
            localStorage.setItem('cl_bookmarks', JSON.stringify([...next]));
            return next;
        });
    }, []);





    const saveNote = useCallback((problemId, text) => {
        setNotes(prev => {
            const next = { ...prev };
            if (text.trim()) next[problemId] = text.trim();
            else delete next[problemId];
            localStorage.setItem('cl_notes', JSON.stringify(next));
            return next;
        });
        setActiveNote(null);
    }, []);

    const openNote = useCallback((e, problemId) => {
        e.stopPropagation();
        setActiveNote(problemId);
        setNoteText(notes[problemId] || '');
    }, [notes]);

    // Track recently viewed when navigating
    const goToProblem = useCallback((problemId) => {
        const recent = JSON.parse(localStorage.getItem('cl_recent') || '[]');
        const updated = [problemId, ...recent.filter(id => id !== problemId)].slice(0, 10);
        localStorage.setItem('cl_recent', JSON.stringify(updated));
        navigate(`/code-editor/${problemId}`);
    }, [navigate]);

    const filteredProblems = useMemo(() => {
        return filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks,
            solvedSet,
            filters: {
                showBookmarksOnly,
                hideSolved,
                activePlan,
                search,
                selectedDifficulties,
                selectedTopics,
                selectedCompanies,
                selectedPatterns,
                selectedFrequency,
                maxTime,
                sortBy,
                sortDir,
            },
        });
    }, [search, selectedDifficulties, selectedTopics, selectedCompanies, selectedPatterns, selectedFrequency, maxTime, sortBy, sortDir, showBookmarksOnly, hideSolved, activePlan, bookmarks, solvedSet]);

    const diffCounts = getDifficultyCounts();
    const activeFilterCount = selectedDifficulties.length + selectedTopics.length + selectedCompanies.length + selectedPatterns.length + (selectedFrequency ? 1 : 0) + (maxTime ? 1 : 0);

    // Auto-switch to "All Questions" when any filter is active
    useEffect(() => {
        if (activeFilterCount > 0 || search || activePlan) {
            setViewMode('all');
        }
    }, [activeFilterCount, search, activePlan]);

    const clearAll = () => {
        setSelectedDifficulties([]);
        setSelectedTopics([]);
        setSelectedCompanies([]);
        setSelectedPatterns([]);
        setSelectedFrequency('');
        setMaxTime('');
        setSearch('');
        setShowBookmarksOnly(false);
        setHideSolved(false);
        setActivePlan(null);
        setPage(1);
    };

    const handleSort = (key) => {
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('asc'); }
    };

    const diffColor = (d) => d === 'Easy' ? '#6ee7b7' : d === 'Medium' ? '#fbbf24' : '#f87171';
    const freqColor = (f) => f === 'high' ? '#f87171' : f === 'medium' ? '#fbbf24' : '#6ee7b7';

    const getExplanationSnippet = useCallback((problem) => {
        const base = (problem.explanation || problem.description || '').trim();
        if (!base) return 'No explanation available yet.';
        return base.length > 140 ? `${base.slice(0, 137)}...` : base;
    }, []);

    const pickRandom = () => {
        const pool = filteredProblems.length > 0 ? filteredProblems : PROBLEMS;
        const random = pool[Math.floor(Math.random() * pool.length)];
        goToProblem(random.id);
    };

    // Quick company prep
    const quickPrep = (companyId) => {
        setSelectedCompanies([companyId]);
        setSelectedDifficulties([]);
        setSelectedTopics([]);
        setSelectedPatterns([]);
        setSelectedFrequency('');
        setMaxTime('');
        setSearch('');
        setShowBookmarksOnly(false);
        setHideSolved(false);
        setActivePlan(null);
        setPage(1);
    };

    // Topic mastery data
    const topicMastery = useMemo(() => {
        return TOPICS.map(topic => {
            const topicProblems = PROBLEMS.filter(p => p.topics.includes(topic));
            const solved = topicProblems.filter(p => solvedSet.has(p.id)).length;
            return { topic, total: topicProblems.length, solved, percent: topicProblems.length > 0 ? Math.round((solved / topicProblems.length) * 100) : 0 };
        }).sort((a, b) => b.total - a.total);
    }, [solvedSet]);

    // Progress calculations
    const solvedCount = solvedSet.size;
    const totalCount = PROBLEMS.length;
    const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
    const solvedInFiltered = filteredProblems.filter(p => solvedSet.has(p.id)).length;

    // Recently viewed problems
    const recentProblems = useMemo(() => {
        return recentlyViewed.map(id => PROBLEMS.find(p => p.id === id)).filter(Boolean).slice(0, 5);
    }, [recentlyViewed]);

    return (
        <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'} selection:bg-purple-500/30`} style={{ scrollBehavior: 'smooth' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.06), transparent 70%)' : 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.10), transparent 70%)' }} />
            <style>{`
                @keyframes shimmer-border { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
                @keyframes fade-up-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes skeleton-pulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.08; } }
            `}</style>

            <ProblemExplorerNotesModal
                activeNote={activeNote}
                setActiveNote={setActiveNote}
                isLight={isLight}
                problems={PROBLEMS}
                noteText={noteText}
                setNoteText={setNoteText}
                saveNote={saveNote}
            />

            <div className="max-w-7xl mx-auto px-6 py-8 pt-24 relative z-10">
                {/* Header */}
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{
                            fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            background: 'linear-gradient(135deg, #c084fc, #a78bfa, #67e8f9, #6ee7b7)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            textShadow: 'none',
                        }}>Problem Explorer</h1>
                        <p style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', animation: 'pulse-glow 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(110,231,183,0.4)' }} />
                            {PROBLEMS.length} original problems • {TOPICS.length} topics • {COMPANIES.length} companies
                        </p>
                    </div>
                    <button onClick={pickRandom} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                        background: isLight ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(110,231,183,0.08))' : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(110,231,183,0.1))',
                        border: isLight ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.25)', color: isLight ? '#7c3aed' : '#e9d5ff',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
                        boxShadow: '0 0 15px rgba(139,92,246,0.08)',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(110,231,183,0.15))'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(139,92,246,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(110,231,183,0.1))'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(139,92,246,0.08)'; }}
                    >
                        <Shuffle size={16} />
                        Surprise Me
                    </button>
                </div>

                {/* Stats Bar */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    {DIFFICULTIES.map(d => (
                        <div key={d} style={{
                            padding: '8px 14px', borderRadius: 12,
                            background: `${diffColor(d)}08`, border: `1px solid ${diffColor(d)}20`,
                            display: 'flex', alignItems: 'center', gap: 6,
                            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                            boxShadow: `0 0 12px ${diffColor(d)}08, inset 0 1px 0 rgba(255,255,255,0.04)`,
                            transition: 'all 0.25s ease', cursor: 'default',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${diffColor(d)}15, inset 0 1px 0 rgba(255,255,255,0.06)`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 0 12px ${diffColor(d)}08, inset 0 1px 0 rgba(255,255,255,0.04)`; }}
                        >
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: diffColor(d), boxShadow: `0 0 6px ${diffColor(d)}60` }} />
                            <span style={{ fontSize: 13, color: diffColor(d), fontWeight: 700 }}>{diffCounts[d]}</span>
                            <span style={{ fontSize: 12, color: isLight ? '#475569' : 'rgba(255,255,255,0.4)' }}>{d}</span>
                        </div>
                    ))}

                    {/* Progress Ring */}
                    <div style={{
                        padding: '8px 14px', borderRadius: 12,
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 0 12px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                        transition: 'all 0.25s ease',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'; }}
                    >
                        <div style={{ position: 'relative', width: 28, height: 28 }}>
                            <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="14" cy="14" r="11" stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="3" fill="none" />
                                <circle cx="14" cy="14" r="11" stroke="url(#progressGrad)" strokeWidth="3" fill="none"
                                    strokeDasharray={`${2 * Math.PI * 11}`}
                                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - progressPercent / 100)}`}
                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 3px rgba(167,139,250,0.4))' }} />
                                <defs><linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#6ee7b7" /></linearGradient></defs>
                            </svg>
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#a78bfa' }}>
                                {progressPercent}%
                            </span>
                        </div>
                        <div>
                            <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 700 }}>{solvedCount}</span>
                            <span style={{ fontSize: 12, color: isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>/{totalCount}</span>
                        </div>
                    </div>

                    {/* Bookmarks Toggle */}
                    <button onClick={() => setShowBookmarksOnly(b => !b)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showBookmarksOnly ? 'rgba(251,191,36,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: showBookmarksOnly ? '1px solid rgba(251,191,36,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Bookmark size={14} color={showBookmarksOnly ? '#fbbf24' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} fill={showBookmarksOnly ? '#fbbf24' : 'none'} />
                        <span style={{ fontSize: 13, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#475569' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{bookmarks.size}</span>
                        <span style={{ fontSize: 12, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Saved</span>
                    </button>

                    {/* Streak Badge */}
                    <div style={{
                        padding: '8px 14px', borderRadius: 10,
                        background: streak > 0 ? 'rgba(251,146,60,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: streak > 0 ? '1px solid rgba(251,146,60,0.25)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Flame size={14} color={streak > 0 ? '#fb923c' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)'} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: streak > 0 ? '#fb923c' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)' }}>{streak}</span>
                        <span style={{ fontSize: 11, color: streak > 0 ? 'rgba(251,146,60,0.7)' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.25)' }}>Streak</span>
                    </div>

                    {/* Weekly Goal */}
                    <div onClick={() => setShowGoalEdit(g => !g)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(103,232,249,0.06)', border: '1px solid rgba(103,232,249,0.15)',
                        display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
                    }}>
                        <Target size={14} color='#67e8f9' />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 10, color: 'rgba(103,232,249,0.7)' }}>Week Goal</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 50, height: 4, borderRadius: 2, background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, (weekSolved / weeklyGoal) * 100)}%`, height: '100%', background: weekSolved >= weeklyGoal ? '#6ee7b7' : '#67e8f9', borderRadius: 2, transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: weekSolved >= weeklyGoal ? '#6ee7b7' : '#67e8f9' }}>{weekSolved}/{weeklyGoal}</span>
                            </div>
                        </div>
                        {showGoalEdit && (
                            <div onClick={e => e.stopPropagation()} style={{
                                position: 'absolute', top: '110%', left: 0, zIndex: 20, padding: 12, borderRadius: 10,
                                background: isLight ? '#fff' : 'rgba(15,15,25,0.97)', border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(103,232,249,0.2)',
                                display: 'flex', alignItems: 'center', gap: 6, boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.1)' : '0 8px 24px rgba(0,0,0,0.5)',
                            }}>
                                <span style={{ fontSize: 11, color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)' }}>Goal:</span>
                                {[3, 5, 7, 10, 15].map(g => (
                                    <button key={g} onClick={() => { setWeeklyGoal(g); localStorage.setItem('cl_weekly_goal', String(g)); setShowGoalEdit(false); }} style={{
                                        padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                        background: weeklyGoal === g ? 'rgba(103,232,249,0.2)' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                        border: weeklyGoal === g ? '1px solid rgba(103,232,249,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
                                        color: weeklyGoal === g ? (isLight ? '#0891b2' : '#67e8f9') : isLight ? '#475569' : 'rgba(255,255,255,0.4)',
                                    }}>{g}/wk</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Topic Mastery Toggle */}
                    <button onClick={() => setShowTopicMastery(t => !t)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showTopicMastery ? 'rgba(103,232,249,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: showTopicMastery ? '1px solid rgba(103,232,249,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <BarChart2 size={14} color={showTopicMastery ? '#67e8f9' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} />
                        <span style={{ fontSize: 12, color: showTopicMastery ? (isLight ? '#0891b2' : '#67e8f9') : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Mastery</span>
                    </button>

                    {/* Recently Viewed Toggle */}
                    {recentProblems.length > 0 && (
                        <button onClick={() => setShowRecentlyViewed(r => !r)} style={{
                            padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                            background: showRecentlyViewed ? 'rgba(139,92,246,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                            border: showRecentlyViewed ? '1px solid rgba(139,92,246,0.3)' : isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <History size={14} color={showRecentlyViewed ? '#a78bfa' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} />
                            <span style={{ fontSize: 12, color: showRecentlyViewed ? '#a78bfa' : isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}>Recent</span>
                        </button>
                    )}
                </div>

                <ProblemExplorerInsightsPanels
                    showTopicMastery={showTopicMastery}
                    isLight={isLight}
                    topicMastery={topicMastery}
                    setSelectedTopics={setSelectedTopics}
                    setShowTopicMastery={setShowTopicMastery}
                    showRecentlyViewed={showRecentlyViewed}
                    recentProblems={recentProblems}
                    goToProblem={goToProblem}
                    diffColor={diffColor}
                />

                {/* Company Quick Prep */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 4 }}>Quick Prep:</span>
                    {QUICK_PREP_COMPANIES.map(cId => {
                        const comp = COMPANIES.find(c => c.id === cId);
                        if (!comp) return null;
                        const isActive = selectedCompanies.length === 1 && selectedCompanies[0] === cId;
                        return (
                            <button key={cId} onClick={() => isActive ? clearAll() : quickPrep(cId)} style={{
                                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                background: isActive ? `${comp.color}20` : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
                                border: isActive ? `1px solid ${comp.color}40` : isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.06)',
                                color: isActive ? comp.color : isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.15s',
                            }}>
                                {comp.name}
                            </button>
                        );
                    })}
                </div>

                {/* Daily Challenge */}
                <div
                    onClick={() => goToProblem(dailyChallenge.id)}
                    style={{
                        marginBottom: 16, padding: '14px 22px', borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.08))',
                        border: '1px solid rgba(251,191,36,0.2)',
                        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(251,191,36,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(139,92,246,0.12))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(251,191,36,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.08))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(251,191,36,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'; }}
                >
                    {/* Animated shimmer overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.04) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer-border 4s ease infinite', pointerEvents: 'none' }} />
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))',
                        border: '1px solid rgba(251,191,36,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        boxShadow: '0 0 12px rgba(251,191,36,0.15)',
                    }}>
                        <Sparkles size={17} color="#fbbf24" style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Challenge</span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, color: diffColor(dailyChallenge.difficulty),
                                padding: '1px 5px', borderRadius: 3, background: `${diffColor(dailyChallenge.difficulty)}15`,
                            }}>{dailyChallenge.difficulty}</span>
                            {solvedSet.has(dailyChallenge.id) && (
                                <span style={{ fontSize: 9, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                                    <CheckCircle2 size={10} /> Done
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#1e293b' : '#fff' }}>{dailyChallenge.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {dailyChallenge.topics.slice(0, 2).map(t => (
                            <span key={t} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#c084fc', fontWeight: 600 }}>{t}</span>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <Clock size={11} />{dailyChallenge.timeEstimate}m
                    </div>
                </div>

                <ProblemExplorerSearchToolbar
                    search={search}
                    setSearch={setSearch}
                    isLight={isLight}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    activeFilterCount={activeFilterCount}
                />

                {/* Filters Panel */}
                <ProblemExplorerFiltersPanel
                    showFilters={showFilters}
                    isLight={isLight}
                    activeFilterCount={activeFilterCount}
                    clearAll={clearAll}
                    difficulties={DIFFICULTIES}
                    selectedDifficulties={selectedDifficulties}
                    setSelectedDifficulties={setSelectedDifficulties}
                    topics={TOPICS}
                    selectedTopics={selectedTopics}
                    setSelectedTopics={setSelectedTopics}
                    companies={COMPANIES}
                    selectedCompanies={selectedCompanies}
                    setSelectedCompanies={setSelectedCompanies}
                    patterns={PATTERNS}
                    selectedPatterns={selectedPatterns}
                    setSelectedPatterns={setSelectedPatterns}
                    frequencies={FREQUENCIES}
                    selectedFrequency={selectedFrequency}
                    setSelectedFrequency={setSelectedFrequency}
                    timeEstimates={TIME_ESTIMATES}
                    maxTime={maxTime}
                    setMaxTime={setMaxTime}
                    toggleListItem={toggleListItem}
                    diffColor={diffColor}
                    freqColor={freqColor}
                />

                <ProblemExplorerViewControls
                    isLight={isLight}
                    studyPlans={STUDY_PLANS}
                    activePlan={activePlan}
                    setActivePlan={setActivePlan}
                    setViewMode={setViewMode}
                    setPage={setPage}
                    viewMode={viewMode}
                    filteredCount={filteredProblems.length}
                    solvedInFiltered={solvedInFiltered}
                    hideSolved={hideSolved}
                    setHideSolved={setHideSolved}
                />

                <ProblemExplorerPatternView
                    viewMode={viewMode}
                    isLight={isLight}
                    dsaPatterns={dsaPatterns}
                    patternCategories={PATTERN_CATEGORIES}
                    problems={PROBLEMS}
                    solvedSet={solvedSet}
                    expandedCategories={expandedCategories}
                    setExpandedCategories={setExpandedCategories}
                    expandedSubPatterns={expandedSubPatterns}
                    setExpandedSubPatterns={setExpandedSubPatterns}
                    search={search}
                    selectedDifficulties={selectedDifficulties}
                    initialLoading={initialLoading}
                    roman={ROMAN}
                    getExplanationSnippet={getExplanationSnippet}
                    onSolveProblem={(problemId) => navigate(`/problem/${problemId}`)}
                />

                {/* ══════════ ALL QUESTIONS VIEW ══════════ */}
                <ProblemExplorerAllQuestionsView
                    viewMode={viewMode}
                    isLight={isLight}
                    filteredProblems={filteredProblems}
                    solvedSet={solvedSet}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    setSortBy={setSortBy}
                    setSortDir={setSortDir}
                    onSolveProblem={(problemId) => navigate(`/problem/${problemId}`)}
                    getExplanationSnippet={getExplanationSnippet}
                />

            </div >
        </div >
    );
}

