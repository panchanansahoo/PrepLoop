import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Target } from 'lucide-react';

const STORAGE_KEY = 'preploop_weekly_goals';

function getWeekKey() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
}

function getInitialGoals(weeklyData) {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.week === getWeekKey()) {
                if (weeklyData) {
                    parsed.items = parsed.items.map(item => {
                        if (item.label === 'Easy problems') return { ...item, done: weeklyData.easy || 0 };
                        if (item.label === 'Medium problems') return { ...item, done: weeklyData.medium || 0 };
                        if (item.label === 'Hard problems') return { ...item, done: weeklyData.hard || 0 };
                        return item;
                    });
                }
                return parsed;
            }
        }
    } catch { }

    return {
        week: getWeekKey(), target: 15, completed: 0, items: [
            { label: 'Easy problems', target: 5, done: weeklyData?.easy || 0 },
            { label: 'Medium problems', target: 7, done: weeklyData?.medium || 0 },
            { label: 'Hard problems', target: 3, done: weeklyData?.hard || 0 },
        ]
    };
}

export default function WeeklyGoals({ weeklyData }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [goals, setGoals] = useState(() => getInitialGoals(weeklyData));

    useEffect(() => {
        if (weeklyData) {
            setGoals(prev => ({
                ...prev,
                items: prev.items.map(item => {
                    if (item.label === 'Easy problems') return { ...item, done: weeklyData.easy || 0 };
                    if (item.label === 'Medium problems') return { ...item, done: weeklyData.medium || 0 };
                    if (item.label === 'Hard problems') return { ...item, done: weeklyData.hard || 0 };
                    return item;
                })
            }));
        }
    }, [weeklyData]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }, [goals]);

    const totalDone = goals.items.reduce((s, i) => s + i.done, 0);
    const totalTarget = goals.items.reduce((s, i) => s + i.target, 0);
    const pct = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;

    const size = 110, stroke = 10, radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        shadowHover: isLight ? '0 16px 48px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)' : '0 16px 48px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
        title: isLight ? '#0f172a' : '#f8fafc',
        sub: isLight ? '#64748b' : '#94a3b8',
        ringTrack: isLight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.06)',
        pctColor: pct >= 100 ? '#10b981' : (isLight ? '#0f172a' : '#fff'),
        pctSub: isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
        itemLabel: isLight ? '#334155' : 'rgba(255,255,255,0.7)',
        itemCount: isLight ? '#64748b' : 'rgba(255,255,255,0.5)',
        barTrack: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255,255,255,0.04)',
    };

    return (
        <div className="premium-weekly-goals-card transition-all duration-300">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className={`p-2 rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/20'}`}>
                    <Target size={20} className={isLight ? 'text-indigo-600' : 'text-indigo-400'} />
                </div>
                <div>
                    <div className="font-extrabold text-xl tracking-tight" style={{ color: c.title, lineHeight: 1.1 }}>Weekly Goals</div>
                    <div className="text-xs font-semibold mt-1" style={{ color: c.sub }}>Track your weekly progress</div>
                </div>
            </div>

            <div className="flex px-6 pb-6 pt-2 items-center gap-6">
                {/* Progress Ring */}
                <div className="relative shrink-0 flex items-center justify-center">
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 10px ${pct >= 100 ? 'rgba(16,185,129,0.3)' : 'rgba(129,140,248,0.2)'})` }}>
                        <circle cx={size / 2} cy={size / 2} r={radius} stroke={c.ringTrack} strokeWidth={stroke} fill="none" />
                        <circle cx={size / 2} cy={size / 2} r={radius}
                            stroke={pct >= 100 ? '#10b981' : '#818cf8'}
                            strokeWidth={stroke} fill="none"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black tabular-nums tracking-tighter" style={{ color: c.pctColor, lineHeight: 1 }}>{pct}%</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: c.pctSub }}>{totalDone}/{totalTarget}</div>
                    </div>
                </div>

                {/* Goal Items */}
                <div className="flex-1 flex flex-col justify-center gap-4">
                    {goals.items.map((item, idx) => {
                        const itemPct = item.target > 0 ? (item.done / item.target) * 100 : 0;
                        const colors = ['#10b981', '#f59e0b', '#ef4444'];
                        const glowColors = ['rgba(16,185,129,0.4)', 'rgba(245,158,11,0.4)', 'rgba(239,68,68,0.4)'];
                        return (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[13px] font-semibold tracking-tight" style={{ color: c.itemLabel }}>{item.label}</span>
                                    <span className="text-[11px] font-bold tabular-nums" style={{ color: c.itemCount }}>
                                        {item.done} / {item.target}
                                    </span>
                                </div>
                                <div style={{ height: 8, borderRadius: 4, background: c.barTrack, overflow: 'hidden', border: isLight ? '1px solid rgba(0,0,0,0.02)' : '1px solid rgba(255,255,255,0.02)' }}>
                                    <div style={{
                                        width: `${Math.min(itemPct, 100)}%`, height: '100%', borderRadius: 4,
                                        background: colors[idx],
                                        boxShadow: `0 0 10px ${glowColors[idx]}`,
                                        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <style>{`
                .premium-weekly-goals-card {
                    background: ${c.bg};
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: ${c.border};
                    border-radius: 24px;
                    box-shadow: ${c.shadow};
                    overflow: hidden;
                    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .premium-weekly-goals-card:hover {
                    box-shadow: ${c.shadowHover};
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
