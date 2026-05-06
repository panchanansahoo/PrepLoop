import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { dailyChallenges } from '../data/dailyChallenges';
import { Code2, Database, ArrowRight } from 'lucide-react';

const DIFFICULTY_COLORS = {
    Easy: { text: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)' },
    Medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
    Hard: { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

function getDailyChallengeIndex(date = new Date()) {
    if (!Array.isArray(dailyChallenges) || dailyChallenges.length === 0) return -1;

    const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 366;
    return seed % dailyChallenges.length;
}

const DailyChallenge = ({ challengeData = null }) => {
    const [todayStamp, setTodayStamp] = useState(() => new Date().toDateString());
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setHours(24, 0, 0, 0);

        const timeoutId = setTimeout(() => {
            setTodayStamp(new Date().toDateString());
        }, Math.max(1000, nextMidnight.getTime() - now.getTime()));

        return () => clearTimeout(timeoutId);
    }, [todayStamp]);

    const challengeIndex = getDailyChallengeIndex(new Date(todayStamp));
    const localCompanyChallenge = challengeIndex >= 0 ? dailyChallenges[challengeIndex] : null;
    const challenge = localCompanyChallenge || challengeData;

    if (!challenge) {
        return null;
    }

    const Icon = challenge.icon || Code2;
    const dsaQuestions = Array.isArray(challenge.dsa) ? challenge.dsa : [];
    const sqlQuestions = Array.isArray(challenge.sql) ? challenge.sql : [];

    const renderQuestionRow = (q, idx, isSql = false) => {
        const hasNumericInternalId = /^\d+$/.test(String(q.internalId ?? ''));
        const route = hasNumericInternalId ? `${isSql ? '/sql-editor' : '/code-editor'}/${q.internalId}` : null;
        const Wrapper = route ? Link : 'a';
        const wrapperProps = route
            ? { to: route }
            : { href: q.url, target: '_blank', rel: 'noopener noreferrer' };
        
        const dc = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.Easy;

        const baseBg = isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.015)';
        const hoverBg = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.04)';
        const baseBorder = isLight ? 'rgba(203,213,225,0.4)' : 'rgba(255, 255, 255, 0.04)';
        const hoverBorder = isLight ? 'rgba(99, 102, 241, 0.4)' : `rgba(${isSql ? '236,72,153' : '99,102,241'}, 0.3)`;

        const handleMouseEnter = (e) => {
            e.currentTarget.style.background = hoverBg;
            e.currentTarget.style.borderColor = hoverBorder;
            e.currentTarget.style.transform = 'translateX(6px) translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 20px ${isLight ? 'rgba(99,102,241,0.15)' : 'rgba(0,0,0,0.5)'}`;
        };

        const handleMouseLeave = (e) => {
            e.currentTarget.style.background = baseBg;
            e.currentTarget.style.borderColor = baseBorder;
            e.currentTarget.style.transform = 'translateX(0) translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        };

        return (
            <Wrapper
                key={`${q.title}-${idx}`}
                {...wrapperProps}
                className="group/item flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 cursor-pointer"
                style={{ 
                    textDecoration: 'none', 
                    background: baseBg, 
                    borderColor: baseBorder,
                    backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="min-w-0 flex items-center gap-3">
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 500,
                            width: 24,
                            textAlign: 'center',
                            color: isLight ? 'rgba(100,116,139,0.6)' : 'rgba(203,213,225,0.4)',
                        }}
                    >
                        {idx + 1}
                    </span>

                    <span
                        className="truncate"
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isLight ? '#1e293b' : 'rgba(255,255,255,0.85)',
                        }}
                    >
                        {q.title}
                    </span>
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-3">
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: 6,
                            color: dc.text,
                            backgroundColor: dc.bg,
                            border: `1px solid ${dc.border}`,
                        }}
                    >
                        {q.difficulty}
                    </span>
                    <ArrowRight
                        size={16}
                        style={{
                            color: isLight ? 'rgba(100,116,139,0.5)' : 'rgba(148,163,184,0.4)',
                            transition: 'all 0.2s',
                        }}
                    />
                </div>
            </Wrapper>
        );
    };

    return (
        <div className="w-full pb-8 relative">
            {/* Ambient background gradient */}
            <div className="absolute inset-0 pointer-events-none" style={{ 
                background: isLight 
                    ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.04), transparent 60%)'
                    : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.08), transparent 60%)',
                borderRadius: '24px'
            }} />

            <style>{`
                @keyframes shimmer-bg { 
                    0% { background-position: 0% 50%; } 
                    50% { background-position: 100% 50%; } 
                    100% { background-position: 0% 50%; } 
                }
                @keyframes pulse-star { 
                    0%, 100% { transform: scale(1); opacity: 0.7; } 
                    50% { transform: scale(1.15); opacity: 1; } 
                }
                @keyframes fade-up { 
                    from { opacity: 0; transform: translateY(12px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
            `}</style>

            <div className="relative z-10 overflow-hidden border rounded-[24px]" style={{
                background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
                    : 'linear-gradient(135deg, rgba(18, 18, 24, 0.75), rgba(20, 20, 28, 0.65))',
                borderColor: isLight ? 'rgba(203,213,225,0.5)' : 'rgba(255, 255, 255, 0.08)',
                boxShadow: 'var(--shadow-md)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)'
            }}>
                {/* Header with Trophy Icon */}
                <div style={{
                    padding: isLight ? '28px 28px' : '28px 28px',
                    borderBottom: isLight ? '1px solid rgba(203,213,225,0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.05))'
                        : 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(139,92,246,0.08))',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Shimmer effect */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.04), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer-bg 4s ease infinite',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                                color: '#fbbf24',
                                marginBottom: 4,
                            }}>
                                Today's Challenge
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                <div style={{
                                    fontSize: 24,
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    color: isLight ? '#1e293b' : '#ffffff',
                                }}>
                                    {challenge.name}
                                </div>
                                {/* Type Badge */}
                                <div style={{
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    background: isLight
                                        ? 'rgba(16,185,129,0.1)'
                                        : 'rgba(16,185,129,0.15)',
                                    border: isLight
                                        ? '1px solid rgba(16,185,129,0.2)'
                                        : '1px solid rgba(16,185,129,0.3)',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isLight ? '#059669' : '#6ee7b7',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {challenge.type || 'Product'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 0,
                }}>
                    {/* DSA Section */}
                    <div style={{
                        padding: '24px 28px',
                        borderRight: isLight ? '1px solid rgba(203,213,225,0.4)' : '1px solid rgba(148,163,184,0.1)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 18,
                            fontSize: 14,
                            fontWeight: 700,
                            color: isLight ? '#6366f1' : '#a78bfa',
                        }}>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: isLight ? 'rgba(99,102,241,0.1)' : 'rgba(167,139,250,0.1)',
                            }}>
                                <Code2 size={16} strokeWidth={2.5} />
                            </span>
                            Data Structures
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {dsaQuestions.length > 0 ? dsaQuestions.map((q, idx) => renderQuestionRow(q, idx, false)) : (
                                <div style={{ fontSize: 13, color: isLight ? '#64748b' : 'rgba(255,255,255,0.55)' }}>
                                    No DSA recommendations available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SQL Section */}
                    <div style={{ padding: '24px 28px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 18,
                            fontSize: 14,
                            fontWeight: 700,
                            color: isLight ? '#ec4899' : '#f472b6',
                        }}>
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: isLight ? 'rgba(236,72,153,0.1)' : 'rgba(244,114,182,0.1)',
                            }}>
                                <Database size={16} strokeWidth={2.5} />
                            </span>
                            SQL & Database
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {sqlQuestions.length > 0 ? sqlQuestions.map((q, idx) => renderQuestionRow(q, idx, true)) : (
                                <div style={{ fontSize: 13, color: isLight ? '#64748b' : 'rgba(255,255,255,0.55)' }}>
                                    No SQL recommendations in your DB yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyChallenge;
