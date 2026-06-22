import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Building2, Tag, BarChart3, ArrowUpDown, CheckCircle2, Circle, AlertCircle, ExternalLink, SlidersHorizontal, Bookmark, Shuffle, Zap, Star, Sparkles, ChevronRight, Trophy, ChevronLeft, ListFilter, BookOpen, TrendingUp, Lock, MessageSquare, Play, Code2, List, Target, BarChart2, History } from 'lucide-react';
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
import { ProblemExplorerLeaderboard } from '../features/problemExplorer/ProblemExplorerLeaderboard';
import { ProblemSolvingOverview } from '../features/problemExplorer/ProblemSolvingOverview';
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
const _ITEMS_PER_PAGE = 30;

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
        _page,
        setPage,
        _isLoading,
        _setIsLoading,
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
        _expandedPatterns,
        _setExpandedPatterns,
        expandedCategories,
        setExpandedCategories,
        expandedSubPatterns,
        setExpandedSubPatterns,
        solvedSet,
        _setSolvedSet,
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

    const _toggleBookmark = useCallback((e, problemId) => {
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

    const _openNote = useCallback((e, problemId) => {
        e.stopPropagation();
        setActiveNote(problemId);
        setNoteText(notes[problemId] || '');
    }, [notes]);

    // Track recently viewed when navigating
    const goToProblem = useCallback((problemId) => {
        const recent = JSON.parse(localStorage.getItem('cl_recent') || '[]');
        const updated = [problemId, ...recent.filter(id => id !== problemId)].slice(0, 10);
        localStorage.setItem('cl_recent', JSON.stringify(updated));
        navigate(`/dsa-editor/${problemId}`);
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

    const _handleSort = (key) => {
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
    const _progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

    // Solved by difficulty for hero section
    const solvedByDifficulty = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        PROBLEMS.forEach(p => {
            if (solvedSet.has(p.id)) counts[p.difficulty]++;
        });
        return counts;
    }, [solvedSet]);
    const solvedInFiltered = filteredProblems.filter(p => solvedSet.has(p.id)).length;

    // Recently viewed problems
    const recentProblems = useMemo(() => {
        return recentlyViewed.map(id => PROBLEMS.find(p => p.id === id)).filter(Boolean).slice(0, 5);
    }, [recentlyViewed]);

    return (
        <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#06060a] text-white'} selection:bg-purple-500/30`} style={{ scrollBehavior: 'smooth', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            {/* Multi-layer ambient background */}
            <div className="fixed inset-0 pointer-events-none" style={{
                background: isLight
                    ? 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(139,92,246,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(59,130,246,0.04), transparent 50%)'
                    : 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(139,92,246,0.12), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(59,130,246,0.06), transparent 50%), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(52,211,153,0.04), transparent 50%)'
            }} />
            {/* Subtle grid pattern */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: isLight ? 'none' : `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
            }} />
            <style>{`
                @keyframes shimmer-border { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes pulse-glow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
                @keyframes fade-up-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes skeleton-pulse { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.08; } }
                @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
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
                <div style={{
                    marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animation: 'fade-up-in 0.4s ease both',
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h1 style={{
                            fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0,
                            background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 30%, #38bdf8 60%, #34d399 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 6s ease infinite',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Problem Explorer</h1>
                        <p style={{
                            color: isLight ? '#64748b' : 'rgba(255,255,255,0.35)', fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontWeight: 500,
                        }}>
                            <span style={{
                                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                                background: '#34d399', animation: 'pulse-glow 2s ease-in-out infinite',
                                boxShadow: '0 0 8px rgba(52,211,153,0.5)',
                            }} />
                            <span>{PROBLEMS.length} problems</span>
                            <span style={{ color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>•</span>
                            <span>{TOPICS.length} topics</span>
                            <span style={{ color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' }}>•</span>
                            <span>{COMPANIES.length} companies</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={pickRandom} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))',
                            border: '1px solid rgba(139,92,246,0.2)', color: isLight ? '#7c3aed' : '#e9d5ff',
                            cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
                            boxShadow: '0 4px 16px rgba(139,92,246,0.06)',
                            letterSpacing: '-0.01em',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(99,102,241,0.15))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,92,246,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(99,102,241,0.08))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.06)'; }}
                        >
                            <Shuffle size={15} />
                            Surprise Me
                        </button>
                    </div>
                </div>

                {/* ══════════ HERO: Problem Solving Overview ══════════ */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16,
                    marginBottom: 20, animation: 'fade-up-in 0.5s ease both',
                }}>
                    <ProblemSolvingOverview
                        solvedSet={solvedSet}
                        totalCount={totalCount}
                        diffCounts={diffCounts}
                        streak={streak}
                        isLight={isLight}
                        solvedByDifficulty={solvedByDifficulty}
                    >
                        <ProblemExplorerLeaderboard isLight={isLight} />
                    </ProblemSolvingOverview>
                </div>

                {/* ══════════ Quick Actions Toolbar ══════════ */}
                <div style={{
                    display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center',
                    animation: 'fade-up-in 0.5s ease 0.15s both',
                    padding: '10px 16px', borderRadius: 14,
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(248,250,252,0.7))'
                        : 'linear-gradient(135deg, rgba(15,15,25,0.4), rgba(20,20,35,0.25))',
                    border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                }}>
                    {/* Bookmarks Toggle */}
                    <button onClick={() => setShowBookmarksOnly(b => !b)} style={{
                        padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showBookmarksOnly ? 'rgba(251,191,36,0.12)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: showBookmarksOnly ? '1px solid rgba(251,191,36,0.25)' : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.25s ease',
                    }}>
                        <Bookmark size={14} color={showBookmarksOnly ? '#fbbf24' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)'} fill={showBookmarksOnly ? '#fbbf24' : 'none'} />
                        <span style={{ fontSize: 12, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#475569' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{bookmarks.size}</span>
                        <span style={{ fontSize: 11, color: showBookmarksOnly ? '#fbbf24' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Saved</span>
                    </button>

                    {/* Weekly Goal */}
                    <div onClick={() => setShowGoalEdit(g => !g)} style={{
                        padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)',
                        display: 'flex', alignItems: 'center', gap: 8, position: 'relative', transition: 'all 0.25s ease',
                    }}>
                        <Target size={14} color='#06b6d4' />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 50, height: 4, borderRadius: 3, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, (weekSolved / weeklyGoal) * 100)}%`, height: '100%', background: weekSolved >= weeklyGoal ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: 3, transition: 'width 0.4s ease', boxShadow: '0 0 6px rgba(6,182,212,0.3)' }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: weekSolved >= weeklyGoal ? '#34d399' : '#06b6d4' }}>{weekSolved}/{weeklyGoal}</span>
                        </div>
                        {showGoalEdit && (
                            <div onClick={e => e.stopPropagation()} style={{
                                position: 'absolute', top: '110%', left: 0, zIndex: 20, padding: '10px 14px', borderRadius: 12,
                                background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(12,12,20,0.97)',
                                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(6,182,212,0.15)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: isLight ? '0 8px 32px rgba(0,0,0,0.1)' : '0 8px 32px rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(16px)',
                            }}>
                                <span style={{ fontSize: 11, color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Goal:</span>
                                {[3, 5, 7, 10, 15].map(g => (
                                    <button key={g} onClick={() => { setWeeklyGoal(g); localStorage.setItem('cl_weekly_goal', String(g)); setShowGoalEdit(false); }} style={{
                                        padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                        background: weeklyGoal === g ? 'rgba(6,182,212,0.15)' : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                        border: weeklyGoal === g ? '1px solid rgba(6,182,212,0.25)' : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                                        color: weeklyGoal === g ? '#06b6d4' : isLight ? '#475569' : 'rgba(255,255,255,0.4)',
                                        transition: 'all 0.15s',
                                    }}>{g}/wk</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Separator */}
                    <div style={{ width: 1, height: 20, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }} />

                    {/* Topic Mastery Toggle */}
                    <button onClick={() => setShowTopicMastery(t => !t)} style={{
                        padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                        background: showTopicMastery ? 'rgba(6,182,212,0.1)' : 'transparent',
                        border: showTopicMastery ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.25s ease',
                    }}>
                        <BarChart2 size={14} color={showTopicMastery ? '#06b6d4' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)'} />
                        <span style={{ fontSize: 12, color: showTopicMastery ? '#06b6d4' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Mastery</span>
                    </button>

                    {/* Recently Viewed Toggle */}
                    {recentProblems.length > 0 && (
                        <button onClick={() => setShowRecentlyViewed(r => !r)} style={{
                            padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                            background: showRecentlyViewed ? 'rgba(139,92,246,0.1)' : 'transparent',
                            border: showRecentlyViewed ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.25s ease',
                        }}>
                            <History size={14} color={showRecentlyViewed ? '#a78bfa' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)'} />
                            <span style={{ fontSize: 12, color: showRecentlyViewed ? '#a78bfa' : isLight ? '#94a3b8' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Recent</span>
                        </button>
                    )}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Company Quick Prep */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 2 }}>Quick Prep</span>
                        {QUICK_PREP_COMPANIES.map(cId => {
                            const comp = COMPANIES.find(c => c.id === cId);
                            if (!comp) return null;
                            const isActive = selectedCompanies.length === 1 && selectedCompanies[0] === cId;
                            return (
                                <button key={cId} onClick={() => isActive ? clearAll() : quickPrep(cId)} style={{
                                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                                    background: isActive ? `${comp.color}18` : 'transparent',
                                    border: isActive ? `1px solid ${comp.color}30` : isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
                                    color: isActive ? comp.color : isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)',
                                    transition: 'all 0.2s ease',
                                    letterSpacing: '-0.01em',
                                }}
                                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = comp.color; e.currentTarget.style.borderColor = `${comp.color}20`; } }}
                                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'; } }}
                                >
                                    {comp.name}
                                </button>
                            );
                        })}
                    </div>
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

                {/* Leaderboard has been moved to the hero row */}

                {/* Daily Challenge — Premium card */}
                <div
                    onClick={() => goToProblem(dailyChallenge.id)}
                    style={{
                        marginBottom: 18, padding: '16px 24px', borderRadius: 16,
                        background: isLight
                            ? 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(139,92,246,0.04), rgba(251,191,36,0.03))'
                            : 'linear-gradient(135deg, rgba(251,191,36,0.06), rgba(139,92,246,0.06), rgba(251,191,36,0.03))',
                        border: isLight ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(251,191,36,0.12)',
                        display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(251,191,36,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(251,191,36,0.1)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(251,191,36,0.04)'; e.currentTarget.style.borderColor = isLight ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.12)'; }}
                >
                    {/* Animated shimmer overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.03) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer-border 5s ease infinite', pointerEvents: 'none' }} />
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))',
                        border: '1px solid rgba(251,191,36,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(251,191,36,0.12)',
                    }}>
                        <Sparkles size={18} color="#f59e0b" style={{ animation: 'float-gentle 3s ease-in-out infinite' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Daily Challenge</span>
                            <span style={{
                                fontSize: 9, fontWeight: 800, color: diffColor(dailyChallenge.difficulty),
                                padding: '2px 7px', borderRadius: 5, background: `${diffColor(dailyChallenge.difficulty)}12`,
                                textTransform: 'uppercase', letterSpacing: 0.3,
                            }}>{dailyChallenge.difficulty}</span>
                            {solvedSet.has(dailyChallenge.id) && (
                                <span style={{ fontSize: 9, color: '#34d399', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(52,211,153,0.1)' }}>
                                    <CheckCircle2 size={10} /> Completed
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', letterSpacing: '-0.01em' }}>{dailyChallenge.title}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {dailyChallenge.topics.slice(0, 2).map(t => (
                            <span key={t} style={{
                                fontSize: 10, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(139,92,246,0.08)', color: '#a78bfa',
                                fontWeight: 700, letterSpacing: '-0.01em',
                            }}>{t}</span>
                        ))}
                    </div>
                    <div style={{
                        fontSize: 11, color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)',
                        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        padding: '4px 10px', borderRadius: 8,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        fontWeight: 600,
                    }}>
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
                    onSolveProblem={(problemId) => navigate(`/dsa-editor/${problemId}`)}
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
                    onSolveProblem={(problemId) => navigate(`/dsa-editor/${problemId}`)}
                    getExplanationSnippet={getExplanationSnippet}
                />

            </div >
        </div >
    );
}

