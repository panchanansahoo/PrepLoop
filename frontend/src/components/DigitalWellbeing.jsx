import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './DigitalWellbeing.css';
import { Heart, Clock, Eye, Zap, Coffee, PauseCircle, PlayCircle, Trophy, Flame, Target, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'preploop_wb_data';
const GOALS = [60, 120, 180, 240]; // minutes

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

function todayKey() {
    return new Date().toISOString().split('T')[0];
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : null;
        if (data) return data;
    } catch {}
    return {
        dailyGoalMinutes: 120,
        days: {},
        milestones: [],
    };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

const TIPS = [
    { icon: Coffee, text: 'Take a 5-min break every 25 mins' },
    { icon: Eye, text: 'Look 20ft away for 20s every 20 min' },
    { icon: Zap, text: 'Stay hydrated — drink some water!' },
    { icon: Heart, text: 'Stretch your neck and shoulders' },
    { icon: Target, text: 'Close unnecessary tabs to focus' },
];

const MILESTONE_DEFS = [
    { id: '1hr', label: '1hr Focus', icon: '⏱️', condition: (s) => s >= 3600 },
    { id: '5sess', label: '5 Sessions', icon: '🔥', condition: (_, sc) => sc >= 5 },
    { id: '3streak', label: '3-Day Streak', icon: '🏆', condition: (_, __, streak) => streak >= 3 },
    { id: '2hr', label: '2hr Focus', icon: '💎', condition: (s) => s >= 7200 },
    { id: '7streak', label: '7-Day Streak', icon: '👑', condition: (_, __, streak) => streak >= 7 },
];

export default function DigitalWellbeing() {
    const [data, setData] = useState(loadData);
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showBreakAlert, setShowBreakAlert] = useState(false);
    const [eyeCountdown, setEyeCountdown] = useState(null);
    const [newMilestone, setNewMilestone] = useState(null);
    const intervalRef = useRef(null);
    const breakTimerRef = useRef(null);

    const tk = todayKey();
    const todayData = data.days[tk] || { seconds: 0, sessions: 1 };

    // Total seconds today = persisted + current session
    const totalTodaySeconds = todayData.seconds + sessionSeconds;
    const dailyMinutes = Math.floor(totalTodaySeconds / 60);
    const goalProgress = Math.min((dailyMinutes / data.dailyGoalMinutes) * 100, 100);

    // Focus score
    const focusScore = Math.min(Math.round((sessionSeconds / 1800) * 100), 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const focusOffset = circumference - (focusScore / 100) * circumference;

    // Streak calculation
    const streak = useMemo(() => {
        let count = 0;
        const d = new Date();
        d.setDate(d.getDate() - 1); // start from yesterday
        while (true) {
            const key = d.toISOString().split('T')[0];
            const dayData = data.days[key];
            if (dayData && dayData.seconds >= data.dailyGoalMinutes * 60) {
                count++;
                d.setDate(d.getDate() - 1);
            } else break;
        }
        // Include today if goal met
        if (totalTodaySeconds >= data.dailyGoalMinutes * 60) count++;
        return count;
    }, [data.days, totalTodaySeconds, data.dailyGoalMinutes]);

    // Session timer
    useEffect(() => {
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setSessionSeconds(s => s + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPaused]);

    // Break reminder every 25 minutes
    useEffect(() => {
        if (!isPaused) {
            breakTimerRef.current = setInterval(() => {
                setShowBreakAlert(true);
            }, 25 * 60 * 1000);
        }
        return () => clearInterval(breakTimerRef.current);
    }, [isPaused]);

    // Persist session data periodically
    useEffect(() => {
        if (sessionSeconds > 0 && sessionSeconds % 30 === 0) {
            setData(prev => {
                const updated = {
                    ...prev,
                    days: {
                        ...prev.days,
                        [tk]: {
                            seconds: (prev.days[tk]?.seconds || 0) + 30,
                            sessions: prev.days[tk]?.sessions || 1,
                        }
                    }
                };
                saveData(updated);
                return updated;
            });
        }
    }, [sessionSeconds]);

    // Check milestones
    useEffect(() => {
        MILESTONE_DEFS.forEach(m => {
            if (!data.milestones?.includes(m.id) && m.condition(totalTodaySeconds, todayData.sessions, streak)) {
                setNewMilestone(m);
                setData(prev => {
                    const updated = { ...prev, milestones: [...(prev.milestones || []), m.id] };
                    saveData(updated);
                    return updated;
                });
                setTimeout(() => setNewMilestone(null), 4000);
            }
        });
    }, [totalTodaySeconds, streak]);

    const togglePause = useCallback(() => setIsPaused(p => !p), []);
    const dismissBreak = useCallback(() => setShowBreakAlert(false), []);

    const startEyeRest = useCallback(() => {
        setShowBreakAlert(false);
        setEyeCountdown(20);
    }, []);

    // Eye rest countdown
    useEffect(() => {
        if (eyeCountdown === null) return;
        if (eyeCountdown <= 0) {
            setEyeCountdown(null);
            return;
        }
        const tm = setTimeout(() => setEyeCountdown(c => c - 1), 1000);
        return () => clearTimeout(tm);
    }, [eyeCountdown]);

    const setGoal = (minutes) => {
        setData(prev => {
            const updated = { ...prev, dailyGoalMinutes: minutes };
            saveData(updated);
            return updated;
        });
    };

    // Weekly chart
    const weekData = useMemo(() => {
        const days = getLast7Days();
        const maxMin = Math.max(1, ...days.map(d => Math.floor((data.days[d]?.seconds || 0) / 60)));
        return days.map(d => ({
            key: d,
            label: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
            minutes: Math.floor((data.days[d]?.seconds || 0) / 60),
            height: (Math.floor((data.days[d]?.seconds || 0) / 60) / maxMin) * 100,
            isToday: d === tk,
            metGoal: Math.floor((data.days[d]?.seconds || 0) / 60) >= data.dailyGoalMinutes,
        }));
    }, [data.days, data.dailyGoalMinutes]);

    const currentTip = TIPS[Math.floor(sessionSeconds / 600) % TIPS.length];
    const TipIcon = currentTip.icon;

    return (
        <div className="wb-widget wb-advanced">
            {/* Milestone popup */}
            {newMilestone && (
                <div className="wb-milestone-popup">
                    <span className="wb-milestone-icon">{newMilestone.icon}</span>
                    <span>🎉 {newMilestone.label} unlocked!</span>
                </div>
            )}

            {/* Break Alert */}
            {showBreakAlert && (
                <div className="wb-break-alert">
                    <div className="wb-break-alert-content">
                        <Eye size={20} />
                        <span>Time for a break!</span>
                    </div>
                    <div className="wb-break-alert-actions">
                        <button onClick={startEyeRest} className="wb-break-btn primary">20s Eye Rest</button>
                        <button onClick={dismissBreak} className="wb-break-btn">Dismiss</button>
                    </div>
                </div>
            )}

            {/* Eye Rest Overlay */}
            {eyeCountdown !== null && (
                <div className="wb-eye-rest">
                    <Eye size={32} />
                    <span className="wb-eye-count">{eyeCountdown}s</span>
                    <span className="wb-eye-text">Look 20ft away...</span>
                </div>
            )}

            {/* Header */}
            <div className="wb-header">
                <div className="wb-title-row">
                    <div className="wb-icon-wrap">
                        <Heart size={18} />
                    </div>
                    <div>
                        <h3 className="wb-title">Digital Wellbeing</h3>
                        <p className="wb-subtitle">Session #{todayData.sessions}</p>
                    </div>
                </div>
                <div className="wb-header-right">
                    <button
                        className={`wb-pause-btn ${isPaused ? 'paused' : ''}`}
                        onClick={togglePause}
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                    </button>
                    <div className="wb-session-time">
                        <Clock size={14} />
                        <span>{formatTime(sessionSeconds)}</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="wb-stats-row">
                {/* Focus Ring */}
                <div className="wb-focus-ring">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        <circle
                            cx="48" cy="48" r={radius} fill="none"
                            stroke="#f472b6"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={focusOffset}
                            style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        />
                    </svg>
                    <div className="wb-focus-label">
                        <span className="wb-focus-value">{focusScore}</span>
                        <span className="wb-focus-text">Focus</span>
                    </div>
                </div>

                {/* Mini Stats */}
                <div className="wb-mini-stats">
                    <div className="wb-mini-stat">
                        <span className="wb-mini-label">Sessions</span>
                        <span className="wb-mini-value">{todayData.sessions}</span>
                    </div>
                    <div className="wb-mini-stat">
                        <span className="wb-mini-label">Total Today</span>
                        <span className="wb-mini-value">{formatTime(totalTodaySeconds)}</span>
                    </div>
                    <div className="wb-mini-stat">
                        <span className="wb-mini-label"><Flame size={12} style={{ color: '#fb923c' }} /> Streak</span>
                        <span className="wb-mini-value" style={{ color: streak > 0 ? '#fb923c' : 'inherit' }}>{streak} day{streak !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Daily Goal with adjustable selector */}
            <div className="wb-goal-section">
                <div className="wb-goal-header">
                    <span>Daily Goal</span>
                    <div className="wb-goal-selector">
                        {GOALS.map(g => (
                            <button
                                key={g}
                                className={`wb-goal-btn ${data.dailyGoalMinutes === g ? 'active' : ''}`}
                                onClick={() => setGoal(g)}
                            >
                                {g / 60}h
                            </button>
                        ))}
                    </div>
                </div>
                <div className="wb-goal-bar-container">
                    <div className="wb-goal-bar">
                        <div className="wb-goal-fill" style={{ width: `${goalProgress}%` }} />
                    </div>
                    <span className="wb-goal-text">{dailyMinutes}/{data.dailyGoalMinutes} min</span>
                </div>
            </div>

            {/* Weekly Chart */}
            <div className="wb-weekly-section">
                <div className="wb-weekly-header">
                    <TrendingUp size={14} />
                    <span>This Week</span>
                </div>
                <div className="wb-weekly-chart">
                    {weekData.map(d => (
                        <div key={d.key} className="wb-week-bar-wrap">
                            <span className="wb-week-bar-val">{d.minutes > 0 ? `${d.minutes}m` : ''}</span>
                            <div
                                className={`wb-week-bar ${d.metGoal ? 'met' : ''}`}
                                style={{
                                    height: `${Math.max(d.height, 4)}%`,
                                    background: d.isToday ? '#f472b6' : d.metGoal ? '#34d399' : 'rgba(255,255,255,0.12)',
                                }}
                            />
                            <span className="wb-week-label">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Milestones */}
            <div className="wb-milestones">
                {MILESTONE_DEFS.map(m => (
                    <span
                        key={m.id}
                        className={`wb-badge ${data.milestones?.includes(m.id) ? 'unlocked' : ''}`}
                        title={m.label}
                    >
                        {m.icon}
                    </span>
                ))}
            </div>

            {/* Tip */}
            <div className="wb-tip">
                <TipIcon size={14} />
                <span>{currentTip.text}</span>
            </div>
        </div>
    );
}
