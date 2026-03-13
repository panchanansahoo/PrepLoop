
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PomodoroTimer = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const [mode, setMode] = useState('pomodoro');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const containerRef = useRef(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    const [settings, setSettings] = useState({
        pomodoro: 25, short: 5, long: 15, alarmEnabled: true, volume: 0.5
    });

    const modes = {
        pomodoro: {
            label: 'Focus', time: settings.pomodoro * 60,
            color: 'text-indigo-400', progressColor: 'stroke-indigo-500',
            glowColor: 'bg-indigo-500/20', btnColor: 'shadow-indigo-500/20',
            activeBtn: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
        },
        short: {
            label: 'Short Break', time: settings.short * 60,
            color: 'text-teal-400', progressColor: 'stroke-teal-500',
            glowColor: 'bg-teal-500/20', btnColor: 'shadow-teal-500/20',
            activeBtn: 'bg-teal-500/10 text-teal-500 hover:bg-teal-500/20'
        },
        long: {
            label: 'Long Break', time: settings.long * 60,
            color: 'text-blue-400', progressColor: 'stroke-blue-500',
            glowColor: 'bg-blue-500/20', btnColor: 'shadow-blue-500/20',
            activeBtn: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
        },
    };

    useEffect(() => { if (!isActive) setTimeLeft(modes[mode].time); }, [settings.pomodoro, settings.short, settings.long]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (settings.alarmEnabled) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => { }); }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, settings.alarmEnabled]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => { });
        else document.exitFullscreen();
    };

    useEffect(() => {
        const handler = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const switchMode = (m) => { setMode(m); setTimeLeft(modes[m].time); setIsActive(false); };
    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTimeLeft(modes[mode].time); };
    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const totalTime = modes[mode].time;
    const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Theme-aware classes
    const containerBg = isLight
        ? 'bg-white/60 backdrop-blur-xl border-indigo-200/30 ring-indigo-100/50'
        : 'bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/5 ring-white/5';
    const dockBg = isLight
        ? 'bg-white/70 backdrop-blur-xl border-indigo-200/30 ring-indigo-100/30'
        : 'bg-black/40 backdrop-blur-2xl border-white/10 ring-white/5';
    const dockActive = isLight
        ? 'text-indigo-700 bg-indigo-50/80 shadow-sm'
        : 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]';
    const dockInactive = isLight ? 'text-slate-500 hover:text-indigo-700 hover:bg-indigo-50/60' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5';
    const tickMajor = isLight ? 'stroke-slate-400' : 'stroke-white/30';
    const tickMinor = isLight ? 'stroke-slate-300' : 'stroke-white/10';
    const trackStroke = isLight ? 'stroke-indigo-100/50' : 'stroke-white/5';
    const timeText = isLight ? 'text-slate-800' : 'text-white';
    const ctrlBtn = isLight
        ? 'bg-indigo-50/50 border-indigo-200/30 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200/50'
        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10';
    const playBg = isLight
        ? (isActive ? 'bg-indigo-50/80' : 'bg-white/60 group-hover:bg-white/80')
        : (isActive ? 'bg-black/40' : 'bg-white/5 group-hover:bg-white/10');
    const playText = isLight ? 'text-slate-700 group-hover:text-indigo-600' : 'text-white group-hover:text-white/90';
    const fsBtn = isLight
        ? 'bg-indigo-50/50 border-indigo-200/30 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
        : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/10';

    // Modal theme
    const modalOverlay = isLight ? 'bg-black/20 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-sm';
    const modalBg = isLight ? 'bg-white/95 backdrop-blur-xl ring-indigo-200/30' : 'bg-[#0a0a0a]/95 backdrop-blur-2xl ring-white/10';
    const modalBorderT = isLight ? 'border-indigo-200/30' : 'border-white/10';
    const modalBorderB = isLight ? 'border-indigo-100/20' : 'border-black/40';
    const modalHeaderBorder = isLight ? 'border-indigo-100/30' : 'border-white/5';
    const modalTitle = isLight ? 'text-slate-700' : 'text-white/90';
    const modalClose = isLight ? 'hover:bg-indigo-50 text-slate-400 hover:text-slate-600' : 'hover:bg-white/10 text-zinc-500 hover:text-white';
    const settingRow = isLight
        ? 'bg-indigo-50/30 border-indigo-100/30 hover:bg-indigo-50/50'
        : 'bg-white/5 border-white/5 hover:bg-white/[0.07]';
    const stepperBtn = isLight
        ? 'bg-indigo-50/50 hover:bg-indigo-100/50 text-slate-600 hover:text-indigo-600'
        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white';
    const stepperVal = isLight ? 'text-slate-800' : 'text-white';
    const switchLabel = isLight ? 'text-slate-700' : 'text-white/90';

    return (
        <div ref={containerRef}
            className={`relative h-full flex flex-col items-center justify-between p-6 ${containerBg} border rounded-3xl overflow-hidden shadow-2xl ring-1 transition-all duration-500 ${isFullScreen ? 'rounded-none border-0' : ''}`}
        >
            {!isLight && <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>}

            {/* Mode Switcher */}
            <div className="z-10 w-full flex justify-center mb-8">
                <div className={`flex items-center gap-1 ${dockBg} border rounded-full p-1 shadow-2xl ring-1`}>
                    {Object.keys(modes).map((key) => (
                        <button key={key} onClick={() => switchMode(key)}
                            className={`relative px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ease-out ${mode === key ? dockActive : dockInactive}`}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {mode === key && <span className={`w-1 h-1 rounded-full ${modes[key].color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse-slow`}></span>}
                                {modes[key].label}
                            </span>
                            {mode === key && !isLight && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timer Circle */}
            <div className={`relative z-10 flex items-center justify-center mb-8 group transition-all duration-500 ${isFullScreen ? 'scale-125' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-tr ${modes[mode].glowColor.replace('bg-', 'from-')} to-purple-500/20 blur-3xl rounded-full ${isLight ? 'opacity-20' : 'opacity-40'} group-hover:opacity-60 transition-opacity duration-700`}></div>
                <div className="relative w-80 h-80 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                        {Array.from({ length: 60 }).map((_, i) => {
                            const angle = (i * 6) * (Math.PI / 180);
                            const x1 = 50 + 44 * Math.cos(angle); const y1 = 50 + 44 * Math.sin(angle);
                            const x2 = 50 + 47 * Math.cos(angle); const y2 = 50 + 47 * Math.sin(angle);
                            const isMajor = i % 5 === 0;
                            return <line key={i} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                                className={`${isMajor ? tickMajor : tickMinor} transition-all duration-300`}
                                strokeWidth={isMajor ? '2' : '1'} />;
                        })}
                        <circle cx="50%" cy="50%" r={radius} fill="none" className={trackStroke} strokeWidth="2" />
                        <circle cx="50%" cy="50%" r={radius} fill="none"
                            className={`${modes[mode].progressColor} transition-all duration-1000 ease-linear drop-shadow-[0_0_10px_currentColor]`}
                            strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <div className={`text-7xl font-bold ${timeText} tracking-tighter font-mono tabular-nums mb-2 drop-shadow-lg ${isActive ? 'animate-pulse-slow' : ''}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <p className={`text-xs tracking-[0.2em] uppercase ${modes[mode].color} font-semibold opacity-90`}>
                            {isActive ? 'Simulating High Focus' : 'Ready to Start'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="z-10 w-full flex items-center justify-center gap-8">
                <button onClick={resetTimer} className={`group relative p-4 rounded-full ${ctrlBtn} border transition-all duration-300 backdrop-blur-md`} title="Reset Timer">
                    <RotateCcw size={20} className="relative z-10 group-hover:-rotate-180 transition-transform duration-500" />
                </button>

                <button onClick={toggleTimer}
                    className={`group relative px-8 py-4 rounded-full min-w-[140px] flex items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95`}
                >
                    <div className={`absolute inset-0 rounded-full backdrop-blur-3xl transition-all duration-500 ${playBg}`}></div>
                    {!isLight && <>
                        <div className="absolute inset-0 rounded-full border-t border-white/30 pointer-events-none"></div>
                        <div className="absolute inset-0 rounded-full border-b border-white/5 pointer-events-none"></div>
                        <div className="absolute inset-0 rounded-full border-x border-white/10 pointer-events-none opacity-50"></div>
                    </>}
                    {isLight && <div className="absolute inset-0 rounded-full border border-indigo-200/30 pointer-events-none"></div>}
                    <div className="relative z-10 flex items-center justify-center">
                        {isActive ? (
                            <span className={`text-sm font-medium tracking-[0.3em] uppercase ${modes[mode].color} drop-shadow-[0_0_8px_currentColor]`}>Pause</span>
                        ) : (
                            <span className={`text-sm font-medium tracking-[0.3em] uppercase ${playText} drop-shadow-md`}>Start</span>
                        )}
                    </div>
                </button>

                <button onClick={() => setShowSettings(true)} className={`group relative p-4 rounded-full ${ctrlBtn} border transition-all duration-300 backdrop-blur-md`} title="Settings">
                    <Settings size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                </button>
            </div>

            {/* Full Screen */}
            <div className="absolute bottom-6 left-6 z-20">
                <button onClick={toggleFullScreen} className={`group p-3 rounded-full ${fsBtn} border transition-all duration-300 backdrop-blur-md`}
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}>
                    {isFullScreen ? <Minimize2 size={16} className="opacity-70 group-hover:opacity-100" /> : <Maximize2 size={16} className="opacity-70 group-hover:opacity-100" />}
                </button>
            </div>

            {/* BG Decor */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${isLight ? 'bg-indigo-500/5' : 'bg-indigo-500/10'} rounded-full blur-3xl -z-0 pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 ${isLight ? 'bg-purple-500/5' : 'bg-purple-500/10'} rounded-full blur-3xl -z-0 pointer-events-none`}></div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className={`absolute inset-0 ${modalOverlay}`} onClick={() => setShowSettings(false)}></div>
                    <div className={`w-full max-w-sm relative overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ${modalBg}`}>
                        {!isLight && <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>}
                        <div className={`absolute inset-0 rounded-3xl border-t ${modalBorderT} pointer-events-none`}></div>
                        <div className={`absolute inset-0 rounded-3xl border-b ${modalBorderB} pointer-events-none`}></div>
                        <div className="relative p-6 space-y-6">
                            <div className={`flex items-center justify-between pb-2 border-b ${modalHeaderBorder}`}>
                                <h3 className={`text-sm font-medium ${modalTitle} flex items-center gap-2`}>
                                    <Settings size={16} className="text-indigo-400" />
                                    <span className="tracking-widest uppercase text-xs">Timer Settings</span>
                                </h3>
                                <button onClick={() => setShowSettings(false)} className={`p-1.5 rounded-full ${modalClose} transition-all duration-200 group`}>
                                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {[
                                        { key: 'pomodoro', label: 'Pro Focus', color: 'text-indigo-400' },
                                        { key: 'short', label: 'Short Break', color: 'text-teal-400' },
                                        { key: 'long', label: 'Long Break', color: 'text-blue-400' }
                                    ].map(({ key, label, color }) => (
                                        <div key={key} className={`group flex items-center justify-between p-3 rounded-2xl ${settingRow} border transition-all duration-300`}>
                                            <span className={`text-sm font-medium ${color} tracking-wide`}>{label}</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setSettings(s => ({ ...s, [key]: Math.max(1, s[key] - 1) }))}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full ${stepperBtn} active:scale-90 transition-all`}>-</button>
                                                <div className="w-8 text-center"><span className={`${stepperVal} font-mono font-bold`}>{settings[key]}</span></div>
                                                <button onClick={() => setSettings(s => ({ ...s, [key]: Math.min(90, s[key] + 1) }))}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full ${stepperBtn} active:scale-90 transition-all`}>+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={`space-y-3 pt-2 border-t ${modalHeaderBorder}`}>
                                    <div className={`flex items-center justify-between p-3 rounded-2xl ${settingRow} border transition-all duration-300`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors duration-300 ${settings.alarmEnabled ? 'bg-indigo-500/20 text-indigo-400' : (isLight ? 'bg-slate-100 text-slate-400' : 'bg-black/20 text-zinc-600')}`}>
                                                {settings.alarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                            </div>
                                            <span className={`text-sm font-medium ${switchLabel}`}>Sound Effects</span>
                                        </div>
                                        <button onClick={() => setSettings({ ...settings, alarmEnabled: !settings.alarmEnabled })}
                                            className={`relative w-11 h-6 rounded-full transition-all duration-300 border ${settings.alarmEnabled
                                                ? 'bg-indigo-500/20 border-indigo-500/50'
                                                : (isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10')}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-300 transform ${settings.alarmEnabled
                                                ? 'translate-x-[20px] bg-indigo-400 shadow-[0_0_8px_indigo]'
                                                : `translate-x-0 ${isLight ? 'bg-slate-400' : 'bg-zinc-500'}`
                                                }`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowSettings(false)}
                                className="w-full group relative py-3 rounded-xl overflow-hidden active:scale-[0.98] transition-transform">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                <span className="relative text-xs font-bold text-white tracking-[0.2em] uppercase">Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PomodoroTimer;
