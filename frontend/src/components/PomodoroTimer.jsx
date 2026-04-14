import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, Settings, SkipForward, Volume2, VolumeX, BarChart3 } from 'lucide-react';

const PRESETS = {
    focus: [15, 25, 30, 45, 60],
    break: [5, 10, 15],
    longBreak: [15, 20, 30],
};

const QUOTES = [
    "Stay focused, results will come.",
    "One session at a time.",
    "Deep work beats busy work.",
    "Focus is the new superpower.",
    "Small steps, big progress.",
    "You're building something great.",
    "Consistency creates mastery.",
    "Every minute of focus counts.",
];

const HISTORY_KEY = 'preploop_pomo_history';
const SETTINGS_KEY = 'preploop_pomo_settings';

function loadHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : { focus: 25, break: 5, longBreak: 15, autoStart: false, sound: true };
    } catch { return { focus: 25, break: 5, longBreak: 15, autoStart: false, sound: true }; }
}

function buildInitialPomodoroState(stats) {
    const hasServerStats = stats && typeof stats === 'object' && stats.sessionsByDate;
    if (hasServerStats) {
        return {
            sessions: Number(stats.sessionsToday) || 0,
            history: stats.sessionsByDate || {},
            fromServer: true,
        };
    }

    const history = loadHistory();
    return {
        sessions: history[todayKey()] || 0,
        history,
        fromServer: false,
    };
}

function todayKey() {
    return new Date().toISOString().split('T')[0];
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

function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.stop(ctx.currentTime + 0.8);
        // Second beep
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.value = 0.3;
            osc2.start();
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
        }, 300);
    } catch {}
}

export default function PomodoroTimer({ stats }) {
    const FOCUS_LABEL = 'Focus (min)';
    const BREAK_LABEL = 'Break (min)';
    const initialRef = useRef(buildInitialPomodoroState(stats));
    const [historyMap, setHistoryMap] = useState(initialRef.current.history);
    const [useServerStats, setUseServerStats] = useState(initialRef.current.fromServer);
    const [settings, setSettings] = useState(loadSettings);
    const [mode, setMode] = useState('focus');
    const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(initialRef.current.sessions);
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [consecutiveSessions, setConsecutiveSessions] = useState(0);
    const [quoteIdx, setQuoteIdx] = useState(Math.floor(Math.random() * QUOTES.length));
    const intervalRef = useRef(null);

    useEffect(() => {
        if (stats && typeof stats === 'object' && stats.sessionsByDate) {
            setUseServerStats(true);
            setHistoryMap(stats.sessionsByDate || {});
            setSessions(Number(stats.sessionsToday) || 0);
        }
    }, [stats]);

    const totalTime = mode === 'focus'
        ? settings.focus * 60
        : (mode === 'longBreak' ? settings.longBreak * 60 : settings.break * 60);
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Persist settings
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);

            if (settings.sound) playBeep();

            if (mode === 'focus') {
                const newSessions = sessions + 1;
                setSessions(newSessions);
                setConsecutiveSessions(c => c + 1);
                setQuoteIdx(Math.floor(Math.random() * QUOTES.length));

                // Save to history
                const nextHistory = { ...historyMap, [todayKey()]: newSessions };
                setHistoryMap(nextHistory);
                if (!useServerStats) {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
                }

                // Long break every 4 sessions
                if ((consecutiveSessions + 1) % 4 === 0) {
                    setMode('longBreak');
                    setTimeLeft(settings.longBreak * 60);
                } else {
                    setMode('break');
                    setTimeLeft(settings.break * 60);
                }

                if (settings.autoStart) {
                    setTimeout(() => setIsRunning(true), 500);
                }
            } else {
                setMode('focus');
                setTimeLeft(settings.focus * 60);
                if (settings.autoStart) {
                    setTimeout(() => setIsRunning(true), 500);
                }
            }
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft, sessions, settings, mode, consecutiveSessions, historyMap, useServerStats]);

    const toggle = useCallback(() => setIsRunning(r => !r), []);

    const reset = useCallback(() => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        setTimeLeft(mode === 'focus' ? settings.focus * 60 : (mode === 'longBreak' ? settings.longBreak * 60 : settings.break * 60));
    }, [mode, settings]);

    const switchMode = useCallback((newMode) => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        setMode(newMode);
        if (newMode === 'focus') setTimeLeft(settings.focus * 60);
        else if (newMode === 'longBreak') setTimeLeft(settings.longBreak * 60);
        else setTimeLeft(settings.break * 60);
    }, [settings]);

    const skipSession = useCallback(() => {
        setIsRunning(false);
        clearInterval(intervalRef.current);
        if (mode === 'focus') {
            switchMode('break');
        } else {
            switchMode('focus');
        }
    }, [mode, switchMode]);

    const accentColor = mode === 'focus' ? '#a78bfa' : mode === 'longBreak' ? '#f472b6' : '#34d399';
    const accentGlow = mode === 'focus' ? 'rgba(167,139,250,0.15)' : mode === 'longBreak' ? 'rgba(244,114,182,0.15)' : 'rgba(52,211,153,0.15)';

    // History chart data
    const historyData = useMemo(() => {
        const days = getLast7Days();
        const max = Math.max(1, ...days.map(d => historyMap[d] || 0));
        return days.map(d => ({
            key: d,
            label: new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
            count: historyMap[d] || 0,
            height: ((historyMap[d] || 0) / max) * 100,
        }));
    }, [historyMap, showHistory]);

    return (
        <div className="pomo-widget pomo-advanced">
            {/* Header */}
            <div className="pomo-header">
                <div className="pomo-title-row">
                    <div className="pomo-icon-wrap" style={{ background: accentGlow }}>
                        <Timer size={18} style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h3 className="pomo-title">Pomodoro</h3>
                        <p className="pomo-subtitle">{sessions} session{sessions !== 1 ? 's' : ''} today</p>
                    </div>
                </div>
                <div className="pomo-header-actions">
                    <button
                        className={`pomo-header-btn ${showHistory ? 'active' : ''}`}
                        onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}
                        title="History"
                    >
                        <BarChart3 size={15} />
                    </button>
                    <button
                        className={`pomo-header-btn ${showSettings ? 'active' : ''}`}
                        onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}
                        title="Settings"
                    >
                        <Settings size={15} />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="pomo-settings-panel">
                    <div className="pomo-setting-group">
                        <label>{FOCUS_LABEL}</label>
                        <div className="pomo-preset-row">
                            {PRESETS.focus.map(v => (
                                <button
                                    key={v}
                                    className={`pomo-preset-btn ${settings.focus === v ? 'active' : ''}`}
                                    onClick={() => {
                                        setSettings(s => ({ ...s, focus: v }));
                                        if (mode === 'focus' && !isRunning) setTimeLeft(v * 60);
                                    }}
                                >{v}</button>
                            ))}
                        </div>
                    </div>
                    <div className="pomo-setting-group">
                        <label>{BREAK_LABEL}</label>
                        <div className="pomo-preset-row">
                            {PRESETS.break.map(v => (
                                <button
                                    key={v}
                                    className={`pomo-preset-btn ${settings.break === v ? 'active' : ''}`}
                                    onClick={() => {
                                        setSettings(s => ({ ...s, break: v }));
                                        if (mode === 'break' && !isRunning) setTimeLeft(v * 60);
                                    }}
                                >{v}</button>
                            ))}
                        </div>
                    </div>
                    <div className="pomo-setting-toggles">
                        <label className="pomo-toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.autoStart}
                                onChange={e => setSettings(s => ({ ...s, autoStart: e.target.checked }))}
                            />
                            <span>Auto-start next</span>
                        </label>
                        <label className="pomo-toggle-label">
                            <input
                                type="checkbox"
                                checked={settings.sound}
                                onChange={e => setSettings(s => ({ ...s, sound: e.target.checked }))}
                            />
                            <span>{settings.sound ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound</span>
                        </label>
                    </div>
                </div>
            )}

            {/* History Chart */}
            {showHistory && (
                <div className="pomo-history-panel">
                    <div className="pomo-history-chart">
                        {historyData.map(d => (
                            <div key={d.key} className="pomo-history-bar-wrap">
                                <span className="pomo-bar-count">{d.count || ''}</span>
                                <div className="pomo-history-bar" style={{ height: `${Math.max(d.height, 4)}%`, background: d.key === todayKey() ? accentColor : 'rgba(255,255,255,0.15)' }} />
                                <span className="pomo-bar-label">{d.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="pomo-history-summary">
                        Total this week: <strong>{historyData.reduce((s, d) => s + d.count, 0)}</strong> sessions
                    </div>
                </div>
            )}

            {/* Mode Toggle */}
            <div className="pomo-mode-toggle">
                <button
                    className={`pomo-mode-btn ${mode === 'focus' ? 'active' : ''}`}
                    onClick={() => switchMode('focus')}
                >
                    <Brain size={14} /> Focus
                </button>
                <button
                    className={`pomo-mode-btn ${mode === 'break' ? 'active' : ''}`}
                    onClick={() => switchMode('break')}
                >
                    <Coffee size={14} /> Break
                </button>
                {consecutiveSessions > 0 && consecutiveSessions % 4 === 0 && (
                    <button
                        className={`pomo-mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
                        onClick={() => switchMode('longBreak')}
                    >
                        🧘 Long
                    </button>
                )}
            </div>

            {/* Timer Ring */}
            <div className="pomo-ring-container">
                <svg width="160" height="160" viewBox="0 0 160 160" className="pomo-svg">
                    <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                        cx="80" cy="80" r={radius} fill="none"
                        stroke={accentColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={isRunning ? 'pomo-ring-pulse' : ''}
                        style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                </svg>
                <div className="pomo-time-display">
                    <span className="pomo-time" style={{ color: accentColor }}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className="pomo-mode-label">
                        {mode === 'focus' ? 'Focus Time' : mode === 'longBreak' ? 'Long Break' : 'Break Time'}
                    </span>
                </div>
            </div>

            {/* Session dots */}
            <div className="pomo-session-dots">
                {Array.from({ length: Math.min(consecutiveSessions, 8) }).map((_, i) => (
                    <span key={i} className="pomo-dot" style={{ background: i % 4 === 3 ? '#f472b6' : accentColor }} />
                ))}
                {consecutiveSessions > 0 && <span className="pomo-dot-label">{consecutiveSessions} in a row</span>}
            </div>

            {/* Controls */}
            <div className="pomo-controls">
                <button className="pomo-ctrl-btn pomo-reset" onClick={reset} title="Reset">
                    <RotateCcw size={16} />
                </button>
                <button
                    className="pomo-ctrl-btn pomo-play"
                    onClick={toggle}
                    style={{ background: accentColor, boxShadow: `0 4px 20px ${accentGlow}` }}
                >
                    {isRunning ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
                </button>
                <button className="pomo-ctrl-btn pomo-skip" onClick={skipSession} title="Skip">
                    <SkipForward size={16} />
                </button>
            </div>

            {/* Quote */}
            <div className="pomo-quote">
                💡 {QUOTES[quoteIdx]}
            </div>
        </div>
    );
}
