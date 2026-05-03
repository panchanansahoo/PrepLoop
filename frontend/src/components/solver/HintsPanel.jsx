import { useState, useEffect, useMemo, useRef } from 'react';
import { Lightbulb, Shield, Zap, ChevronDown, ChevronRight, Lock, Unlock, AlertTriangle, CheckCircle2, Sparkles, Target, Code2 } from 'lucide-react';
import { HINT_LEVELS, getHintsForProblem, analyzeCodeQuality, getOptimizationTips, getSeverityColor } from '../../data/hintsEngine';
import { PATTERN_HINTS, ALGORITHM_TEMPLATES } from '../../data/dsaTemplates';

const TABS = [
    { id: 'hints', label: 'Hints', icon: Lightbulb, color: '#facc15' },
    { id: 'quality', label: 'Code Quality', icon: Shield, color: '#60a5fa' },
    { id: 'optimize', label: 'Optimization', icon: Zap, color: '#c084fc' },
];

export default function HintsPanel({ problemId, code = '', language = 'python', onXPUsed, patternName, onInsertTemplate }) {
    const [activeTab, setActiveTab] = useState('hints');
    const [unlockedLevels, setUnlockedLevels] = useState([1]); // Level 1 is always free
    const [expandedTips, setExpandedTips] = useState({});
    const [animatingLevel, setAnimatingLevel] = useState(null);

    const hints = useMemo(() => getHintsForProblem(problemId), [problemId]);

    // Fix #11: debounce code so analyzeCodeQuality doesn't run on every keystroke
    const [debouncedCode, setDebouncedCode] = useState(code);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedCode(code), 300);
        return () => clearTimeout(t);
    }, [code]);

    const codeIssues = useMemo(() => analyzeCodeQuality(debouncedCode, language), [debouncedCode, language]);
    const optimizationTips = useMemo(() => getOptimizationTips(problemId), [problemId]);

    // Pattern recognition — resolve from PATTERN_HINTS + ALGORITHM_TEMPLATES
    const patternKey = patternName?.toLowerCase().replace(/\s+&\s+/g, ' ');
    const patternHintEntry = patternKey ? Object.entries(PATTERN_HINTS).find(
        ([key]) => patternKey.includes(key) || key.includes(patternKey)
    ) : null;
    const patternHint = patternHintEntry?.[1] || null;
    const templateData = patternHint?.templateId ? ALGORITHM_TEMPLATES[patternHint.templateId] : null;

    // Reset when problem changes
    useEffect(() => {
        setUnlockedLevels([1]);
        setExpandedTips({});
        setAnimatingLevel(null);
    }, [problemId]);

    const unlockHint = (level) => {
        if (unlockedLevels.includes(level)) return;
        const hintMeta = HINT_LEVELS.find(h => h.level === level);
        if (hintMeta && onXPUsed) {
            onXPUsed(hintMeta.xpCost);
        }
        setAnimatingLevel(level);
        setTimeout(() => setAnimatingLevel(null), 600);
        setUnlockedLevels(prev => [...prev, level]);
    };

    const toggleTip = (idx) => {
        setExpandedTips(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const containerStyle = {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
    };

    return (
        <div style={containerStyle}>
            {/* Pattern Recognition Header */}
            {patternName && (
                <div style={{
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(96,165,250,0.06))',
                    borderBottom: '1px solid rgba(139,92,246,0.12)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Target size={14} style={{ color: '#c084fc' }} />
                        <span style={{
                            fontSize: 11, fontWeight: 800, color: '#c084fc',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>Pattern Detected</span>
                    </div>
                    <div style={{
                        fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4,
                    }}>🧩 {patternName}</div>
                    {templateData && (
                        <p style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.45)',
                            lineHeight: 1.6, margin: '4px 0 0',
                        }}>Use the {templateData.name} pattern — {templateData.category} technique</p>
                    )}

                    {/* Complexity badge */}
                    {templateData?.complexity && (
                        <div style={{
                            display: 'flex', gap: 6, marginTop: 8,
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                                border: '1px solid rgba(74,222,128,0.15)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}>⏱ {templateData.complexity.time}</span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: 'rgba(96,165,250,0.1)', color: '#60a5fa',
                                border: '1px solid rgba(96,165,250,0.15)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}>💾 {templateData.complexity.space}</span>
                        </div>
                    )}

                    {/* Insert Template button */}
                    {onInsertTemplate && templateData && (
                        <button
                            onClick={() => {
                                const templateCode = templateData.templates?.[language] || templateData.templates?.python;
                                if (templateCode) onInsertTemplate(templateCode);
                            }}
                            style={{
                                marginTop: 8, width: '100%', padding: '7px 0',
                                borderRadius: 8, cursor: 'pointer',
                                background: 'rgba(139,92,246,0.12)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                color: '#c084fc', fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(139,92,246,0.2)';
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                            }}
                        >
                            <Code2 size={13} />
                            Insert {patternName} Template
                        </button>
                    )}
                </div>
            )}

            {/* Tab bar */}
            <div style={{
                display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const badgeCount = tab.id === 'quality' ? codeIssues.filter(i => i.severity !== 'success').length : 0;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '10px 0', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                                border: 'none',
                                borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                                color: isActive ? tab.color : 'rgba(255,255,255,0.4)',
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Icon size={13} />
                            {tab.label}
                            {badgeCount > 0 && (
                                <span style={{
                                    background: 'rgba(248,113,113,0.2)', color: '#f87171',
                                    fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 8,
                                    minWidth: 16, textAlign: 'center',
                                }}>{badgeCount}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div style={{ padding: 16 }}>
                {activeTab === 'hints' && (
                    <HintsTab
                        hints={hints}
                        unlockedLevels={unlockedLevels}
                        animatingLevel={animatingLevel}
                        onUnlock={unlockHint}
                    />
                )}
                {activeTab === 'quality' && (
                    <CodeQualityTab issues={codeIssues} code={code} />
                )}
                {activeTab === 'optimize' && (
                    <OptimizationTab
                        tips={optimizationTips}
                        expandedTips={expandedTips}
                        onToggle={toggleTip}
                    />
                )}
            </div>
        </div>
    );
}


/* ──────────────────── HINTS TAB ──────────────────── */

function HintsTab({ hints, unlockedLevels, animatingLevel, onUnlock }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HINT_LEVELS.map((meta) => {
                const hint = hints.find(h => h.level === meta.level);
                const isUnlocked = unlockedLevels.includes(meta.level);
                const isAnimating = animatingLevel === meta.level;
                const canUnlock = meta.level <= 1 || unlockedLevels.includes(meta.level - 1);

                return (
                    <div
                        key={meta.level}
                        style={{
                            borderRadius: 12,
                            border: `1px solid ${isUnlocked ? meta.borderColor : 'rgba(255,255,255,0.06)'}`,
                            background: isUnlocked ? meta.bgColor : 'rgba(255,255,255,0.02)',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            animation: isAnimating ? 'fadeIn 0.5s ease forwards' : undefined,
                        }}
                    >
                        {/* Hint header */}
                        <div
                            onClick={() => !isUnlocked && canUnlock && onUnlock(meta.level)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px',
                                cursor: isUnlocked ? 'default' : canUnlock ? 'pointer' : 'not-allowed',
                                opacity: !canUnlock && !isUnlocked ? 0.4 : 1,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                                <div>
                                    <div style={{
                                        fontSize: 11, fontWeight: 800, color: isUnlocked ? meta.color : 'rgba(255,255,255,0.5)',
                                        textTransform: 'uppercase', letterSpacing: 0.5,
                                    }}>
                                        Level {meta.level}: {meta.label}
                                    </div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                                        {meta.description}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {meta.xpCost > 0 && !isUnlocked && (
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, color: meta.color, opacity: 0.8,
                                        background: `${meta.color}15`, padding: '2px 6px', borderRadius: 4,
                                    }}>
                                        -{meta.xpCost} points
                                    </span>
                                )}
                                {isUnlocked ? (
                                    <Unlock size={13} style={{ color: meta.color }} />
                                ) : (
                                    <Lock size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                )}
                            </div>
                        </div>

                        {/* Hint content */}
                        {isUnlocked && hint && (
                            <div style={{
                                padding: '0 14px 12px',
                                fontSize: 12, lineHeight: 1.7,
                                color: 'rgba(255,255,255,0.7)',
                                fontFamily: "'Inter', system-ui, sans-serif",
                            }}>
                                {hint.text}
                            </div>
                        )}
                    </div>
                );
            })}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}


/* ──────────────────── CODE QUALITY TAB ──────────────────── */

function CodeQualityTab({ issues, code }) {
    if (!code || code.trim().length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <Sparkles size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    Start writing code to see analysis
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                    Code quality checks run automatically as you type
                </p>
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <CheckCircle2 size={28} style={{ color: '#4ade80', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>All Clear!</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    No issues detected in your code
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Summary bar */}
            <div style={{
                display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
                {['error', 'warning', 'perf', 'style', 'info', 'success'].map(sev => {
                    const count = issues.filter(i => i.severity === sev).length;
                    if (count === 0) return null;
                    const colors = getSeverityColor(sev);
                    return (
                        <span key={sev} style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 6,
                            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        }}>
                            {count} {sev}
                        </span>
                    );
                })}
            </div>

            {/* Issue cards */}
            {issues.map((issue, i) => {
                const colors = getSeverityColor(issue.severity);
                return (
                    <div key={i} style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: colors.bg, border: `1px solid ${colors.border}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 13 }}>{issue.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: colors.text }}>{issue.title}</span>
                        </div>
                        <p style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
                            margin: 0, paddingLeft: 22,
                        }}>
                            {issue.message}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}


/* ──────────────────── OPTIMIZATION TAB ──────────────────── */

function OptimizationTab({ tips, expandedTips, onToggle }) {
    if (!tips || tips.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                <Zap size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    No optimization tips available
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tips.map((tip, idx) => {
                const isExpanded = expandedTips[idx] !== false; // Default expanded
                return (
                    <div key={idx} style={{
                        borderRadius: 12,
                        border: '1px solid rgba(139,92,246,0.15)',
                        background: 'rgba(139,92,246,0.04)',
                        overflow: 'hidden',
                    }}>
                        {/* Pattern header */}
                        <div
                            onClick={() => onToggle(idx)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Zap size={14} style={{ color: '#c084fc' }} />
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#c084fc' }}>
                                    {tip.pattern}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                    background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                                    border: '1px solid rgba(74,222,128,0.2)',
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}>
                                    {tip.optimal.time} / {tip.optimal.space}
                                </span>
                                {isExpanded ? <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                            </div>
                        </div>

                        {/* Tips content */}
                        {isExpanded && (
                            <div style={{ padding: '0 14px 12px' }}>
                                {/* Tips list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                                    {tip.tips.map((t, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 8, alignItems: 'flex-start',
                                            fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
                                        }}>
                                            <span style={{
                                                color: '#c084fc', fontWeight: 800, fontSize: 10,
                                                minWidth: 16, marginTop: 2,
                                            }}>{i + 1}.</span>
                                            <span>{t}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Alternatives */}
                                {tip.alternatives && tip.alternatives.length > 0 && (
                                    <div style={{
                                        padding: '8px 10px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <div style={{
                                            fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                                            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                                        }}>
                                            Alternative Approaches
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {tip.alternatives.map((alt, i) => (
                                                <span key={i} style={{
                                                    fontSize: 10, padding: '3px 8px', borderRadius: 6,
                                                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)',
                                                    border: '1px solid rgba(255,255,255,0.06)', fontWeight: 600,
                                                }}>
                                                    {alt}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
