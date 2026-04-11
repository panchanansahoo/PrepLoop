import React from 'react';
import { ChevronRight, ChevronDown, BookOpen, Play, Star, Crown, Layers, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SubPatternList } from './SubPatternList';

// Category-specific accent colors for visual differentiation
const CATEGORY_ACCENTS = [
    { from: '#6ee7b7', to: '#34d399', dot: '#6ee7b7' },   // Array - emerald
    { from: '#67e8f9', to: '#22d3ee', dot: '#67e8f9' },   // String - cyan
    { from: '#c084fc', to: '#a78bfa', dot: '#c084fc' },   // Hash map - violet
    { from: '#fb923c', to: '#f97316', dot: '#fb923c' },   // Stack - orange
    { from: '#f472b6', to: '#ec4899', dot: '#f472b6' },   // Queue - pink
    { from: '#60a5fa', to: '#3b82f6', dot: '#60a5fa' },   // Linked List - blue
    { from: '#a3e635', to: '#84cc16', dot: '#a3e635' },   // Tree - lime
    { from: '#fbbf24', to: '#f59e0b', dot: '#fbbf24' },   // Recursion - amber
    { from: '#818cf8', to: '#6366f1', dot: '#818cf8' },   // Heap - indigo
    { from: '#2dd4bf', to: '#14b8a6', dot: '#2dd4bf' },   // Graphs - teal
    { from: '#e879f9', to: '#d946ef', dot: '#e879f9' },   // Trie - fuchsia
    { from: '#fb7185', to: '#f43f5e', dot: '#fb7185' },   // DP - rose
    { from: '#38bdf8', to: '#0ea5e9', dot: '#38bdf8' },   // Binary Search - sky
    { from: '#a78bfa', to: '#8b5cf6', dot: '#a78bfa' },   // Greedy - purple
    { from: '#fca5a5', to: '#ef4444', dot: '#fca5a5' },   // Backtracking - red
    { from: '#86efac', to: '#4ade80', dot: '#86efac' },   // Bit Manipulation - green
    { from: '#fdba74', to: '#f97316', dot: '#fdba74' },   // Math - amber
    { from: '#93c5fd', to: '#60a5fa', dot: '#93c5fd' },   // Intervals - blue
    { from: '#d8b4fe', to: '#c084fc', dot: '#d8b4fe' },   // Segment Tree - violet
    { from: '#fde68a', to: '#fbbf24', dot: '#fde68a' },   // Union Find - yellow
];

/**
 * PatternCategoryItem — Premium card-style category accordion.
 * Redesigned with glassmorphism, gradient accents, progress rings,
 * and difficulty distribution indicators.
 */
export function PatternCategoryItem({
    category,
    catIdx,
    catPatterns,
    extraProblems,
    totalProblems,
    attemptedProblems,
    globalIdxRef,
    totalSubPatterns,
    isLight,
    roman,
    solvedSet,
    expandedCategories,
    setExpandedCategories,
    expandedSubPatterns,
    setExpandedSubPatterns,
    search,
    selectedDifficulties,
    getExplanationSnippet,
    onSolveProblem,
}) {
    const isCatExpanded = !!expandedCategories[category.id];
    const isComplete = totalProblems > 0 && attemptedProblems === totalProblems;
    const gc = CATEGORY_ACCENTS[catIdx % CATEGORY_ACCENTS.length];

    // Count non-empty sub-patterns
    const nonEmptyPatternCount = catPatterns.filter(p => (p.problems || []).length > 0).length;

    // Hide categories with zero non-empty patterns (and no extra problems) when idle
    if (!search && selectedDifficulties.length === 0) {
        if (nonEmptyPatternCount === 0 && (!extraProblems || extraProblems.length === 0)) return null;
    }

    if (search || selectedDifficulties.length > 0) {
        const anyDsaMatch = catPatterns.some((pat) => {
            if (
                pat.name.toLowerCase().includes(search.toLowerCase()) ||
                category.name.toLowerCase().includes(search.toLowerCase())
            ) return true;
            return (pat.problems || []).some((pr) => {
                if (
                    search &&
                    !pr.title.toLowerCase().includes(search.toLowerCase()) &&
                    !pat.name.toLowerCase().includes(search.toLowerCase()) &&
                    !category.name.toLowerCase().includes(search.toLowerCase())
                ) return false;
                if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty)) return false;
                return true;
            });
        });
        const anyExtraMatch = extraProblems.some((p) => {
            if (
                search &&
                !p.title.toLowerCase().includes(search.toLowerCase()) &&
                !category.name.toLowerCase().includes(search.toLowerCase())
            ) return false;
            if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(p.difficulty)) return false;
            return true;
        });
        if (!anyDsaMatch && !anyExtraMatch) return null;
    }

    // Build flat list of all sub-patterns (no grouping)
    const allEntries = catPatterns.map((pattern) => ({
        pattern,
        leafLabel: pattern.name,
    }));

    // Progress calculation
    const pct = totalProblems > 0 ? (attemptedProblems / totalProblems) * 100 : 0;

    // Difficulty distribution
    const allProblemsInCategory = [];
    catPatterns.forEach(p => {
        (p.problems || []).forEach(pr => allProblemsInCategory.push(pr));
    });
    extraProblems?.forEach(pr => allProblemsInCategory.push(pr));
    const easyCount = allProblemsInCategory.filter(p => p.difficulty === 'Easy').length;
    const medCount = allProblemsInCategory.filter(p => p.difficulty === 'Medium').length;
    const hardCount = allProblemsInCategory.filter(p => p.difficulty === 'Hard').length;

    // Mini ring
    const R = 15, SW = 3, C = 2 * Math.PI * R;
    const ringOffset = C * (1 - pct / 100);

    return (
        <div
            key={category.id}
            style={{
                marginBottom: isCatExpanded ? 2 : 0,
                transition: 'margin 0.3s ease',
            }}
        >
            {/* ── Category header row ── */}
            <div
                onClick={() =>
                    setExpandedCategories((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
                }
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 24px',
                    background: isCatExpanded
                        ? isLight ? `linear-gradient(135deg, ${gc.from}06, transparent)` : `linear-gradient(135deg, ${gc.from}08, transparent)`
                        : 'transparent',
                    borderBottom: isLight
                        ? '1px solid rgba(0,0,0,0.04)'
                        : '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                    if (!isCatExpanded) {
                        e.currentTarget.style.background = isLight
                            ? `linear-gradient(135deg, ${gc.from}08, transparent)`
                            : `linear-gradient(135deg, ${gc.from}0a, transparent)`;
                    }
                    e.currentTarget.style.paddingLeft = '28px';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCatExpanded
                        ? isLight ? `linear-gradient(135deg, ${gc.from}06, transparent)` : `linear-gradient(135deg, ${gc.from}08, transparent)`
                        : 'transparent';
                    e.currentTarget.style.paddingLeft = '24px';
                }}
            >
                {/* Expanded accent bar */}
                {isCatExpanded && (
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        background: `linear-gradient(180deg, ${gc.from}, ${gc.to})`,
                        boxShadow: `0 0 12px ${gc.from}40`,
                        borderRadius: '0 2px 2px 0',
                    }} />
                )}

                {/* Chevron */}
                <div
                    style={{
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isCatExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ChevronRight
                        size={15}
                        color={isCatExpanded ? gc.dot : isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
                    />
                </div>

                {/* Roman numeral badge with category accent */}
                <div
                    style={{
                        minWidth: 30,
                        height: 24,
                        borderRadius: 7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isLight
                            ? `linear-gradient(135deg, ${gc.from}12, ${gc.to}08)`
                            : `linear-gradient(135deg, ${gc.from}18, ${gc.to}0c)`,
                        border: `1px solid ${gc.from}25`,
                        fontSize: 10,
                        fontWeight: 800,
                        color: gc.dot,
                        letterSpacing: 0.5,
                        padding: '0 6px',
                        flexShrink: 0,
                    }}
                >
                    {roman[catIdx] || catIdx + 1}
                </div>

                {/* Category name */}
                <span
                    style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: 700,
                        color: isLight ? '#0f172a' : '#f1f5f9',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {category.name}
                    {isComplete && (
                        <Crown
                            size={14}
                            color="#6ee7b7"
                            fill="#6ee7b7"
                            style={{
                                filter: 'drop-shadow(0 0 6px rgba(110,231,183,0.5))',
                            }}
                        />
                    )}
                </span>

                {/* Progress ring + Difficulty distribution + Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    {/* Difficulty mini dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {easyCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#6ee7b7',
                                    boxShadow: '0 0 4px rgba(110,231,183,0.3)',
                                }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}>
                                    {easyCount}
                                </span>
                            </div>
                        )}
                        {medCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#fbbf24',
                                    boxShadow: '0 0 4px rgba(251,191,36,0.3)',
                                }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}>
                                    {medCount}
                                </span>
                            </div>
                        )}
                        {hardCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#f87171',
                                    boxShadow: '0 0 4px rgba(248,113,113,0.3)',
                                }} />
                                <span style={{ fontSize: 10, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}>
                                    {hardCount}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Pattern count */}
                    <span
                        style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Layers size={11} style={{ opacity: 0.5 }} />
                        {nonEmptyPatternCount}
                    </span>

                    {/* Mini progress ring */}
                    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r={R} stroke={isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'} strokeWidth={SW} fill="none" />
                            <circle cx="18" cy="18" r={R} stroke={gc.dot} strokeWidth={SW} fill="none"
                                strokeDasharray={C} strokeDashoffset={ringOffset} strokeLinecap="round"
                                style={{
                                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
                                    filter: `drop-shadow(0 0 3px ${gc.from}30)`,
                                }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 800,
                                color: attemptedProblems > 0 ? gc.dot : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            }}>
                                {attemptedProblems}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Expanded: Flat sub-pattern list ── */}
            {isCatExpanded && (
                <SubPatternList
                    category={category}
                    allEntries={allEntries}
                    totalPatternCount={catPatterns.length}
                    expandedSubPatterns={expandedSubPatterns}
                    setExpandedSubPatterns={setExpandedSubPatterns}
                    solvedSet={solvedSet}
                    isLight={isLight}
                    search={search}
                    selectedDifficulties={selectedDifficulties}
                    getExplanationSnippet={getExplanationSnippet}
                    onSolveProblem={onSolveProblem}
                />
            )}

            {/* ── Expanded: Extra topic-based problems ── */}
            {isCatExpanded && extraProblems.length > 0 && (
                <ExtraProblemsSection
                    category={category}
                    extraProblems={extraProblems}
                    totalPatternCount={catPatterns.length}
                    expandedSubPatterns={expandedSubPatterns}
                    setExpandedSubPatterns={setExpandedSubPatterns}
                    solvedSet={solvedSet}
                    isLight={isLight}
                    search={search}
                    selectedDifficulties={selectedDifficulties}
                    onSolveProblem={onSolveProblem}
                    gc={gc}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExtraProblemsSection – "More X Problems" collapsible section
// ─────────────────────────────────────────────────────────────────────────────

function ExtraProblemsSection({
    category,
    extraProblems,
    totalPatternCount,
    expandedSubPatterns,
    setExpandedSubPatterns,
    solvedSet,
    isLight,
    search,
    selectedDifficulties,
    onSolveProblem,
    gc,
}) {
    const extraKey = `${category.id}__extra`;
    const isExtraExpanded = !!expandedSubPatterns[extraKey];
    const extraAttemptedCount = extraProblems.filter((p) => solvedSet.has(p.id)).length;

    const filteredExtra = extraProblems.filter((p) => {
        if (
            search &&
            !p.title.toLowerCase().includes(search.toLowerCase()) &&
            !category.name.toLowerCase().includes(search.toLowerCase())
        )
            return false;
        if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(p.difficulty))
            return false;
        return true;
    });

    if ((search || selectedDifficulties.length > 0) && filteredExtra.length === 0) return null;

    return (
        <div
            style={{
                borderBottom: isLight
                    ? '1px solid rgba(0,0,0,0.04)'
                    : '1px solid rgba(255,255,255,0.03)',
            }}
        >
            {/* Header */}
            <div
                onClick={() =>
                    setExpandedSubPatterns((prev) => ({ ...prev, [extraKey]: !prev[extraKey] }))
                }
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 20px 10px 56px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isLight
                        ? 'rgba(251,191,36,0.04)'
                        : 'rgba(251,191,36,0.025)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <div
                    style={{
                        transition: 'transform 0.2s ease',
                        transform: isExtraExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ChevronRight size={14} color="#fbbf24" style={{ opacity: 0.6 }} />
                </div>
                <span
                    style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 600,
                        color: isLight ? '#92400e' : 'rgba(251,191,36,0.75)',
                    }}
                >
                    More {category.name.replace(' Patterns', '').replace(' Manipulation', '')}{' '}
                    Problems
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)',
                        }}
                    >
                        {extraProblems.length} {extraProblems.length === 1 ? 'problem' : 'problems'}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                        }}
                    >
                        ·
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: extraAttemptedCount > 0
                                ? '#6ee7b7'
                                : isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                        }}
                    >
                        {extraAttemptedCount} attempted
                    </span>
                </div>
            </div>

            {/* Expanded rows */}
            {isExtraExpanded && (
                <div
                    style={{
                        background: isLight ? 'rgba(0,0,0,0.012)' : 'rgba(0,0,0,0.15)',
                        borderTop: isLight
                            ? '1px solid rgba(0,0,0,0.04)'
                            : '1px solid rgba(255,255,255,0.03)',
                    }}
                >
                    {filteredExtra.map((problem, probIdx) => {
                        const isSolved = solvedSet.has(problem.id);
                        const dc =
                            problem.difficulty === 'Easy'
                                ? '#6ee7b7'
                                : problem.difficulty === 'Medium'
                                  ? '#fbbf24'
                                  : '#f87171';
                        const dbg =
                            problem.difficulty === 'Easy'
                                ? 'rgba(110,231,183,0.1)'
                                : problem.difficulty === 'Medium'
                                  ? 'rgba(251,191,36,0.1)'
                                  : 'rgba(248,113,113,0.1)';

                        return (
                            <div
                                key={problem.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 20px 8px 72px',
                                    borderBottom:
                                        probIdx < filteredExtra.length - 1
                                            ? isLight
                                                ? '1px solid rgba(0,0,0,0.03)'
                                                : '1px solid rgba(255,255,255,0.02)'
                                            : 'none',
                                    transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isLight
                                        ? 'rgba(0,0,0,0.02)'
                                        : 'rgba(255,255,255,0.02)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12.5,
                                        fontWeight: isSolved ? 500 : 600,
                                        color: isSolved
                                            ? isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                                            : isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                                        textDecoration: isSolved ? 'line-through' : 'none',
                                        textDecorationColor: isSolved ? 'rgba(110,231,183,0.4)' : undefined,
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {problem.title}
                                </span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 800,
                                        color: dc,
                                        background: dbg,
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                        textTransform: 'uppercase',
                                        flexShrink: 0,
                                    }}
                                >
                                    {problem.difficulty}
                                </span>
                            </div>
                        );
                    })}

                    {filteredExtra.length === 0 && (
                        <div
                            style={{
                                padding: '18px 14px',
                                textAlign: 'center',
                                color: isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.12)',
                                fontSize: 11,
                                fontStyle: 'italic',
                            }}
                        >
                            No problems match current filters.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
