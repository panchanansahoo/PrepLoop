import React from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function WeeklyStats({ weeklyData }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
    const data = weeklyData || {
        thisWeek: { problems: 5, time: 12, points: 450 },
        lastWeek: { problems: 3, time: 8, points: 280 }
    };

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

    const calcChange = (current, previous) => {
        const diff = current - previous;
        const percent = previous === 0 ? 100 : Math.round((diff / previous) * 100);
        return { diff, percent, positive: diff >= 0 };
    };

    const problemsChange = calcChange(data.thisWeek.problems, data.lastWeek.problems);
    const timeChange = calcChange(data.thisWeek.time, data.lastWeek.time);
    const pointsChange = calcChange(data.thisWeek.points, data.lastWeek.points);

    const StatComparison = ({ label, current, previous, change, unit }) => {
        const TrendIcon = change.positive ? TrendingUp : TrendingDown;
        const color = change.positive ? '#10b981' : '#ef4444';
        const bgColor = change.positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

        return (
            <div style={{
                padding: '20px',
                background: c.cardBg,
                borderRadius: '16px',
                border: c.cardBorder,
                transition: 'transform 0.3s ease, background 0.3s ease',
                cursor: 'default',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = c.cardBg; }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color, background: bgColor, padding: '4px 8px', borderRadius: '6px' }}>
                        <TrendIcon size={14} />
                        {change.positive ? '+' : ''}{change.percent}%
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: c.muted, marginBottom: '4px', textTransform: 'uppercase' }}>This Week</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: c.title, lineHeight: 1 }}>{current}{unit}</div>
                    </div>
                    <div style={{ color: c.muted, fontSize: '20px', paddingBottom: '4px', opacity: 0.5 }}>→</div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: c.muted, marginBottom: '4px', textTransform: 'uppercase' }}>Last Week</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: c.text, lineHeight: 1 }}>{previous}{unit}</div>
                    </div>
                </div>
            </div>
        );
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
            overflow: 'hidden',
            position: 'relative',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', 
                    background: isLight ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.12)', 
                    border: '1px solid rgba(6,182,212,0.18)' 
                }}>
                    <Calendar size={18} style={{ color: '#06b6d4' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Weekly Progress</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Compare your activity with last week</p>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                <StatComparison label="Problems Solved" current={data.thisWeek.problems} previous={data.lastWeek.problems} change={problemsChange} unit="" />
                <StatComparison label="Study Time" current={data.thisWeek.time} previous={data.lastWeek.time} change={timeChange} unit="h" />
                <StatComparison label="Points Earned" current={data.thisWeek.points} previous={data.lastWeek.points} change={pointsChange} unit="" />
            </div>
        </div>
    );
}
