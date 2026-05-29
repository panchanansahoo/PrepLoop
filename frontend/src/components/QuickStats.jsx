import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Flame, CheckCircle2, Target, Zap, CalendarDays, Trophy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function AnimatedCounter({ end, duration = 1200, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = 0;
                const startTime = performance.now();
                const animate = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.round(start + (end - start) * eased));
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
        }, { threshold: 0.3 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
}

export default function QuickStats({ data }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const stats = data || { streak: 0, problemsSolved: 0, avgScore: 0, attendInterview: 0 };
    const hasActivity = [stats.streak, stats.problemsSolved, stats.avgScore, stats.attendInterview].some((value) => value > 0);

    const cards = [
        {
            label: 'Day Streak',
            value: stats.streak,
            icon: Flame,
            color: '#f59e0b',
            bgGlow: isLight ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.08)',
            borderGlow: isLight ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            suffix: '',
            activeHint: 'Keep it alive today',
            emptyHint: 'Your streak starts with one solve'
        },
        {
            label: 'Problems Solved',
            value: stats.problemsSolved,
            icon: CheckCircle2,
            color: '#22c55e',
            bgGlow: isLight ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.08)',
            borderGlow: isLight ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            suffix: '',
            activeHint: 'Practice sessions completed',
            emptyHint: 'No sessions logged yet'
        },
        {
            label: 'Avg Score',
            value: stats.avgScore,
            icon: Target,
            color: isLight ? '#6366f1' : '#a78bfa',
            bgGlow: isLight ? 'rgba(99,102,241,0.08)' : 'rgba(167,139,250,0.08)',
            borderGlow: isLight ? 'rgba(99,102,241,0.2)' : 'rgba(167, 139, 250, 0.2)',
            suffix: '%',
            activeHint: 'Your rolling performance average',
            emptyHint: 'Score appears after your first review'
        },
        {
            label: 'Attend Interview',
            value: stats.attendInterview,
            icon: Zap,
            color: '#38bdf8',
            bgGlow: isLight ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.08)',
            borderGlow: isLight ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            suffix: '',
            activeHint: 'Completed mock interviews',
            emptyHint: 'Start your first mock interview'
        }
    ];

    const c = {
        baseBg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        shadowHover: isLight ? '0 16px 48px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)' : '0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
        title: isLight ? '#0f172a' : '#f8fafc',
        sub: isLight ? '#64748b' : '#94a3b8',
    };

    return (
        <section className="quick-stats-shell">
            <style>{`
                .quick-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
                    gap: 16px;
                }
                .quick-stat-card {
                    padding: 24px;
                    border-radius: 24px;
                    border: ${c.border};
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    box-shadow: ${c.shadow};
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: relative;
                    overflow: hidden;
                    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .quick-stat-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    pointer-events: none;
                    transition: opacity 0.4s ease;
                }
                .quick-stat-card:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: ${c.shadowHover};
                }
                .quick-stat-card > * {
                    position: relative;
                    z-index: 1;
                }
                .quick-stat-top-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .quick-stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                }
                .quick-stat-label {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: ${c.title};
                    letter-spacing: 0.2px;
                }
                .quick-stat-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    line-height: 1;
                    text-shadow: ${isLight ? 'none' : '0 4px 16px rgba(0,0,0,0.2)'};
                }
                .quick-stat-card-empty {
                    opacity: 0.7;
                    filter: saturate(0.5);
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="quick-stats-grid">
            {cards.map((card) => {
                const Icon = card.icon;
                const isEmpty = !hasActivity && card.value === 0;
                const displayValue = card.suffix === '%' ? `${card.value}%` : card.value;
                return (
                    <div
                        key={card.label}
                        className={`quick-stat-card ${isEmpty ? 'quick-stat-card-empty' : ''}`}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '24px',
                            borderRadius: '16px',
                            background: isLight ? `${card.color}15` : `${card.color}12`,
                            border: `1px solid ${isLight ? `${card.color}30` : `${card.color}20`}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minHeight: '130px',
                        }}
                    >
                        <div className="quick-stat-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.color, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <Icon size={18} />
                                {card.label}
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                                {card.value > 0 ? (
                                    <AnimatedCounter end={card.value} suffix={card.suffix} />
                                ) : (
                                    <span>{displayValue}</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        </section>
    );
}

const HEATMAP_DAYS = 365;

const getUtcDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const getCellTone = (count, maxCount, isLight) => {
    if (!count) {
        return isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    }

    const ratio = Math.min(1, count / Math.max(maxCount, 1));
    const tier = Math.min(4, Math.max(1, Math.ceil(ratio * 4)));

    if (isLight) {
        const tones = [
            'rgba(245, 158, 11, 0.16)',
            'rgba(245, 158, 11, 0.32)',
            'rgba(245, 158, 11, 0.48)',
            'rgba(245, 158, 11, 0.72)',
        ];
        return tones[tier - 1];
    }

    const tones = [
        'rgba(251, 191, 36, 0.16)',
        'rgba(251, 191, 36, 0.28)',
        'rgba(251, 146, 60, 0.42)',
        'rgba(251, 115, 32, 0.72)',
    ];
    return tones[tier - 1];
};

export function StreakHeatmap({
    heatmapData = {},
    streak = 0,
    bestStreak = 0,
    title = 'Streak Heatmap',
    subtitle = 'A 365-day view of your daily practice rhythm.',
    className = '',
}) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const { cells, activeDays, totalSolved, maxCount, todayCount } = useMemo(() => {
        const today = new Date();
        const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - (HEATMAP_DAYS - 1));

        const startPadding = startDate.getUTCDay();
        const cellsForGrid = Array.from({ length: startPadding }, () => ({ blank: true }));
        let maxValue = 0;
        let solvedDays = 0;
        let solvedTotal = 0;
        let currentDayCount = 0;

        for (let offset = 0; offset < HEATMAP_DAYS; offset += 1) {
            const day = new Date(startDate);
            day.setUTCDate(startDate.getUTCDate() + offset);
            const key = getUtcDateKey(day);
            const count = Number(heatmapData?.[key]?.solved || 0);

            if (count > 0) {
                solvedDays += 1;
                solvedTotal += count;
            }

            if (offset === HEATMAP_DAYS - 1) {
                currentDayCount = count;
            }

            maxValue = Math.max(maxValue, count);
            cellsForGrid.push({ date: key, count });
        }

        while (cellsForGrid.length % 7 !== 0) {
            cellsForGrid.push({ blank: true });
        }

        return {
            cells: cellsForGrid,
            activeDays: solvedDays,
            totalSolved: solvedTotal,
            maxCount: maxValue,
            todayCount: currentDayCount,
        };
    }, [heatmapData]);

    const todayKey = getUtcDateKey(new Date());

    const legend = [0, 1, 2, 3, 4].map((tier) => ({
        key: tier,
        color: getCellTone(tier, 4, isLight),
    }));

    return (
        <section
            className={className}
            style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
                    : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
                border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 24,
                padding: '24px 28px',
                boxShadow: isLight
                    ? '0 12px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)'
                    : '0 24px 64px -20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 18 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(251,191,36,0.12)', border: '1px solid rgba(245,158,11,0.18)' }}>
                            <Flame size={16} color={isLight ? '#d97706' : '#fbbf24'} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isLight ? '#111827' : '#fff' }}>{title}</h3>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: isLight ? 'rgba(17,24,39,0.55)' : 'rgba(255,255,255,0.42)' }}>{subtitle}</p>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, minWidth: 280 }}>
                    {[
                        { label: 'Current', value: `${streak}d`, icon: Target, color: '#f59e0b' },
                        { label: 'Best', value: `${bestStreak}d`, icon: Trophy, color: '#f97316' },
                        { label: 'Solved days', value: activeDays, icon: CalendarDays, color: '#22c55e' },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.label}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 12,
                                    background: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255,255,255,0.03)',
                                    border: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: isLight ? 'rgba(17,24,39,0.58)' : 'rgba(255,255,255,0.52)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                    <Icon size={13} color={item.color} />
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 800, color: item.color }}>{item.value}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: isLight ? 'rgba(17,24,39,0.5)' : 'rgba(255,255,255,0.42)' }}>
                    {totalSolved > 0 ? `${totalSolved} solved submissions across the last 365 days.` : 'Your heatmap will fill in as you solve and submit more problems.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isLight ? 'rgba(17,24,39,0.42)' : 'rgba(255,255,255,0.38)', fontSize: 11 }}>
                    {legend.map((entry) => (
                        <span
                            key={entry.key}
                            title={entry.key === 0 ? 'No activity' : `${entry.key}+ submissions in a day`}
                            style={{ width: 11, height: 11, borderRadius: 3, display: 'inline-block', background: entry.color, border: isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.06)' }}
                        />
                    ))}
                    <span>Less</span>
                    <span>More</span>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridAutoFlow: 'column',
                    gridTemplateRows: 'repeat(7, 12px)',
                    gridAutoColumns: '12px',
                    gap: 4,
                    overflowX: 'auto',
                    paddingBottom: 4,
                }}
                aria-label="Streak heatmap grid"
            >
                {cells.map((cell, index) => {
                    if (cell.blank) {
                        return <span key={`blank-${index}`} aria-hidden="true" style={{ width: 12, height: 12 }} />;
                    }

                    const tone = getCellTone(cell.count, maxCount, isLight);
                    const label = `${cell.date}: ${cell.count} solve${cell.count === 1 ? '' : 's'}`;
                    const isToday = cell.date === todayKey;

                    return (
                        <span
                            key={cell.date}
                            title={label}
                            aria-label={label}
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 4,
                                background: tone,
                                border: isToday
                                    ? '1px solid rgba(251, 146, 60, 0.8)'
                                    : isLight
                                        ? '1px solid rgba(15, 23, 42, 0.06)'
                                        : '1px solid rgba(255, 255, 255, 0.06)',
                                boxShadow: cell.count > 0 ? '0 0 0 1px rgba(251, 146, 60, 0.08)' : 'none',
                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                            }}
                        />
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: isLight ? 'rgba(17,24,39,0.45)' : 'rgba(255,255,255,0.34)' }}>
                    {todayCount > 0 ? `Today: ${todayCount} solve${todayCount === 1 ? '' : 's'} already logged.` : 'No activity logged today yet.'}
                </div>
                <div style={{ fontSize: 12, color: isLight ? 'rgba(17,24,39,0.45)' : 'rgba(255,255,255,0.34)' }}>
                    Keep the chain alive with one solve a day.
                </div>
            </div>
        </section>
    );
}
