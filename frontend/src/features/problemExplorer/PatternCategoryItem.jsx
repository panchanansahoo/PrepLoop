import React from 'react';
import { ChevronRight, ChevronDown, BookOpen, Play, Star, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SubPatternList } from './SubPatternList';

/**
 * PatternCategoryItem — Clean, flat category accordion.
 * Redesigned to match a minimal, scannable layout:
 *   Category header → flat sub-pattern rows (no group headers).
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

    // ── Filter: hide category if search/difficulty filters yield no matches ──
    // Count non-empty sub-patterns early (needed for both filter and display)
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
            )
                return true;
            return (pat.problems || []).some((pr) => {
                if (
                    search &&
                    !pr.title.toLowerCase().includes(search.toLowerCase()) &&
                    !pat.name.toLowerCase().includes(search.toLowerCase()) &&
                    !category.name.toLowerCase().includes(search.toLowerCase())
                ) {
                    return false;
                }
                if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty))
                    return false;
                return true;
            });
        });
        const anyExtraMatch = extraProblems.some((p) => {
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
        if (!anyDsaMatch && !anyExtraMatch) return null;
    }

    // ── Build flat list of all sub-patterns (no grouping) ──
    const allEntries = catPatterns.map((pattern) => ({
        pattern,
        leafLabel: pattern.name,
    }));

    return (
        <div key={category.id}>
            {/* ── Category header row ── */}
            <div
                onClick={() =>
                    setExpandedCategories((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
                }
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 20px',
                    background: isCatExpanded
                        ? isLight ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.025)'
                        : 'transparent',
                    borderBottom: isLight
                        ? '1px solid rgba(0,0,0,0.06)'
                        : '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                    if (!isCatExpanded) {
                        e.currentTarget.style.background = isLight
                            ? 'rgba(0,0,0,0.012)'
                            : 'rgba(255,255,255,0.018)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCatExpanded
                        ? isLight ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.025)'
                        : 'transparent';
                }}
            >
                {/* Chevron */}
                <div
                    style={{
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isCatExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ChevronRight
                        size={16}
                        color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'}
                    />
                </div>

                {/* Roman numeral badge */}
                <div
                    style={{
                        minWidth: 26,
                        height: 22,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                        fontSize: 10,
                        fontWeight: 800,
                        color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
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
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: isLight ? '#1e293b' : '#f1f5f9',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3,
                    }}
                >
                    {category.name}
                    {isComplete && (
                        <Crown
                            size={13}
                            color="#6ee7b7"
                            style={{
                                marginLeft: 8,
                                verticalAlign: 'middle',
                                filter: 'drop-shadow(0 0 4px rgba(110,231,183,0.4))',
                            }}
                        />
                    )}
                </span>

                {/* Right: pattern count + attempted */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {nonEmptyPatternCount} {nonEmptyPatternCount === 1 ? 'pattern' : 'patterns'}
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
                            color: attemptedProblems > 0
                                ? '#6ee7b7'
                                : isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {attemptedProblems} attempted
                    </span>
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
