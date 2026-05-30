import { Award, Star, Zap, Code, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AchievementsWidget({ data }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Mock data if none passed
    const achievements = data?.achievements || [
        { id: 1, title: 'Array Master', desc: 'Solved 50 array problems', icon: <Code size={18} />, color: '#ec4899', isNew: true },
        { id: 2, title: 'Speed Demon', desc: 'Solved in < 15 mins', icon: <Zap size={18} />, color: '#eab308', isNew: true },
        { id: 3, title: 'Flawless logic', desc: '0 bugs on first run', icon: <Shield size={18} />, color: '#3b82f6', isNew: false },
    ];

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        title: isLight ? '#0f172a' : '#f8fafc',
        muted: isLight ? '#64748b' : '#94a3b8',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
    };

    return (
        <div style={{
            padding: '24px 28px',
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
            gap: '20px',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1))',
                        border: '1px solid rgba(236, 72, 153, 0.2)',
                        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)'
                    }}>
                        <Award size={20} color="#ec4899" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Recent Badges</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Your digital trophy case</p>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '12px', fontWeight: 700, color: '#ec4899',
                    background: 'rgba(236, 72, 153, 0.1)', padding: '6px 10px', borderRadius: '8px'
                }}>
                    <Star size={12} fill="#ec4899" /> 12 Total
                </div>
            </div>

            {/* Grid */}
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                flex: 1,
            }}>
                {achievements.map((ach) => (
                    <div key={ach.id} style={{
                        flex: '1 1 120px',
                        background: c.cardBg,
                        border: c.cardBorder,
                        borderRadius: '20px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = isLight ? `0 12px 24px ${ach.color}15` : `0 12px 24px ${ach.color}20`;
                        e.currentTarget.style.borderColor = `${ach.color}40`;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = c.cardBorder.split(' ')[2];
                    }}>
                        {/* New Badge */}
                        {ach.isNew && (
                            <div style={{
                                position: 'absolute', top: '8px', right: '8px',
                                background: '#ec4899', color: 'white',
                                fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                                padding: '2px 6px', borderRadius: '4px',
                                letterSpacing: '0.5px'
                            }}>
                                New
                            </div>
                        )}
                        
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            background: `linear-gradient(135deg, ${ach.color}20, ${ach.color}10)`,
                            border: `1px solid ${ach.color}30`,
                            display: 'grid', placeItems: 'center',
                            color: ach.color,
                            boxShadow: `0 8px 16px ${ach.color}15`
                        }}>
                            {ach.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: c.title, marginBottom: '2px' }}>{ach.title}</div>
                            <div style={{ fontSize: '11px', fontWeight: 500, color: c.muted, lineHeight: '1.4' }}>{ach.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
