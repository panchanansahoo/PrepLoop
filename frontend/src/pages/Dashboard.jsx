import React, { Suspense, lazy, useState, useMemo, useCallback } from 'react';
import './Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, SlidersHorizontal, X, GripVertical } from 'lucide-react';
import useDashboardData from '../hooks/useDashboardData';
import { useLeaderboard, useUserStats } from '../hooks/useLeaderboard';
import { DashboardSkeleton } from '../components/skeletons';
import FetchError from '../components/FetchError';
import ErrorBoundary from '../components/ErrorBoundary';

const lazyDefault = (loader) =>
    lazy(() => loader().then((module) => ({ default: module.default })));

const lazyNamed = (loader, exportName) =>
    lazy(() => loader().then((module) => ({ default: module[exportName] })));

const QuickStatsWidget = lazyDefault(() => import('../components/QuickStats'));
const StreakHeatmapWidget = lazyNamed(() => import('../components/QuickStats'), 'StreakHeatmap');
const QuickActionsWidget = lazyDefault(() => import('../components/QuickActions'));
const ReadinessScoreWidget = lazyDefault(() => import('../components/ReadinessScore'));
const RecentActivityWidget = lazyDefault(() => import('../components/RecentActivity'));
const SkillRadarWidget = lazyDefault(() => import('../components/SkillRadar'));
const DailyChallengeWidget = lazyDefault(() => import('../components/DailyChallenge'));
const UpcomingContestsWidget = lazyDefault(() => import('../components/UpcomingContests'));
const CalendarWidget = lazyDefault(() => import('../components/CalendarWidget'));
const PomodoroTimerWidget = lazyDefault(() => import('../components/PomodoroTimer'));
const WeeklyStatsWidget = lazyDefault(() => import('../components/WeeklyStats'));
const SkillMatchJobsWidget = lazyDefault(() => import('../components/SkillMatchJobs'));
const TodoListWidget = lazyDefault(() => import('../components/TodoList'));
const LearningStreakWidget = lazyDefault(() => import('../components/LearningStreakWidget'));
const AIJobCopilotWidget = lazyDefault(() => import('../components/AIJobCopilotWidget'));
const DailyQuestionWidget = lazyDefault(() => import('../components/DailyQuestionWidget'));
const LeaderboardWidget = lazyDefault(() => import('../components/LeaderboardWidget'));
const InterviewCountdownWidget = lazyDefault(() => import('../components/InterviewCountdownWidget'));
const StreakMotivationBannerWidget = lazyDefault(() => import('../components/StreakMotivationBanner'));
const SmartStudyPlannerWidget = lazyDefault(() => import('../components/SmartStudyPlanner'));
const InterviewPerformanceRadarWidget = lazyDefault(() => import('../components/InterviewPerformanceRadar'));

function WidgetSkeleton({ layout = 'full' }) {
    const isFull = layout === 'full';
    return (
        <div
            className="dash-widget-wrapper"
            style={{
                minHeight: isFull ? 180 : 220,
            }}
            aria-busy="true"
            aria-label="Loading dashboard widget"
        >
            <div
                style={{
                    borderRadius: 24,
                    padding: 20,
                    minHeight: isFull ? 180 : 220,
                    background: 'linear-gradient(135deg, rgba(18, 18, 24, 0.45), rgba(20, 20, 28, 0.3))',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'var(--shadow-md)',
                }}
            >
                <div style={{ width: 140, height: 14, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
                <div style={{ width: '72%', height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.05)', marginBottom: 18 }} />
                <div style={{ width: '100%', height: isFull ? 110 : 150, borderRadius: 18, background: 'rgba(255,255,255,0.04)' }} />
            </div>
        </div>
    );
}
// ── Daily Quotes ──
const DAILY_QUOTES = [
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
    { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
    { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
    { text: "Java is to JavaScript what car is to carpet.", author: "Chris Heilmann" },
    { text: "Knowledge is power.", author: "Francis Bacon" },
    { text: "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.", author: "Antoine de Saint-Exupéry" },
    { text: "Testing leads to failure, and failure leads to understanding.", author: "Burt Rutan" },
    { text: "The most disastrous thing that you can ever learn is your first programming language.", author: "Alan Kay" },
    { text: "Optimism is an occupational hazard of programming: feedback is the treatment.", author: "Kent Beck" },
    { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Don't comment bad code — rewrite it.", author: "Brian Kernighan" },
    { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
    { text: "It's not a bug — it's an undocumented feature.", author: "Anonymous" },
    { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
    { text: "If debugging is the process of removing software bugs, then programming must be the process of putting them in.", author: "Edsger Dijkstra" },
    { text: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward V. Berard" },
    { text: "The computer was born to solve problems that did not exist before.", author: "Bill Gates" },
    { text: "A language that doesn't affect the way you think about programming is not worth knowing.", author: "Alan Perlis" },
    { text: "One man's crappy software is another man's full-time job.", author: "Jessica Gaston" },
    { text: "The function of good software is to make the complex appear simple.", author: "Grady Booch" },
    { text: "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.", author: "Patrick McKenzie" },
    { text: "Deleted code is debugged code.", author: "Jeff Sickel" },
];

function getDailyQuote(date = new Date()) {
    const yearStart = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date - yearStart) / 86400000);
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}



// ── Widget Registry ──
const WIDGET_REGISTRY = [
    { id: 'quickStats', name: 'Quick Stats', component: QuickStatsWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Day streak, problems solved, score & points' },
    { id: 'streakHeatmap', name: 'Streak Heatmap', component: StreakHeatmapWidget, defaultVisible: true, premium: false, layout: 'full', description: '365-day activity map for your solve streak' },
    { id: 'quickActions', name: 'Quick Actions', component: QuickActionsWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Shortcuts to key features' },
    { id: 'skillMatchJobs', name: 'Skill-Matched Jobs', component: SkillMatchJobsWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Live job recommendations based on your skills' },
    { id: 'readinessScore', name: 'Interview Readiness', component: ReadinessScoreWidget, defaultVisible: true, premium: true, layout: '2col-left', description: 'Overall interview readiness gauge' },
    { id: 'skillRadar', name: 'Skill Breakdown', component: SkillRadarWidget, defaultVisible: true, premium: true, layout: '2col-right', description: 'Radar chart of your skill areas' },
    { id: 'recentActivity', name: 'Recent Activity', component: RecentActivityWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Your latest practice sessions' },

    { id: 'dailyQuestion', name: 'Daily Questions', component: DailyQuestionWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Your personalized daily DSA and behavioral questions' },
    { id: 'dailyChallenge', name: 'Daily Challenge', component: DailyChallengeWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Company-specific daily problems' },
    { id: 'upcomingContests', name: 'Upcoming Contests', component: UpcomingContestsWidget, defaultVisible: true, premium: false, layout: 'full', description: 'LeetCode, Codeforces & more' },
    { id: 'calendarWidget', name: 'Calendar', component: CalendarWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Mini monthly calendar with date picker' },
    { id: 'pomodoroTimer', name: 'Pomodoro Timer', component: PomodoroTimerWidget, defaultVisible: true, premium: false, layout: '2col-right', description: 'Focus & break timer with session tracking' },

    { id: 'todoList', name: 'Todo List', component: TodoListWidget, defaultVisible: true, premium: false, layout: '2col-right', description: 'Task manager with priorities & progress' },
    { id: 'weeklyStats', name: 'Weekly Stats', component: WeeklyStatsWidget, defaultVisible: true, premium: false, layout: 'full', description: 'Compare this week vs last week progress' },
    { id: 'learningStreak', name: 'Learning Streak', component: LearningStreakWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Daily streak and weekly persistence tracker' },
    { id: 'leaderboard', name: 'Leaderboard', component: LeaderboardWidget, defaultVisible: true, premium: false, layout: '2col-right', description: 'Weekly top performers' },
    { id: 'aiJobCopilot', name: 'AI Job Copilot', component: AIJobCopilotWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Your personal AI career strategist interface' },
    { id: 'interviewCountdown', name: 'Interview Countdown', component: InterviewCountdownWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Countdown to your next interview with daily prep checklist' },
    { id: 'smartStudyPlanner', name: 'Smart Study Planner', component: SmartStudyPlannerWidget, defaultVisible: true, premium: false, layout: 'full', description: 'AI-generated personalized weekly study schedule' },
    { id: 'performanceRadar', name: 'Performance Radar', component: InterviewPerformanceRadarWidget, defaultVisible: true, premium: false, layout: '2col-right', description: 'Multi-dimensional interview performance tracking with radar chart' },
];

const STORAGE_KEY = 'preploop_dashboard_widgets';
const ORDER_STORAGE_KEY = 'preploop_dashboard_order';

function getInitialVisibility() {
    const defaults = WIDGET_REGISTRY.reduce((acc, w) => ({ ...acc, [w.id]: w.defaultVisible }), {});
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge: use saved values but add defaults for any new widgets
            return { ...defaults, ...parsed };
        }
    } catch { }
    return defaults;
}

function getInitialOrder() {
    const defaultOrder = WIDGET_REGISTRY.map(w => w.id);
    try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const missing = defaultOrder.filter(id => !parsed.includes(id));
            const validParsed = parsed.filter(id => defaultOrder.includes(id));
            return [...validParsed, ...missing];
        }
    } catch { }
    return defaultOrder;
}

export default function Dashboard() {
    const { user } = useAuth();
    const { data: dashboardData, loading: dashLoading, error: dashError, refetch } = useDashboardData();
    const { leaderboard } = useLeaderboard();
    const { stats } = useUserStats();
    const userName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Engineer';
    const dailyQuote = useMemo(() => getDailyQuote(), []);
    const [widgetVisibility, setWidgetVisibility] = useState(getInitialVisibility);
    const [widgetOrder, setWidgetOrder] = useState(getInitialOrder);
    const [showCustomize, setShowCustomize] = useState(false);
    const [draggedWidgetId, setDraggedWidgetId] = useState(null);

    const toggleWidget = useCallback((id) => {
        setWidgetVisibility(prev => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const removeWidget = useCallback((id) => {
        setWidgetVisibility(prev => {
            const next = { ...prev, [id]: false };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const defaultVisibility = WIDGET_REGISTRY.reduce((acc, w) => ({ ...acc, [w.id]: w.defaultVisible }), {});
        const defaultOrder = WIDGET_REGISTRY.map(w => w.id);

        setWidgetVisibility(defaultVisibility);
        setWidgetOrder(defaultOrder);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultVisibility));
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(defaultOrder));
    }, []);

    const handleDragStart = (e, id) => {
        setDraggedWidgetId(id);
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', id);
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    const handleDragOver = (e, id) => {
        e.preventDefault();
        if (!draggedWidgetId || draggedWidgetId === id) return;

        const draggedIndex = widgetOrder.indexOf(draggedWidgetId);
        const hoverIndex = widgetOrder.indexOf(id);

        if (draggedIndex === -1 || hoverIndex === -1) return;

        const newOrder = [...widgetOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(hoverIndex, 0, draggedWidgetId);

        setWidgetOrder(newOrder);
    };

    const handleDragEnd = () => {
        setDraggedWidgetId(null);
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(widgetOrder));
    };

    const orderedWidgets = useMemo(() => {
        return widgetOrder
            .map(id => WIDGET_REGISTRY.find(w => w.id === id))
            .filter(Boolean);
    }, [widgetOrder]);

    // Filter visible widgets
    const visibleWidgets = orderedWidgets.filter(w => widgetVisibility[w.id]);

    // Build props for each widget based on DB data
    const getWidgetProps = (widgetId) => {
        switch (widgetId) {
            case 'quickStats':
                return {
                    data: {
                        streak: dashboardData.streak,
                        problemsSolved: dashboardData.stats.problemsSolved,
                        avgScore: dashboardData.avgScore,
                        attendInterview: dashboardData.stats.mockInterviews,
                    }
                };
            case 'streakHeatmap':
                return {
                    heatmapData: dashboardData.heatmapData,
                    streak: dashboardData.streak,
                    bestStreak: dashboardData.bestStreak,
                };
            case 'leaderboard':
                return { data: { leaderboard } };
            case 'readinessScore':
                return { data: stats?.readiness || dashboardData.readinessData };
            case 'skillRadar':
                return { data: stats?.skillRadar || dashboardData.skillBreakdown };
            case 'recentActivity':
                return { activities: dashboardData.recentActivity };
            case 'dailyChallenge':
                return { challengeData: dashboardData.dailyChallenge };
            case 'upcomingContests':
                return { contests: dashboardData.upcomingContests };
            case 'pomodoroTimer':
                return { stats: dashboardData.pomodoroStats };
            case 'weeklyGoals':
                return { weeklyData: dashboardData.weeklyGoals };
            case 'weeklyStats':
                return {
                    weeklyData: {
                        thisWeek: { problems: dashboardData.thisWeekProblems ?? 0, time: dashboardData.thisWeekTime ?? 0, points: dashboardData.thisWeekXP ?? 0 },
                        lastWeek: { problems: dashboardData.lastWeekProblems ?? 0, time: dashboardData.lastWeekTime ?? 0, points: dashboardData.lastWeekXP ?? 0 }
                    }
                };
            default:
                return {};
        }
    };

    // Render a single widget with remove button
    const renderWidget = (w) => {
        const Component = w.component;
        const props = getWidgetProps(w.id);
        return (
            <div key={w.id} className="dash-widget-wrapper">
                <button
                    className="dash-widget-remove"
                    onClick={() => removeWidget(w.id)}
                    title={`Remove ${w.name}`}
                >
                    <X size={14} />
                </button>
                {w.premium && <span className="dash-widget-premium-badge">⭐ Premium</span>}
                <ErrorBoundary fallback={(error, resetError) => (
                    <FetchError message="Widget crashed" compact onRetry={resetError} />
                )}>
                    <Suspense fallback={<WidgetSkeleton layout={w.layout} />}>
                        <Component {...props} />
                    </Suspense>
                </ErrorBoundary>
            </div>
        );
    };

    // Build rows from visible widgets
    const renderRows = () => {
        const rows = [];
        let rowKey = 0;

        for (let i = 0; i < visibleWidgets.length; i++) {
            const w = visibleWidgets[i];

            if (w.layout === 'full') {
                rows.push(<div key={`row-${rowKey++}`}>{renderWidget(w)}</div>);
            } else if (w.layout === '2col-left' || w.layout === '2col-right') {
                const nextW = visibleWidgets[i + 1];
                if (nextW && (nextW.layout === '2col-left' || nextW.layout === '2col-right')) {
                    rows.push(
                        <div key={`row-${rowKey++}`} className="dash-row-2col">
                            {renderWidget(w)}
                            {renderWidget(nextW)}
                        </div>
                    );
                    i++; // skip next widget
                } else {
                    rows.push(<div key={`row-${rowKey++}`}>{renderWidget(w)}</div>);
                }
            } else if (w.layout === '3col') {
                const group = [w];
                let j = i + 1;
                while (j < visibleWidgets.length && group.length < 3) {
                    if (visibleWidgets[j].layout === '3col') {
                        group.push(visibleWidgets[j]);
                        j++;
                    } else {
                        break;
                    }
                }
                rows.push(
                    <div key={`row-${rowKey++}`} className="dash-row-3col">
                        {group.map(gw => renderWidget(gw))}
                    </div>
                );
                i += group.length - 1; // skip widgets in group
            }
        }
        return rows;
    };

    const visibleCount = visibleWidgets.length;
    const totalCount = WIDGET_REGISTRY.length;

    return (
        <div className="dash-page">
            {/* Ambient backgrounds */}
            <div className="dash-bg-noise" />
            <div className="dash-bg-gradient" />
            <div className="dash-bg-orb dash-bg-orb-1" />
            <div className="dash-bg-orb dash-bg-orb-2" />

            <div className="dash-container">

                {/* ── Hero Header ── */}
                <div className="dash-hero">
                    <div className="dash-hero-text">
                        <h1 className="dash-hero-title">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Good morning';
                                if (hour < 18) return 'Good afternoon';
                                return 'Good evening';
                            })()}, <span className="dash-hero-name">{userName}</span> 👋
                        </h1>
                        <p className="dash-hero-sub">"{dailyQuote.text}" — <em>{dailyQuote.author}</em></p>
                    </div>
                    <div className="dash-hero-actions">
                        <button
                            className="dash-customize-btn"
                            onClick={() => setShowCustomize(true)}
                        >
                            <SlidersHorizontal size={16} />
                            Open Layout
                            <span className="dash-customize-count">{visibleCount}/{totalCount}</span>
                        </button>
                        <Link to="/company-interview" className="dash-hero-cta">
                            <Sparkles size={18} />
                            Start Mock Interview
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* ── Loading State ── */}
                {dashLoading && <DashboardSkeleton />}

                {/* ── Error State ── */}
                {dashError && !dashLoading && (
                    <FetchError message={dashError} onRetry={refetch} />
                )}

                {/* ── Streak Motivation Banner ── */}
                {!dashLoading && !dashError && dashboardData.streak >= 3 && (
                    <Suspense fallback={null}>
                        <StreakMotivationBannerWidget streak={dashboardData.streak} />
                    </Suspense>
                )}

                {/* ── Dashboard Widgets ── */}
                {!dashLoading && !dashError && renderRows()}

            </div>

            {/* ── Customize Modal ── */}
            {showCustomize && (
                <div className="dash-modal-overlay" onClick={() => setShowCustomize(false)}>
                    <div className="dash-modal" onClick={e => e.stopPropagation()}>
                        <div className="dash-modal-header">
                            <div>
                                <h2 className="dash-modal-title">
                                    <SlidersHorizontal size={20} />
                                    Customize Dashboard
                                </h2>
                                <p className="dash-modal-subtitle">Toggle widgets on or off to personalize your dashboard</p>
                            </div>
                            <button className="dash-modal-close" onClick={() => setShowCustomize(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="dash-modal-body">
                            {orderedWidgets.map(widget => (
                                <div
                                    key={widget.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, widget.id)}
                                    onDragOver={(e) => handleDragOver(e, widget.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`dash-widget-toggle-item ${widgetVisibility[widget.id] ? 'active' : ''} ${draggedWidgetId === widget.id ? 'dragging' : ''}`}
                                    onClick={() => toggleWidget(widget.id)}
                                    style={{ cursor: 'move', opacity: draggedWidgetId === widget.id ? 0.5 : 1 }}
                                >
                                    <div className="dash-widget-drag-handle" style={{ marginRight: '12px', color: 'var(--text-muted)' }}>
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="dash-widget-toggle-info">
                                        <div className="dash-widget-toggle-name">
                                            {widget.name}
                                            {widget.premium && <span className="dash-premium-tag">⭐ Premium</span>}
                                        </div>
                                        <div className="dash-widget-toggle-desc">{widget.description}</div>
                                    </div>
                                    <div className={`dash-widget-switch ${widgetVisibility[widget.id] ? 'on' : 'off'}`}>
                                        <div className="dash-widget-switch-thumb" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dash-modal-footer">
                            <button className="dash-modal-reset" onClick={resetToDefaults}>
                                Reset to Defaults
                            </button>
                            <button className="dash-modal-done" onClick={() => setShowCustomize(false)}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
