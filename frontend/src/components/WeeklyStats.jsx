import React from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function WeeklyStats({ weeklyData }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
    const data = weeklyData || {
        thisWeek: { problems: 5, time: 12, xp: 450 },
        lastWeek: { problems: 3, time: 8, xp: 280 }
    };

    const calcChange = (current, previous) => {
        const diff = current - previous;
        const percent = previous === 0 ? 100 : Math.round((diff / previous) * 100);
        return { diff, percent, positive: diff >= 0 };
    };

    const problemsChange = calcChange(data.thisWeek.problems, data.lastWeek.problems);
    const timeChange = calcChange(data.thisWeek.time, data.lastWeek.time);
    const xpChange = calcChange(data.thisWeek.xp, data.lastWeek.xp);

    const StatComparison = ({ label, current, previous, change, unit }) => {
        const TrendIcon = change.positive ? TrendingUp : TrendingDown;
        const color = change.positive ? '#10b981' : '#ef4444';
        const bgColor = change.positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

        return (
            <div style={{
                padding: '16px',
                background: isLight ? '#f8f9fc' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color, background: bgColor, padding: '2px 6px', borderRadius: '4px' }}>
                        <TrendIcon size={12} />
                        {change.positive ? '+' : ''}{change.percent}%
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '9px', color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>This Week</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: isLight ? '#1e293b' : '#fff' }}>{current}{unit}</div>
                    </div>
                    <div style={{ color: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)', fontSize: '22px' }}>→</div>
                    <div>
                        <div style={{ fontSize: '9px', color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Last Week</div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)' }}>{previous}{unit}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            padding: '24px',
            background: isLight ? '#fff' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : '0 8px 32px rgba(0,0,0,0.3)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: isLight ? '#1e293b' : '#fff' }}>
                <Calendar size={18} style={{ color: '#06b6d4' }} />
                Weekly Progress
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <StatComparison label="Problems Solved" current={data.thisWeek.problems} previous={data.lastWeek.problems} change={problemsChange} unit="" />
                <StatComparison label="Study Time" current={data.thisWeek.time} previous={data.lastWeek.time} change={timeChange} unit="h" />
                <StatComparison label="XP Earned" current={data.thisWeek.xp} previous={data.lastWeek.xp} change={xpChange} unit="" />
            </div>
        </div>
    );
}
