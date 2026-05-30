import { useState, useMemo } from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Calculator, Brain, BookOpen, ChevronDown, ChevronRight,
    Trophy, Zap, Target, Clock, BarChart3, Sparkles, Building,
    Hash, Percent, Scale, Hammer, Timer, IndianRupee, Dices, Droplets,
    Users, Compass, Lock, ArrowUpNarrowWide, GitBranch, LayoutGrid, Puzzle,
    SpellCheck, TextCursorInput, ArrowLeftRight, Shuffle, Quote,
    GitCompareArrows, Play, Filter, ArrowRight, Settings, Database, Box, Network, GraduationCap
} from 'lucide-react';
import { APTITUDE_CATEGORIES, getCategoryStats, getOverallStats } from '../data/aptitudeData';
import { useTheme } from '../context/ThemeContext';

const ICON_MAP = {
    Calculator, Brain, BookOpen, Hash, Percent, Scale, Hammer, Timer,
    IndianRupee, Dices, Droplets, Users, Compass, Lock, ArrowUpNarrowWide,
    GitBranch, LayoutGrid, Puzzle, SpellCheck, TextCursorInput,
    ArrowLeftRight, Shuffle, Quote, GitCompareArrows, Clock, Building,
    Settings, Database, Box, Network
};

const getIcon = (name, size = 20) => {
    const Icon = ICON_MAP[name] || Calculator;
    return <Icon size={size} />;
};

export default function AptitudeHub() {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const overallStats = useMemo(() => getOverallStats(), []);

    const categoryEntries = useMemo(() =>
        Object.entries(APTITUDE_CATEGORIES).map(([key, cat]) => ({
            key,
            ...cat,
            stats: getCategoryStats(key)
        })),
        []
    );

    const startPractice = (categoryKey, subcatKey, mode = 'practice') => {
        navigate(`/aptitude/practice/${categoryKey}?sub=${subcatKey}&mode=${mode}&difficulty=${difficultyFilter}`);
    };

    const startCategoryPractice = (categoryKey, mode = 'practice') => {
        navigate(`/aptitude/practice/${categoryKey}?mode=${mode}&difficulty=${difficultyFilter}`);
    };

    return (
        <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : '#fff', paddingBottom: 80 }}>

            {/* Hero Section */}
            <section style={{
                padding: '60px 24px 40px',
                maxWidth: 1200,
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 16px', borderRadius: 99,
                    background: isLight ? 'rgba(129, 140, 248, 0.08)' : 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.3)',
                    fontSize: 13, color: isLight ? '#6366f1' : '#a5b4fc', marginBottom: 24
                }}>
                    <Sparkles size={14} />
                    {overallStats.total}+ Practice Problems
                </div>

                <h1 style={{
                    fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700,
                    lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em'
                }}>
                    Aptitude & Reasoning{' '}
                    <span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Mastery
                    </span>
                </h1>
                <p style={{ fontSize: 18, color: isLight ? '#6b7280' : '#71717a', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
                    Practice quantitative aptitude, logical reasoning, and verbal ability.
                    Prepare for placements, CAT, GATE, GRE, and more.
                </p>

                {/* Stats Row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                    gap: 16, maxWidth: 700, margin: '0 auto 48px'
                }}>
                    {[
                        { label: 'Total Problems', value: overallStats.total, icon: <Target size={18} />, color: '#818cf8' },
                        { label: 'Categories', value: overallStats.categories, icon: <BarChart3 size={18} />, color: '#f472b6' },
                        { label: 'Total Points', value: overallStats.totalXP, icon: <Zap size={18} />, color: '#facc15' },
                        { label: 'Difficulty Levels', value: '3', icon: <Trophy size={18} />, color: '#34d399' }
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12, padding: '20px 16px', textAlign: 'center'
                        }}>
                            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: isLight ? '#6b7280' : '#71717a', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Start Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                    <button
                        onClick={() => navigate('/learning-path')}
                        className="btn btn-primary"
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                            fontWeight: 700, fontSize: 15
                        }}
                    >
                        <GraduationCap size={20} /> Start Aptitude Learning Path
                    </button>
                    <button
                        onClick={() => navigate('/aptitude/practice/all?mode=practice&difficulty=all')}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', fontWeight: 600 }}
                    >
                        <Play size={16} /> Random Quiz
                    </button>
                    <button
                        onClick={() => navigate('/aptitude/practice/all?mode=speed&difficulty=all')}
                        className="btn btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', fontWeight: 600 }}
                    >
                        <Zap size={16} /> Speed Challenge
                    </button>
                </div>
            </section>

            {/* Difficulty Filter */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Filter size={16} style={{ color: '#71717a' }} />
                    <span style={{ fontSize: 13, color: '#71717a' }}>Difficulty:</span>
                    {['all', 'easy', 'medium', 'hard'].map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficultyFilter(d)}
                            style={{
                                padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                                border: difficultyFilter === d ? 'none' : (isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.1)'),
                                background: difficultyFilter === d
                                    ? (d === 'easy' ? '#34d399' : d === 'medium' ? '#facc15' : d === 'hard' ? '#f87171' : 'rgba(129,140,248,0.2)')
                                    : 'transparent',
                                color: difficultyFilter === d ? '#000' : (isLight ? '#6b7280' : '#a1a1aa'),
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
            </section>

            {/* Categories */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {categoryEntries.map(cat => {
                        const isExpanded = expandedCategory === cat.key;
                        const subcatEntries = Object.entries(cat.subcategories);
                        const CatIcon = ICON_MAP[cat.icon] || Calculator;

                        return (
                            <div key={cat.key} style={{
                                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 16, overflow: 'hidden',
                                transition: 'border-color 0.3s',
                                borderColor: isExpanded ? `${cat.color}40` : (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)')
                            }}>
                                {/* Category Header */}
                                <div
                                    onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '24px 28px', cursor: 'pointer', transition: 'background 0.2s',
                                        background: isExpanded ? (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)') : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: `${cat.color}15`, color: cat.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <CatIcon size={24} />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{cat.title}</h2>
                                            <p style={{ fontSize: 14, color: isLight ? '#6b7280' : '#71717a', margin: 0 }}>{cat.description}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                        <div style={{ textAlign: 'center', display: 'flex', gap: 20 }}>
                                            <div>
                                                <div style={{ fontSize: 18, fontWeight: 700 }}>{cat.stats.total}</div>
                                                <div style={{ fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>Problems</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>{cat.stats.totalXP}</div>
                                                <div style={{ fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>Points</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 18, fontWeight: 700 }}>{subcatEntries.length}</div>
                                                <div style={{ fontSize: 11, color: isLight ? '#6b7280' : '#71717a' }}>Topics</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); startCategoryPractice(cat.key); }}
                                            style={{
                                                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                background: cat.gradient, color: '#fff', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Practice All <ArrowRight size={14} />
                                        </button>

                                        <ChevronDown
                                            size={20}
                                            style={{
                                                color: isLight ? '#9ca3af' : '#71717a',
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.3s'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Subcategories */}
                                {isExpanded && (
                                    <div style={{
                                        padding: '0 28px 24px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                                        gap: 12
                                    }}>
                                        {subcatEntries.map(([subKey, sub]) => {
                                            const qCount = sub.questions.length;
                                            const easyCount = sub.questions.filter(q => q.difficulty === 'easy').length;
                                            const medCount = sub.questions.filter(q => q.difficulty === 'medium').length;
                                            const hardCount = sub.questions.filter(q => q.difficulty === 'hard').length;

                                            return (
                                                <div
                                                    key={subKey}
                                                    onClick={() => startPractice(cat.key, subKey)}
                                                    style={{
                                                        padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                                                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                                                        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                                                        transition: 'all 0.2s',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
                                                        e.currentTarget.style.borderColor = `${cat.color}30`;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                                                        e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: cat.color, flexShrink: 0 }}>
                                                            {getIcon(sub.icon, 18)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {sub.title}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                                                                <span style={{ color: '#34d399' }}>{easyCount} Easy</span>
                                                                <span style={{ color: '#facc15' }}>{medCount} Med</span>
                                                                <span style={{ color: '#f87171' }}>{hardCount} Hard</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                        <span style={{ fontSize: 13, color: isLight ? '#6b7280' : '#a1a1aa', fontWeight: 600 }}>{qCount}</span>
                                                        <ChevronRight size={14} style={{ color: isLight ? '#9ca3af' : '#525252' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Practice Modes Section */}
            <section style={{ maxWidth: 1200, margin: '48px auto 0', padding: '0 24px' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Practice Modes</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
                    {[
                        { mode: 'learning', title: 'Learning Mode', desc: 'No timer, instant solutions, unlimited attempts', icon: <BookOpen size={20} />, color: '#34d399', gradient: 'linear-gradient(135deg, #34d399, #10b981)' },
                        { mode: 'practice', title: 'Practice Mode', desc: 'Optional timer, solutions after each attempt', icon: <Target size={20} />, color: '#818cf8', gradient: 'linear-gradient(135deg, #818cf8, #6366f1)' },
                        { mode: 'test', title: 'Test Mode', desc: 'Strict timer, solutions only after submission', icon: <Clock size={20} />, color: '#f472b6', gradient: 'linear-gradient(135deg, #f472b6, #ec4899)' },
                        { mode: 'speed', title: 'Speed Mode', desc: '30 seconds per question, race the clock', icon: <Zap size={20} />, color: '#facc15', gradient: 'linear-gradient(135deg, #facc15, #f59e0b)' }
                    ].map(m => (
                        <div
                            key={m.mode}
                            onClick={() => navigate(`/aptitude/practice/all?mode=${m.mode}&difficulty=${difficultyFilter}`)}
                            style={{
                                padding: 24, borderRadius: 16, cursor: 'pointer',
                                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                                transition: 'all 0.2s', textAlign: 'center'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${m.color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                                background: `${m.color}15`, color: m.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{m.icon}</div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{m.title}</h3>
                            <p style={{ fontSize: 13, color: isLight ? '#6b7280' : '#71717a', margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
