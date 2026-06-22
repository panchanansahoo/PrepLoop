import { Trophy, Crown, Medal, TrendingUp, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LeaderboardWidget({ data }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Mock data if none passed
    const leaderboard = data?.leaderboard || [
        { id: 1, name: 'Alex T.', score: 2450, rank: 1, change: '+2', avatar: 'AT', isCurrentUser: false },
        { id: 2, name: 'You', score: 2100, rank: 2, change: '+1', avatar: 'U', isCurrentUser: true },
        { id: 3, name: 'Sarah M.', score: 1950, rank: 3, change: '-1', avatar: 'SM', isCurrentUser: false },
        { id: 4, name: 'David K.', score: 1840, rank: 4, change: '0', avatar: 'DK', isCurrentUser: false },
        { id: 5, name: 'Emma L.', score: 1720, rank: 5, change: '+3', avatar: 'EL', isCurrentUser: false },
    ];

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        title: isLight ? '#0f172a' : '#f8fafc',
        muted: isLight ? '#64748b' : '#94a3b8',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.03)' : 'rgba(255, 255, 255, 0.03)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.06)',
        currentUserBg: isLight ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' : 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
        currentUserBorder: isLight ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.4)',
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={18} color="#eab308" style={{ filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.4))' }} />;
        if (rank === 2) return <Medal size={18} color="#94a3b8" />;
        if (rank === 3) return <Medal size={18} color="#b45309" />;
        return <span style={{ fontSize: '13px', fontWeight: 800, color: c.muted, width: '18px', textAlign: 'center', display: 'inline-block' }}>#{rank}</span>;
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
            height: '100%'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(245, 158, 11, 0.1))',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        boxShadow: '0 4px 12px rgba(234, 179, 8, 0.1)'
                    }}>
                        <Trophy size={18} color="#eab308" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Leaderboard</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Global Prep League</p>
                    </div>
                </div>
                <button style={{
                    background: c.cardBg,
                    border: c.cardBorder,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: c.title,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <Users size={14} /> Full Standings
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {leaderboard.map((user, _idx) => (
                    <div key={user.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: user.isCurrentUser ? c.currentUserBg : c.cardBg,
                        border: user.isCurrentUser ? c.currentUserBorder : c.cardBorder,
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                    }}
                    onMouseEnter={(e) => {
                        if (!user.isCurrentUser) {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.background = isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!user.isCurrentUser) {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.background = c.cardBg;
                        }
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                                {getRankIcon(user.rank)}
                            </div>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: user.isCurrentUser ? 'linear-gradient(135deg, #6366f1, #a855f7)' : (isLight ? '#e2e8f0' : '#334155'),
                                color: user.isCurrentUser ? 'white' : c.title,
                                display: 'grid', placeItems: 'center',
                                fontSize: '12px', fontWeight: 700,
                                border: user.isCurrentUser ? '2px solid white' : 'none',
                                boxShadow: user.isCurrentUser ? '0 0 0 2px rgba(99, 102, 241, 0.4)' : 'none'
                            }}>
                                {user.avatar}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: user.isCurrentUser ? 800 : 700,
                                    color: user.isCurrentUser ? (isLight ? '#4338ca' : '#c084fc') : c.title
                                }}>
                                    {user.name}
                                </span>
                                <span style={{ fontSize: '11px', color: c.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {user.change.startsWith('+') ? (
                                        <TrendingUp size={10} color="#22c55e" />
                                    ) : user.change.startsWith('-') ? (
                                        <TrendingUp size={10} color="#ef4444" style={{ transform: 'rotate(180deg)' }} />
                                    ) : null}
                                    {user.change !== '0' ? user.change : 'no change'}
                                </span>
                            </div>
                        </div>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            color: user.isCurrentUser ? (isLight ? '#4f46e5' : '#d8b4fe') : c.title,
                            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                            padding: '4px 10px',
                            borderRadius: '10px'
                        }}>
                            {user.score.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 600, color: c.muted }}>pts</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
