import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, SlidersHorizontal, X, Star, Eye, EyeOff, GripVertical, Loader2 } from 'lucide-react';
import useDashboardData from '../hooks/useDashboardData';

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

import QuickStats from '../components/QuickStats';
import QuickActions from '../components/QuickActions';
import ReadinessScore from '../components/ReadinessScore';
import StreakHeatmap from '../components/StreakHeatmap';
import RecentActivity from '../components/RecentActivity';
import SkillRadar from '../components/SkillRadar';
import DailyChallenge from '../components/DailyChallenge';
import UpcomingContests from '../components/UpcomingContests';
import CalendarWidget from '../components/CalendarWidget';
import PomodoroTimer from '../components/PomodoroTimer';
import WeeklyStats from '../components/WeeklyStats';
import LevelProgress from '../components/LevelProgress';

import TodoList from '../components/TodoList';

// ── Widget Registry ──
const WIDGET_REGISTRY = [
    { id: 'quickStats', name: 'Quick Stats', component: QuickStats, defaultVisible: true, premium: false, layout: 'full', description: 'Day streak, problems solved, score & XP' },
    { id: 'quickActions', name: 'Quick Actions', component: QuickActions, defaultVisible: true, premium: false, layout: 'full', description: 'Shortcuts to key features' },
    { id: 'readinessScore', name: 'Interview Readiness', component: ReadinessScore, defaultVisible: true, premium: true, layout: '2col-left', description: 'Overall interview readiness gauge' },
    { id: 'skillRadar', name: 'Skill Breakdown', component: SkillRadar, defaultVisible: true, premium: true, layout: '2col-right', description: 'Radar chart of your skill areas' },
    { id: 'recentActivity', name: 'Recent Activity', component: RecentActivity, defaultVisible: true, premium: false, layout: '2col-left', description: 'Your latest practice sessions' },
    { id: 'streakHeatmap', name: 'Activity Heatmap', component: StreakHeatmap, defaultVisible: true, premium: false, layout: 'full', description: 'GitHub-style solving heatmap' },

    { id: 'dailyChallenge', name: 'Daily Challenge', component: DailyChallenge, defaultVisible: true, premium: false, layout: 'full', description: 'Company-specific daily problems' },
    { id: 'upcomingContests', name: 'Upcoming Contests', component: UpcomingContests, defaultVisible: true, premium: false, layout: 'full', description: 'LeetCode, Codeforces & more' },
    { id: 'calendarWidget', name: 'Calendar', component: CalendarWidget, defaultVisible: true, premium: false, layout: '2col-left', description: 'Mini monthly calendar with date picker' },
    { id: 'pomodoroTimer', name: 'Pomodoro Timer', component: PomodoroTimer, defaultVisible: true, premium: false, layout: '2col-right', description: 'Focus & break timer with session tracking' },

    { id: 'todoList', name: 'Todo List', component: TodoList, defaultVisible: true, premium: false, layout: '2col-right', description: 'Task manager with priorities & progress' },
    { id: 'weeklyStats', name: 'Weekly Stats', component: WeeklyStats, defaultVisible: true, premium: false, layout: 'full', description: 'Compare this week vs last week progress' },
    { id: 'levelProgress', name: 'Level Progress', component: LevelProgress, defaultVisible: true, premium: false, layout: '2col-right', description: 'Your level, rank & XP progression' },
];

const STORAGE_KEY = 'preploop_dashboard_widgets';

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

export default function Dashboard() {
    const { user } = useAuth();
    const { data: dashboardData, loading: dashLoading } = useDashboardData();
    const userName = user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Engineer';
    const dailyQuote = useMemo(() => getDailyQuote(), []);
    const [widgetVisibility, setWidgetVisibility] = useState(getInitialVisibility);
    const [showCustomize, setShowCustomize] = useState(false);

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
        const defaults = WIDGET_REGISTRY.reduce((acc, w) => ({ ...acc, [w.id]: w.defaultVisible }), {});
        setWidgetVisibility(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    }, []);

    // Filter visible widgets
    const visible = useMemo(() => WIDGET_REGISTRY.filter(w => widgetVisibility[w.id]), [widgetVisibility]);

    // Group by layout
    const fullWidgets = visible.filter(w => w.layout === 'full');
    const twoColLeft = visible.filter(w => w.layout === '2col-left');
    const twoColRight = visible.filter(w => w.layout === '2col-right');
    const threeCol = visible.filter(w => w.layout === '3col');

    // Build props for each widget based on DB data
    const getWidgetProps = (widgetId) => {
        switch (widgetId) {
            case 'quickStats':
                return {
                    data: {
                        streak: dashboardData.streak,
                        problemsSolved: dashboardData.stats.problemsSolved,
                        avgScore: dashboardData.avgScore,
                        totalXP: dashboardData.totalXP,
                    }
                };
            case 'streakHeatmap':
                return {
                    activityHistory: dashboardData.heatmapData,
                    currentStreak: dashboardData.streak,
                    bestStreak: dashboardData.bestStreak,
                    totalSolvedYear: dashboardData.totalSolvedYear || 0,
                    todaySolved: dashboardData.todaySolved || 0,
                };
            case 'readinessScore':
                return { data: dashboardData.readinessData };
            case 'skillRadar':
                return { data: dashboardData.skillBreakdown };
            case 'recentActivity':
                return { activities: dashboardData.recentActivity };
            case 'weeklyGoals':
                return { weeklyData: dashboardData.weeklyGoals };
            case 'weeklyStats':
                return {
                    weeklyData: {
                        thisWeek: { problems: dashboardData.thisWeekProblems ?? 0, time: dashboardData.thisWeekTime ?? 0, xp: dashboardData.thisWeekXP ?? 0 },
                        lastWeek: { problems: dashboardData.lastWeekProblems ?? 0, time: dashboardData.lastWeekTime ?? 0, xp: dashboardData.lastWeekXP ?? 0 }
                    }
                };
            case 'levelProgress':
                return {
                    levelData: {
                        currentLevel: dashboardData.currentLevel ?? 0,
                        currentXP: dashboardData.currentXP ?? 0,
                        nextLevelXP: dashboardData.nextLevelXP ?? 0,
                        totalXP: dashboardData.totalXP ?? 0,
                        rank: dashboardData.rank ?? ''
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
                <Component {...props} />
            </div>
        );
    };

    // Build rows from visible widgets
    const renderRows = () => {
        const rows = [];
        let rowKey = 0;

        // QuickStats (full)
        const quickStats = visible.find(w => w.id === 'quickStats');
        if (quickStats) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(quickStats)}</div>);

        // Daily Challenge (2nd from top)
        const dailyChallenge = visible.find(w => w.id === 'dailyChallenge');
        if (dailyChallenge) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(dailyChallenge)}</div>);

        // Weekly Stats (right after daily challenge)
        const weeklyStats = visible.find(w => w.id === 'weeklyStats');
        if (weeklyStats) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(weeklyStats)}</div>);

        // Upcoming Contests (right after Weekly Stats)
        const upcomingContests = visible.find(w => w.id === 'upcomingContests');
        if (upcomingContests) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(upcomingContests)}</div>);

        // QuickActions (full)
        const quickActions = visible.find(w => w.id === 'quickActions');
        if (quickActions) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(quickActions)}</div>);

        // 2-col rows: pair up left/right
        const maxTwoCol = Math.max(twoColLeft.length, twoColRight.length);
        for (let i = 0; i < maxTwoCol; i++) {
            const left = twoColLeft[i];
            const right = twoColRight[i];
            if (left && right) {
                rows.push(
                    <div key={`row-${rowKey++}`} className="dash-row-2col">
                        {renderWidget(left)}
                        {renderWidget(right)}
                    </div>
                );
            } else if (left) {
                rows.push(<div key={`row-${rowKey++}`}>{renderWidget(left)}</div>);
            } else if (right) {
                rows.push(<div key={`row-${rowKey++}`}>{renderWidget(right)}</div>);
            }
        }

        // 3-col row
        if (threeCol.length > 0) {
            rows.push(
                <div key={`row-${rowKey++}`} className="dash-row-3col">
                    {threeCol.map(w => renderWidget(w))}
                </div>
            );
        }

        // Remaining full-width widgets (exclude quickStats, quickActions, dailyChallenge, upcomingContests, streakHeatmap, weeklyStats)
        const remainingFull = fullWidgets.filter(w => w.id !== 'quickStats' && w.id !== 'quickActions' && w.id !== 'dailyChallenge' && w.id !== 'upcomingContests' && w.id !== 'streakHeatmap' && w.id !== 'weeklyStats');
        remainingFull.forEach(w => {
            rows.push(<div key={`row-${rowKey++}`}>{renderWidget(w)}</div>);
        });

        // Activity Heatmap (always last)
        const heatmap = visible.find(w => w.id === 'streakHeatmap');
        if (heatmap) rows.push(<div key={`row-${rowKey++}`}>{renderWidget(heatmap)}</div>);

        return rows;
    };

    const visibleCount = visible.length;
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
                            Customize
                            <span className="dash-customize-count">{visibleCount}/{totalCount}</span>
                        </button>
                        <Link to="/company-interview" className="dash-hero-cta">
                            <Sparkles size={18} />
                            Start Mock Interview
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* ── Loading State (non-blocking) ── */}
                {dashLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 18px' }}>
                        <Loader2 size={20} className="dash-spinner" style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
                    </div>
                )}

                {/* ── Dashboard Widgets ── */}
                {renderRows()}

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
                            {WIDGET_REGISTRY.map(widget => (
                                <div
                                    key={widget.id}
                                    className={`dash-widget-toggle-item ${widgetVisibility[widget.id] ? 'active' : ''}`}
                                    onClick={() => toggleWidget(widget.id)}
                                >
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
