import React from 'react';
import { Award, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LevelProgress({ levelData }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const data = levelData || {
        currentLevel: 12,
        currentXP: 3450,
        nextLevelXP: 5000,
        totalXP: 48450,
        rank: 'Expert'
    };

    const xpPercent = (data.currentXP / data.nextLevelXP) * 100;
    const levelColors = ['#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'];
    const levelColor = levelColors[data.currentLevel % levelColors.length];

    return (
        <div style={{
            padding: '24px',
            background: isLight ? '#fff' : 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : '0 8px 32px rgba(0,0,0,0.3)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: isLight ? '#1e293b' : '#fff' }}>
                <Award size={18} style={{ color: levelColor }} />
                Level Progress
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Level Badge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${levelColor}40, ${levelColor}15)`,
                        border: `3px solid ${levelColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                    }}>
                        <div style={{ fontSize: '36px', fontWeight: 900, color: levelColor }}>{data.currentLevel}</div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: levelColor, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Level</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                        {data.rank}
                    </div>
                </div>

                {/* XP Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)' }}>
                            <span>Next Level</span>
                            <span>{data.currentXP.toLocaleString()} / {data.nextLevelXP.toLocaleString()} XP</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '12px',
                            background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}`,
                        }}>
                            <div style={{
                                width: `${xpPercent}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${levelColor}, ${levelColor}dd)`,
                                transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }} />
                        </div>
                    </div>

                    <div style={{ padding: '12px', background: isLight ? '#f8f9fc' : 'rgba(255,255,255,0.05)', borderRadius: '8px', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                            <Zap size={12} style={{ color: '#facc15' }} />
                            Total Progress
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: levelColor }}>
                            {data.totalXP.toLocaleString()} XP
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
