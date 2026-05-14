import React from 'react';
import { Link } from 'react-router-dom';
import {
    Mic, Code2, Database,
    Building2, Calculator, CalendarDays, Trophy,
    FileText, Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const actions = [
    {
        label: 'Mock Interview',
        description: 'AI-powered practice',
        icon: Mic,
        color: '#a78bfa',
        glow: 'rgba(167, 139, 250, 0.12)',
        path: '/company-interview'
    },
    {
        label: 'Practice DSA',
        description: 'Code challenges',
        icon: Code2,
        color: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.12)',
        path: '/problems'
    },
    {
        label: 'SQL Challenge',
        description: 'Database queries',
        icon: Database,
        color: '#34d399',
        glow: 'rgba(52, 211, 153, 0.12)',
        path: '/sql-problems'
    },
    {
        label: 'Quiz Arena',
        description: 'Topic quiz battle',
        icon: Trophy,
        color: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.12)',
        path: '/quiz-arena'
    },
    {
        label: 'Advanced Planner',
        description: 'Date-wise roadmap',
        icon: CalendarDays,
        color: '#e84f2e',
        glow: 'rgba(232, 79, 46, 0.14)',
        path: '/advanced-learning-path'
    },
    {
        label: 'Company Prep',
        description: 'Real Q&A by company',
        icon: Building2,
        color: '#fb923c',
        glow: 'rgba(251, 146, 60, 0.12)',
        path: '/company-prep'
    },
    {
        label: 'Aptitude Quiz',
        description: 'Quant & reasoning',
        icon: Calculator,
        color: '#f472b6',
        glow: 'rgba(244, 114, 182, 0.12)',
        path: '/aptitude'
    },
    {
        label: 'Resume Analysis',
        description: 'AI-driven ATS check',
        icon: FileText,
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.12)',
        path: '/resume-analyzer'
    }
];

export default function QuickActions() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const c = {
        bg: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))' : 'linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(20, 20, 28, 0.4))',
        border: isLight ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        shadow: isLight ? '0 12px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : '0 24px 64px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        cardBg: isLight ? 'rgba(15, 23, 42, 0.02)' : 'rgba(255, 255, 255, 0.02)',
        cardBorder: isLight ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
        cardHoverBg: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)',
        title: isLight ? '#0f172a' : '#f8fafc',
        text: isLight ? '#475569' : '#cbd5e1',
        muted: isLight ? '#94a3b8' : '#64748b',
        arrow: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.2)',
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
                    background: isLight ? 'rgba(167, 139, 250, 0.12)' : 'rgba(167, 139, 250, 0.12)', 
                    border: '1px solid rgba(167, 139, 250, 0.18)' 
                }}>
                    <Zap size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: c.title, letterSpacing: '-0.3px' }}>Quick Actions</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: c.muted, fontWeight: 500 }}>Jump straight into practice</p>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUpScale {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 16px;
                }
                .quick-action-card-premium {
                    display: flex;
                    align-items: center;
                    padding: 18px 20px;
                    border-radius: 16px;
                    background: ${c.cardBg};
                    border: ${c.cardBorder};
                    text-decoration: none;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    animation: fadeInUpScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                .quick-action-card-premium:hover {
                    transform: translateY(-3px) scale(1.02);
                    background: ${c.cardHoverBg};
                }
                .qa-content {
                    flex: 1;
                    min-width: 0;
                    margin-left: 16px;
                }
                .qa-label {
                    font-size: 14px;
                    font-weight: 700;
                    color: ${c.title};
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: color 0.3s ease;
                }
                .qa-desc {
                    font-size: 11px;
                    font-weight: 600;
                    color: ${c.muted};
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .qa-arrow {
                    color: ${c.arrow};
                    font-weight: 800;
                    font-size: 16px;
                    transform: translateX(0);
                    transition: transform 0.3s ease, color 0.3s ease;
                    margin-left: 12px;
                }
                .quick-action-card-premium:hover .qa-arrow {
                    transform: translateX(4px);
                }
                .quick-action-card-premium:hover .qa-icon-wrap {
                    transform: scale(1.1) rotate(4deg);
                }
            `}</style>
            
            <div className="quick-actions-grid">
                {actions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            to={action.path}
                            className="quick-action-card-premium"
                            style={{ animationDelay: `${i * 40}ms` }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = `rgba(${parseInt(action.color.slice(1,3), 16)}, ${parseInt(action.color.slice(3,5), 16)}, ${parseInt(action.color.slice(5, 7), 16)}, 0.4)`;
                                e.currentTarget.style.boxShadow = `0 8px 24px -8px rgba(${parseInt(action.color.slice(1,3), 16)}, ${parseInt(action.color.slice(3,5), 16)}, ${parseInt(action.color.slice(5, 7), 16)}, 0.3)`;
                                e.currentTarget.querySelector('.qa-label').style.color = action.color;
                                e.currentTarget.querySelector('.qa-arrow').style.color = action.color;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.querySelector('.qa-label').style.color = c.title;
                                e.currentTarget.querySelector('.qa-arrow').style.color = c.arrow;
                            }}
                        >
                            <div className="qa-icon-wrap" style={{ 
                                width: '42px', height: '42px', borderRadius: '12px', 
                                display: 'grid', placeItems: 'center', background: action.glow,
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}>
                                <Icon size={20} style={{ color: action.color }} />
                            </div>
                            <div className="qa-content">
                                <div className="qa-label">{action.label}</div>
                                <div className="qa-desc">{action.description}</div>
                            </div>
                            <div className="qa-arrow">→</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
