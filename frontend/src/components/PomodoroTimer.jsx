import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './PomodoroTimer.css';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, Settings, SkipForward, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
    } catch { /* empty */ }
}

export default function PomodoroTimer({ stats }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

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
    const accentBorder = mode === 'focus' ? 'rgba(167,139,250,0.3)' : mode === 'longBreak' ? 'rgba(244,114,182,0.3)' : 'rgba(52,211,153,0.3)';

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
    }, [historyMap]);

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
        title: isLight ? '#0f172a' : '#f8fafc',
        text: isLight ? '#475569' : '#cbd5e1',
        muted: isLight ? '#94a3b8' : '#64748b',
    };

    return (
        <div style={{
            padding: '24px 28px',
            background: c.bg,
            borderRadius: '24px',
            border: c.border,
            boxShadow: c.shadow,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <style>{`
                @keyframes pulsing {
                    0% { filter: drop-shadow(0 0 8px ${accentColor}); }
                    50% { filter: drop-shadow(0 0 16px ${accentColor}); }
                    100% { filter: drop-shadow(0 0 8px ${accentColor}); }
                }
                .pomo-ring-pulse { animation: pulsing 2s infinite ease-in-out; }
                .pomo-header-btn {
                    background: transparent; border: none; padding: 6px; border-radius: 8px; cursor: pointer;
                    color: ${c.muted}; transition: all 0.2s;
                }
                .pomo-header-btn:hover { background: ${c.cardBg}; color: ${c.title}; }
                .pomo-header-btn.active { color: ${accentColor}; background: ${accentGlow}; }
                .pomo-panel {
                    background: ${c.cardBg}; border: ${c.cardBorder}; border-radius: 16px; 
                    padding: 16px; margin-bottom: 20px; animation: slideDown 0.3s ease;
                }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .pomo-preset-btn {
                    padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;
                    background: transparent; border: 1px solid ${c.cardBorder}; color: ${c.text};
                    transition: all 0.2s;
                }
                .pomo-preset-btn:hover { background: ${c.cardBg}; color: ${c.title}; }
                .pomo-preset-btn.active { background: ${accentColor}; color: white; border-color: ${accentColor}; }
                
                .pomo-history-bar-wrap { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100px; gap: 4px; }
                .pomo-history-bar { width: 14px; border-radius: 4px; transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                
                .pomo-mode-btn {
                    flex: 1; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;
                    border-radius: 10px; border: 1px solid transparent; background: transparent;
                    color: ${c.muted}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                }
                .pomo-mode-btn:hover { color: ${c.title}; background: ${c.cardBg}; }
                .pomo-mode-btn.active { background: ${c.cardBg}; color: ${accentColor}; border: 1px solid ${accentBorder}; }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', 
                        background: accentGlow, border: `1px solid ${accentBorder}`,
                        transition: 'all 0.4s ease'
                    }}>
                        <Timer size={18} style={{ color: accentColor }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Pomodoro</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>{sessions} session{sessions !== 1 ? 's' : ''} today</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button className={`pomo-header-btn ${showHistory ? 'active' : ''}`} onClick={() => { setShowHistory(!showHistory); setShowSettings(false); }}>
                        <BarChart3 size={16} />
                    </button>
                    <button className={`pomo-header-btn ${showSettings ? 'active' : ''}`} onClick={() => { setShowSettings(!showSettings); setShowHistory(false); }}>
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="pomo-panel">
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: c.title, display: 'block', marginBottom: '8px' }}>{FOCUS_LABEL}</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {PRESETS.focus.map(v => (
                                <button key={v} className={`pomo-preset-btn ${settings.focus === v ? 'active' : ''}`} onClick={() => { setSettings(s => ({ ...s, focus: v })); if (mode === 'focus' && !isRunning) setTimeLeft(v * 60); }}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: c.title, display: 'block', marginBottom: '8px' }}>{BREAK_LABEL}</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {PRESETS.break.map(v => (
                                <button key={v} className={`pomo-preset-btn ${settings.break === v ? 'active' : ''}`} onClick={() => { setSettings(s => ({ ...s, break: v })); if (mode === 'break' && !isRunning) setTimeLeft(v * 60); }}>
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', borderTop: c.cardBorder, paddingTop: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: c.text, cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={settings.autoStart} onChange={e => setSettings(s => ({ ...s, autoStart: e.target.checked }))} />
                            Auto-start next
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: c.text, cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={settings.sound} onChange={e => setSettings(s => ({ ...s, sound: e.target.checked }))} />
                            {settings.sound ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound
                        </label>
                    </div>
                </div>
            )}

            {/* History Chart */}
            {showHistory && (
                <div className="pomo-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 10px 10px', height: '120px' }}>
                        {historyData.map(d => (
                            <div key={d.key} className="pomo-history-bar-wrap">
                                <span style={{ fontSize: '10px', color: c.muted, fontWeight: 700 }}>{d.count || ''}</span>
                                <div className="pomo-history-bar" style={{ height: `${Math.max(d.height, 4)}%`, background: d.key === todayKey() ? accentColor : isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.15)' }} />
                                <span style={{ fontSize: '11px', color: c.text, fontWeight: 600 }}>{d.label}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '12px', color: c.text, marginTop: '8px' }}>
                        Total this week: <strong style={{ color: c.title }}>{historyData.reduce((s, d) => s + d.count, 0)}</strong> sessions
                    </div>
                </div>
            )}

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: '8px', background: isLight ? 'rgba(15,23,42,0.03)' : 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '14px', marginBottom: '32px' }}>
                <button className={`pomo-mode-btn ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')}>
                    <Brain size={16} /> Focus
                </button>
                <button className={`pomo-mode-btn ${mode === 'break' ? 'active' : ''}`} onClick={() => switchMode('break')}>
                    <Coffee size={16} /> Break
                </button>
                {consecutiveSessions > 0 && consecutiveSessions % 4 === 0 && (
                    <button className={`pomo-mode-btn ${mode === 'longBreak' ? 'active' : ''}`} onClick={() => switchMode('longBreak')}>
                        🧘 Long
                    </button>
                )}
            </div>

            {/* Timer Ring */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                <svg width="180" height="180" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={radius} fill="none" stroke={isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.06)'} strokeWidth="8" />
                    <circle
                        cx="80" cy="80" r={radius} fill="none"
                        stroke={accentColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={isRunning ? 'pomo-ring-pulse' : ''}
                        style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '38px', fontWeight: 800, color: c.title, letterSpacing: '-1px', lineHeight: 1 }}>
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: accentColor, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {mode === 'focus' ? 'Focus Time' : mode === 'longBreak' ? 'Long Break' : 'Break Time'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <button onClick={reset} style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.cardBg, border: c.cardBorder, color: c.muted, display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = c.title; }} onMouseLeave={e => { e.currentTarget.style.color = c.muted; }}>
                    <RotateCcw size={18} />
                </button>
                <button onClick={toggle} style={{ width: '56px', height: '56px', borderRadius: '50%', background: accentColor, border: 'none', color: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: `0 8px 24px ${accentGlow}`, transition: 'all 0.2s', transform: isRunning ? 'scale(0.95)' : 'scale(1)' }}>
                    {isRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
                </button>
                <button onClick={skipSession} style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.cardBg, border: c.cardBorder, color: c.muted, display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.color = c.title; }} onMouseLeave={e => { e.currentTarget.style.color = c.muted; }}>
                    <SkipForward size={18} />
                </button>
            </div>

            {/* Session dots */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                {Array.from({ length: Math.min(consecutiveSessions, 8) }).map((_, i) => (
                    <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i % 4 === 3 ? '#f472b6' : accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                ))}
                {consecutiveSessions > 0 && <span style={{ fontSize: '11px', color: c.muted, fontWeight: 700, marginLeft: '4px' }}>{consecutiveSessions} in a row</span>}
            </div>

            {/* Quote */}
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: c.text, background: c.cardBg, padding: '12px', borderRadius: '12px', fontStyle: 'italic' }}>
                "{QUOTES[quoteIdx]}"
            </div>
        </div>
    );
}
