import { Briefcase, Building2, ChevronRight, Target } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TargetCompaniesWidget({ data }) {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Mock data if none passed
    const companies = data?.companies || [
        { id: 1, name: 'Google', progress: 75, status: 'Ready to Apply', color: '#ea4335' },
        { id: 2, name: 'Meta', progress: 60, status: 'Needs System Design', color: '#1877f2' },
        { id: 3, name: 'Amazon', progress: 40, status: 'Focusing on LP', color: '#ff9900' },
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
            gap: '20px'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', display: 'grid', placeItems: 'center',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                    }}>
                        <Target size={20} color="#10b981" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Target Companies</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Track your readiness</p>
                    </div>
                </div>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: c.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = c.cardBg; e.currentTarget.style.color = c.title; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.muted; }}
                >
                    <Briefcase size={16} />
                </button>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {companies.map(company => (
                    <div key={company.id} style={{
                        background: c.cardBg,
                        border: c.cardBorder,
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.boxShadow = isLight ? '0 8px 24px rgba(0,0,0,0.04)' : '0 8px 24px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = c.cardBorder.split(' ')[2]; // restore
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                    display: 'grid', placeItems: 'center',
                                    border: isLight ? '1px solid rgba(0,0,0,0.05)' : 'none'
                                }}>
                                    <Building2 size={14} color={company.color} />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: c.title }}>{company.name}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: company.progress >= 75 ? '#10b981' : c.title }}>
                                {company.progress}%
                            </span>
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {company.status}
                                </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${company.progress}%`,
                                    background: company.progress >= 75 ? '#10b981' : company.progress >= 50 ? '#3b82f6' : '#f59e0b',
                                    borderRadius: '4px',
                                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                                }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <button style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}
            >
                View full company list <ChevronRight size={14} />
            </button>
        </div>
    );
}
