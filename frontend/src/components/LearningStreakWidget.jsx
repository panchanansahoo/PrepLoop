import React from 'react';
import { Flame, Star, TrendingUp, Trophy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LearningStreakWidget({ data }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
    // Default mock data if none provided
    const streak = data?.streak || 14;
    const bestStreak = data?.bestStreak || 21;
    const weekProgress = data?.weekProgress || [true, true, true, false, false, false, false]; // M, T, W, T, F, S, S

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        title: isLight ? '#0f172a' : '#f8fafc',
        muted: isLight ? '#64748b' : '#94a3b8',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
    };

    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <div style={{
            padding: '28px',
            background: c.bg,
            borderRadius: '28px',
            border: c.border,
            boxShadow: c.shadow,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '42px', height: '42px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.1))',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)'
                    }}>
                        <Flame size={20} color="#f97316" style={{ filter: 'drop-shadow(0 2px 4px rgba(249, 115, 22, 0.3))' }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Learning Streak</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Keep the flame alive!</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: c.title, letterSpacing: '-1px', lineHeight: '1' }}>
                        {streak} <span style={{ fontSize: '16px', color: '#f97316', fontWeight: 700 }}>days</span>
                    </div>
                </div>
            </div>

            {/* Weekly Path */}
            <div style={{
                background: c.cardBg,
                border: c.cardBorder,
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: c.title }}>This Week</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: c.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trophy size={14} color="#f59e0b" /> Best: {bestStreak} days
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {weekProgress.map((isComplete, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                background: isComplete 
                                    ? 'linear-gradient(135deg, #f97316, #ef4444)' 
                                    : (isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)'),
                                border: isComplete
                                    ? 'none'
                                    : (isLight ? '1px dashed rgba(15,23,42,0.2)' : '1px dashed rgba(255,255,255,0.2)'),
                                color: isComplete ? 'white' : c.muted,
                                boxShadow: isComplete ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {isComplete ? <Flame size={16} fill="currentColor" /> : <span style={{ fontSize: '12px', fontWeight: 600 }}>{days[idx]}</span>}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: isComplete ? '#f97316' : c.muted }}>{days[idx]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Motivation Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(59, 130, 246, 0.1))',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <TrendingUp size={20} color="#38bdf8" />
                <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isLight ? '#0369a1' : '#bae6fd' }}>You're in the top 15%</div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: isLight ? '#0c4a6e' : '#7dd3fc', opacity: 0.8, marginTop: '2px' }}>
                        Your consistency is exceptional this month.
                    </div>
                </div>
            </div>
        </div>
    );
}
