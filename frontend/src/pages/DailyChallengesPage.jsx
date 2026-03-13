import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { dailyChallenges } from '../data/dailyChallenges';
import {
    ExternalLink, Code2, Database, Sparkles, Building2,
    Trophy, Star, ChevronRight, Filter, Search, X, ArrowRight
} from 'lucide-react';

const DIFFICULTY_COLORS = {
    Easy: { text: '#6ee7b7', bg: 'rgba(110,231,183,0.1)', border: 'rgba(110,231,183,0.2)' },
    Medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
    Hard: { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
};

// Determine today's company (same seed logic as DailyChallenge widget)
function getTodayIndex() {
    const d = new Date();
    const seed = d.getDate() + d.getMonth() * 31 + d.getFullYear() * 366;
    return seed % dailyChallenges.length;
}

export default function DailyChallengesPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const todayIndex = useMemo(() => getTodayIndex(), []);

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'Product' | 'Service'
    const [filterSection, setFilterSection] = useState('all'); // 'all' | 'dsa' | 'sql'

    const filtered = useMemo(() => {
        return dailyChallenges.filter(c => {
            if (filterType !== 'all' && c.type !== filterType) return false;
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [search, filterType]);

    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className={`min-h-screen ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0a] text-white'}`} style={{ scrollBehavior: 'smooth' }}>
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(251,191,36,0.07), transparent 60%)' }} />

            <style>{`
                @keyframes shimmer-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes pulse-star { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.2); opacity: 1; } }
                @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div className="max-w-7xl mx-auto px-6 py-8 pt-24 relative z-10">
                {/* Page Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(251,191,36,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(251,191,36,0.15)',
                        }}>
                            <Sparkles size={22} color="#fbbf24" style={{ animation: 'pulse-star 2.5s ease-in-out infinite' }} />
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', margin: 0,
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #c084fc, #a78bfa)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>Daily Challenges</h1>
                            <p style={{ color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
                                {dateStr} • {dailyChallenges.length} companies • {dailyChallenges.length * 10} total questions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Highlight */}
                <div style={{
                    marginBottom: 28, padding: '20px 28px', borderRadius: 20,
                    background: isLight
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(139,92,246,0.06))'
                        : 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(139,92,246,0.08))',
                    border: isLight ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(251,191,36,0.2)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.04), transparent)',
                        backgroundSize: '200% 100%', animation: 'shimmer-bg 5s ease infinite', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <Trophy size={28} color="#fbbf24" />
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#fbbf24', marginBottom: 2 }}>
                                Today's Featured Company
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: isLight ? '#1e293b' : '#fff' }}>
                                {dailyChallenges[todayIndex].name}
                            </div>
                            <div style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>
                                Practice company-specific DSA & SQL problems updated daily
                            </div>
                        </div>
                        <a href={`#company-${dailyChallenges[todayIndex].id}`}
                            style={{
                                padding: '10px 22px', borderRadius: 12, cursor: 'pointer',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                color: '#000', fontWeight: 700, fontSize: 13,
                                display: 'flex', alignItems: 'center', gap: 6,
                                textDecoration: 'none', boxShadow: '0 4px 16px rgba(251,191,36,0.3)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,191,36,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,191,36,0.3)'; }}
                        >
                            Jump to Today <ChevronRight size={16} />
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{
                        flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 14px', borderRadius: 12,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <Search size={16} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search companies..."
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                color: isLight ? '#1e293b' : '#fff', fontSize: 13,
                            }}
                        />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'} /></button>}
                    </div>

                    {/* Type Filter */}
                    {['all', 'Product', 'Service'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} style={{
                            padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                            fontSize: 12, fontWeight: 600,
                            background: filterType === t
                                ? (isLight ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.15)')
                                : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                            border: filterType === t
                                ? (isLight ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(139,92,246,0.3)')
                                : (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'),
                            color: filterType === t
                                ? (isLight ? '#6366f1' : '#c084fc')
                                : (isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'),
                        }}>
                            {t === 'all' ? 'All Companies' : `${t}-Based`}
                        </button>
                    ))}

                    {/* Section Filter */}
                    <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                        {[
                            { key: 'all', label: 'All', icon: null },
                            { key: 'dsa', label: 'DSA', icon: Code2 },
                            { key: 'sql', label: 'SQL', icon: Database },
                        ].map(s => (
                            <button key={s.key} onClick={() => setFilterSection(s.key)} style={{
                                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: filterSection === s.key
                                    ? (isLight ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.15)')
                                    : 'transparent',
                                border: filterSection === s.key
                                    ? (isLight ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(139,92,246,0.3)')
                                    : '1px solid transparent',
                                color: filterSection === s.key
                                    ? (isLight ? '#6366f1' : '#c084fc')
                                    : (isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)'),
                            }}>
                                {s.icon && <s.icon size={12} />}
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Company Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {filtered.map((company, idx) => {
                        const Icon = company.icon;
                        const isToday = dailyChallenges.indexOf(company) === todayIndex;
                        const realIdx = dailyChallenges.indexOf(company);

                        return (
                            <div
                                key={company.id}
                                id={`company-${company.id}`}
                                style={{
                                    borderRadius: 22, overflow: 'hidden',
                                    border: isToday
                                        ? (isLight ? '2px solid rgba(251,191,36,0.35)' : '2px solid rgba(251,191,36,0.3)')
                                        : (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'),
                                    background: isLight
                                        ? (isToday ? 'rgba(251,191,36,0.03)' : '#fff')
                                        : (isToday ? 'rgba(251,191,36,0.03)' : 'rgba(255,255,255,0.02)'),
                                    boxShadow: isToday
                                        ? '0 8px 32px rgba(251,191,36,0.08)'
                                        : (isLight ? '0 2px 12px rgba(0,0,0,0.04)' : '0 2px 12px rgba(0,0,0,0.2)'),
                                    animation: 'fade-up 0.5s ease both',
                                    animationDelay: `${idx * 60}ms`,
                                    position: 'relative',
                                    transition: 'transform 0.25s, box-shadow 0.25s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isToday ? '0 12px 40px rgba(251,191,36,0.15)' : (isLight ? '0 8px 24px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.4)'); }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isToday ? '0 8px 32px rgba(251,191,36,0.08)' : (isLight ? '0 2px 12px rgba(0,0,0,0.04)' : '0 2px 12px rgba(0,0,0,0.2)'); }}
                            >
                                {/* Company Header */}
                                <div style={{
                                    padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 14,
                                    borderBottom: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div className={company.color} style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isLight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.05)',
                                        border: isLight ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                        <Icon size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 18, fontWeight: 800, color: isLight ? '#1e293b' : '#fff' }}>
                                                {company.name}
                                            </span>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                padding: '2px 8px', borderRadius: 6,
                                                background: company.type === 'Product'
                                                    ? (isLight ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.1)')
                                                    : (isLight ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)'),
                                                color: company.type === 'Product'
                                                    ? (isLight ? '#059669' : '#6ee7b7')
                                                    : (isLight ? '#2563eb' : '#60a5fa'),
                                                border: company.type === 'Product'
                                                    ? (isLight ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(16,185,129,0.2)')
                                                    : (isLight ? '1px solid rgba(59,130,246,0.15)' : '1px solid rgba(59,130,246,0.2)'),
                                            }}>
                                                {company.type}
                                            </span>
                                            {isToday && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                    padding: '2px 10px', borderRadius: 6,
                                                    background: 'rgba(251,191,36,0.12)',
                                                    color: '#f59e0b',
                                                    border: '1px solid rgba(251,191,36,0.25)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <Star size={10} fill="#f59e0b" /> Today
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                            {company.dsa.length} DSA + {company.sql.length} SQL questions
                                        </div>
                                    </div>
                                </div>

                                {/* Questions Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: filterSection === 'all' ? 'repeat(auto-fit, minmax(380px, 1fr))' : '1fr',
                                    gap: 0,
                                }}>
                                    {/* DSA */}
                                    {filterSection !== 'sql' && (
                                        <div style={{
                                            padding: '20px 28px',
                                            borderRight: filterSection === 'all' ? (isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.04)') : 'none',
                                        }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                                                color: isLight ? '#4f46e5' : '#818cf8',
                                            }}>
                                                <div style={{
                                                    padding: 5, borderRadius: 8,
                                                    background: isLight ? 'rgba(79,70,229,0.08)' : 'rgba(129,140,248,0.1)',
                                                }}>
                                                    <Code2 size={14} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>Data Structures & Algorithms</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {company.dsa.map((q, qi) => (
                                                    <QuestionRow key={qi} q={q} idx={qi} isLight={isLight} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* SQL */}
                                    {filterSection !== 'dsa' && (
                                        <div style={{ padding: '20px 28px' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                                                color: isLight ? '#db2777' : '#f472b6',
                                            }}>
                                                <div style={{
                                                    padding: 5, borderRadius: 8,
                                                    background: isLight ? 'rgba(219,39,119,0.08)' : 'rgba(244,114,182,0.1)',
                                                }}>
                                                    <Database size={14} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>SQL & Database</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {company.sql.map((q, qi) => (
                                                    <QuestionRow key={qi} q={q} idx={qi} isLight={isLight} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '60px 20px',
                        color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)',
                    }}>
                        <Search size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <div style={{ fontSize: 16, fontWeight: 600 }}>No companies match your filters</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
                    </div>
                )}

                {/* Bottom Spacer */}
                <div style={{ height: 60 }} />
            </div>
        </div>
    );
}

function QuestionRow({ q, idx, isLight }) {
    const dc = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.Easy;

    // Determine internal route based on type
    const internalRoute = q.internalId
        ? (q.type === 'sql' ? `/sql-editor/${q.internalId}` : `/code-editor/${q.internalId}`)
        : null;

    const sharedStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
        background: isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.02)',
        border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.2s ease', cursor: 'pointer',
    };

    const handleMouseEnter = e => {
        e.currentTarget.style.background = isLight ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = isLight ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'translateX(4px)';
    };
    const handleMouseLeave = e => {
        e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'translateX(0)';
    };

    const content = (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{
                    fontSize: 11, fontFamily: 'monospace', width: 20, textAlign: 'center',
                    color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)',
                }}>
                    {idx + 1}
                </span>
                <span style={{
                    fontSize: 13, fontWeight: 500,
                    color: isLight ? '#334155' : 'rgba(255,255,255,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {q.title}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    color: dc.text, background: dc.bg, border: `1px solid ${dc.border}`,
                }}>
                    {q.difficulty}
                </span>
                {internalRoute ? (
                    <ArrowRight size={13} style={{
                        opacity: 0.3, transition: 'opacity 0.2s',
                        color: isLight ? '#4f46e5' : 'rgba(139,92,246,0.7)',
                    }} />
                ) : (
                    <ExternalLink size={13} style={{
                        opacity: 0.3, transition: 'opacity 0.2s',
                        color: isLight ? '#334155' : 'rgba(255,255,255,0.5)',
                    }} />
                )}
            </div>
        </>
    );

    if (internalRoute) {
        return (
            <Link
                to={internalRoute}
                style={sharedStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {content}
            </Link>
        );
    }

    return (
        <a
            href={q.url}
            target="_blank"
            rel="noopener noreferrer"
            style={sharedStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {content}
        </a>
    );
}
