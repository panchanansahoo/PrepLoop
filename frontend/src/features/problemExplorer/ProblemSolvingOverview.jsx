import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Trophy, Zap, TrendingUp } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthData(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const weeks = [];
    let week = [];
    for (let i = firstDay - 1; i >= 0; i--) week.push({ day: prevDays - i, current: false });
    for (let d = 1; d <= daysInMonth; d++) {
        week.push({ day: d, current: true });
        if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
        let nextDay = 1;
        while (week.length < 7) week.push({ day: nextDay++, current: false });
        weeks.push(week);
    }
    return weeks;
}

function calcBestStreak(dates) {
    if (!dates.length) return 0;
    const unique = [...new Set(dates)].sort();
    let best = 1, current = 1;
    for (let i = 1; i < unique.length; i++) {
        const diff = (new Date(unique[i]) - new Date(unique[i - 1])) / 86400000;
        if (diff === 1) { current++; best = Math.max(best, current); } else current = 1;
    }
    return best;
}

function AnimatedNumber({ value, duration = 800 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const startTime = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            setDisplay(Math.round((1 - Math.pow(1 - progress, 3)) * value));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);
    return <>{display}</>;
}

export function ProblemSolvingOverview({
    solvedSet, totalCount, diffCounts, streak, isLight, solvedByDifficulty, children
}) {
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [ringReady, setRingReady] = useState(false);

    useEffect(() => { const t = setTimeout(() => setRingReady(true), 120); return () => clearTimeout(t); }, []);

    const solvedCount = solvedSet.size;
    const pct = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

    const solveDates = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('cl_solve_dates') || '[]'); } catch { return []; }
    }, []);
    const bestStreak = useMemo(() => calcBestStreak(solveDates), [solveDates]);
    const activeDays = useMemo(() => {
        const set = new Set();
        solveDates.forEach(d => {
            const dt = new Date(d);
            if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) set.add(dt.getDate());
        });
        return set;
    }, [solveDates, calYear, calMonth]);

    const weeks = useMemo(() => getMonthData(calYear, calMonth), [calYear, calMonth]);
    const monthName = new Date(calYear, calMonth).toLocaleString('en-US', { month: 'long' });
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;

    const nav = (dir) => {
        const d = new Date(calYear, calMonth + dir);
        setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
    };

    // Ring math
    const R = 52, SW = 7, C = 2 * Math.PI * R;
    const offset = C * (1 - (ringReady ? pct : 0) / 100);

    const diffs = [
        { key: 'Easy', color: '#34d399', glow: 'rgba(52,211,153,0.3)', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))', border: 'rgba(52,211,153,0.2)' },
        { key: 'Medium', label: 'Med.', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))', border: 'rgba(245,158,11,0.2)' },
        { key: 'Hard', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.06))', border: 'rgba(239,68,68,0.2)' },
    ];

    const sub = isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)';
    const txt = isLight ? '#0f172a' : '#f8fafc';
    const dimText = isLight ? '#64748b' : 'rgba(255,255,255,0.5)';

    return (
        <>
            {/* ━━ LEFT: Progress + Difficulty ━━ */}
            <div style={{
                position: 'relative', overflow: 'hidden', height: '100%',
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95))'
                    : 'linear-gradient(135deg, rgba(15,15,25,0.8), rgba(20,20,35,0.6))',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                boxShadow: isLight
                    ? '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)'
                    : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
                padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            }}>
                {/* Decorative gradient mesh */}
                <div style={{
                    position: 'absolute', top: -60, right: -40, width: 200, height: 200,
                    background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -40, left: -20, width: 150, height: 150,
                    background: 'radial-gradient(circle, rgba(110,231,183,0.06), transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Progress ring */}
                <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <defs>
                            <linearGradient id="ovRingGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="40%" stopColor="#6366f1" />
                                <stop offset="70%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                            <filter id="ringGlow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <circle cx="60" cy="60" r={R} stroke={isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'} strokeWidth={SW} fill="none" />
                        <circle cx="60" cy="60" r={R} stroke="url(#ovRingGrad)" strokeWidth={SW} fill="none"
                            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
                            filter="url(#ringGlow)"
                            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{
                            fontSize: 30, fontWeight: 900, color: txt, lineHeight: 1,
                            letterSpacing: '-0.04em',
                            background: solvedCount > 0 ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'none',
                            WebkitBackgroundClip: solvedCount > 0 ? 'text' : 'unset',
                            WebkitTextFillColor: solvedCount > 0 ? 'transparent' : txt,
                        }}>
                            <AnimatedNumber value={solvedCount} />
                        </span>
                        <span style={{ fontSize: 11, color: sub, fontWeight: 600, marginTop: 2 }}>of {totalCount}</span>
                        <span style={{
                            fontSize: 9, fontWeight: 700, color: dimText, textTransform: 'uppercase',
                            letterSpacing: 1, marginTop: 4,
                        }}>solved</span>
                    </div>
                </div>

                {/* Difficulty cards — vertical stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    {diffs.map(d => {
                        const solved = solvedByDifficulty?.[d.key] || 0;
                        const total = diffCounts[d.key] || 0;
                        const p = total > 0 ? (solved / total) * 100 : 0;
                        return (
                            <div key={d.key} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '8px 14px', borderRadius: 12,
                                background: d.gradient,
                                border: `1px solid ${d.border}`,
                                transition: 'all 0.25s ease', cursor: 'default',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${d.glow}`; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <span style={{
                                    fontSize: 11, fontWeight: 800, color: d.color,
                                    textTransform: 'uppercase', letterSpacing: 0.5, width: 40,
                                }}>
                                    {d.label || d.key}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        width: '100%', height: 5, borderRadius: 3,
                                        background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${p}%`, height: '100%', borderRadius: 3,
                                            background: `linear-gradient(90deg, ${d.color}, ${d.color}cc)`,
                                            boxShadow: p > 0 ? `0 0 8px ${d.glow}` : 'none',
                                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                                        }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 48, justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: txt, lineHeight: 1 }}>
                                        <AnimatedNumber value={solved} />
                                    </span>
                                    <span style={{ fontSize: 11, color: sub, fontWeight: 600 }}>/{total}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {children}

            {/* ━━ RIGHT: Calendar ━━ */}
            <div style={{
                position: 'relative', overflow: 'hidden',
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95))'
                    : 'linear-gradient(135deg, rgba(15,15,25,0.8), rgba(20,20,35,0.6))',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                boxShadow: isLight
                    ? '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)'
                    : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
                padding: '18px 20px', display: 'flex', flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: txt, letterSpacing: '-0.02em' }}>{monthName}</div>
                        <div style={{ fontSize: 11, color: dimText, fontWeight: 600 }}>{calYear}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => nav(-1)} style={btnStyle(isLight)}><ChevronLeft size={14} /></button>
                        <button onClick={() => nav(1)} style={btnStyle(isLight)}><ChevronRight size={14} /></button>
                    </div>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
                    {DAYS.map((d, i) => (
                        <div key={i} style={{
                            textAlign: 'center', fontSize: 9, fontWeight: 700,
                            color: dimText, padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{d}</div>
                    ))}
                </div>

                {/* Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    {weeks.map((week, wi) => (
                        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                            {week.map((cell, ci) => {
                                const isToday = isCurrentMonth && cell.current && cell.day === today.getDate();
                                const isActive = cell.current && activeDays.has(cell.day);
                                return (
                                    <div key={ci} style={{
                                        aspectRatio: '1', borderRadius: 7,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: isToday ? 800 : isActive ? 700 : 500,
                                        color: !cell.current ? (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)')
                                            : isToday ? '#fff'
                                                : isActive ? '#34d399'
                                                    : (isLight ? '#475569' : 'rgba(255,255,255,0.45)'),
                                        background: isToday
                                            ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                                            : isActive
                                                ? (isLight ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.08)')
                                                : 'transparent',
                                        boxShadow: isToday ? '0 3px 12px rgba(139,92,246,0.35)'
                                            : isActive ? `0 0 8px rgba(52,211,153,0.15)` : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'default',
                                        position: 'relative',
                                    }}
                                        onMouseEnter={e => { if (cell.current && !isToday) e.currentTarget.style.background = isLight ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.06)'; }}
                                        onMouseLeave={e => { if (cell.current && !isToday) e.currentTarget.style.background = isActive ? (isLight ? 'rgba(52,211,153,0.12)' : 'rgba(52,211,153,0.08)') : 'transparent'; }}
                                    >
                                        {cell.day}
                                        {isActive && !isToday && (
                                            <div style={{
                                                position: 'absolute', bottom: 2, width: 3, height: 3,
                                                borderRadius: '50%', background: '#34d399',
                                                boxShadow: '0 0 4px rgba(52,211,153,0.5)',
                                            }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer stats */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 10, paddingTop: 10,
                    borderTop: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Flame size={12} color="#fb923c" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fb923c' }}>{streak}</span>
                            <span style={{ fontSize: 10, color: dimText, fontWeight: 600 }}>current</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Trophy size={12} color="#fbbf24" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{bestStreak}</span>
                            <span style={{ fontSize: 10, color: dimText, fontWeight: 600 }}>best</span>
                        </div>
                    </div>
                    <div style={{
                        fontSize: 10, fontWeight: 700, color: dimText,
                        padding: '3px 10px', borderRadius: 8,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                    }}>
                        {activeDays.size} active days
                    </div>
                </div>
            </div>
        </>
    );
}

function btnStyle(isLight) {
    return {
        width: 28, height: 28, borderRadius: 8,
        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isLight ? '#475569' : 'rgba(255,255,255,0.5)', padding: 0,
        transition: 'all 0.2s ease',
    };
}
