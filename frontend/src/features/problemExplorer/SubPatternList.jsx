import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, ChevronDown, Play, ExternalLink, CheckCircle2, Code2, Sparkles, Layers } from 'lucide-react';

/**
 * SubPatternList — Groups sub-patterns by their parent pattern prefix.
 *
 * Sub-patterns follow "GroupName - LeafName" naming convention.
 * All sub-patterns sharing the same GroupName are clustered under a
 * collapsible group dropdown. Single-entry groups render without a
 * group header for compactness.
 */
export function SubPatternList({
    category,
    allEntries,
    _totalPatternCount,
    expandedSubPatterns,
    setExpandedSubPatterns,
    solvedSet,
    isLight,
    search,
    selectedDifficulties,
    _getExplanationSnippet,
    onSolveProblem,
}) {
    // ── Parse and group entries by prefix ──
    const grouped = groupEntriesByPrefix(allEntries);

    return (
        <div>
            {grouped.map((group) => {
                // Filter out groups where ALL sub-patterns are empty
                const nonEmptyEntries = group.entries.filter(
                    (e) => (e.pattern.problems || []).length > 0
                );
                if (nonEmptyEntries.length === 0) return null;

                // Check if any entry in this group has matching problems for search/filter
                if (search || selectedDifficulties.length > 0) {
                    const anyMatch = nonEmptyEntries.some(({ pattern, leafLabel }) => {
                        const probs = pattern.problems || [];
                        return probs.some((pr) => {
                            if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty))
                                return false;
                            if (!search) return true;
                            const s = search.toLowerCase();
                            return (
                                pr.title.toLowerCase().includes(s) ||
                                leafLabel.toLowerCase().includes(s) ||
                                group.groupName.toLowerCase().includes(s) ||
                                category.name.toLowerCase().includes(s)
                            );
                        });
                    });
                    // Also match if group name or leaf name matches the search
                    const nameMatch = nonEmptyEntries.some(({ leafLabel }) =>
                        leafLabel.toLowerCase().includes((search || '').toLowerCase()) ||
                        group.groupName.toLowerCase().includes((search || '').toLowerCase())
                    );
                    if (!anyMatch && !nameMatch) return null;
                }

                // Single-entry group → render directly without group header
                if (nonEmptyEntries.length === 1) {
                    const { pattern, _leafLabel } = nonEmptyEntries[0];
                    return (
                        <SubPatternRow
                            key={pattern.id}
                            pattern={pattern}
                            leafLabel={pattern.name} // show full name for standalone
                            category={category}
                            expandedSubPatterns={expandedSubPatterns}
                            setExpandedSubPatterns={setExpandedSubPatterns}
                            solvedSet={solvedSet}
                            isLight={isLight}
                            search={search}
                            selectedDifficulties={selectedDifficulties}
                            onSolveProblem={onSolveProblem}
                            indent={44}
                        />
                    );
                }

                // Multi-entry group → render with collapsible group header
                return (
                    <PatternGroup
                        key={group.groupName}
                        group={group}
                        nonEmptyEntries={nonEmptyEntries}
                        category={category}
                        expandedSubPatterns={expandedSubPatterns}
                        setExpandedSubPatterns={setExpandedSubPatterns}
                        solvedSet={solvedSet}
                        isLight={isLight}
                        search={search}
                        selectedDifficulties={selectedDifficulties}
                        onSolveProblem={onSolveProblem}
                    />
                );
            })}
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   groupEntriesByPrefix — Parse "Group - Leaf" names into groups
   ═══════════════════════════════════════════════════════════════════════════ */

// Matches various dash characters: hyphen, en-dash, em-dash
const SEPARATOR_RE = /\s+[-–—]\s+/;

function groupEntriesByPrefix(allEntries) {
    const groupMap = new Map(); // groupName → { groupName, entries: [] }
    const groupOrder = []; // preserve insertion order

    for (const entry of allEntries) {
        const { pattern, leafLabel } = entry;
        const name = pattern.name || leafLabel || '';
        const parts = name.split(SEPARATOR_RE);

        let groupName, leaf;
        if (parts.length >= 2) {
            groupName = parts[0].trim();
            leaf = parts.slice(1).join(' — ').trim();
        } else {
            groupName = name.trim();
            leaf = name.trim();
        }

        if (!groupMap.has(groupName)) {
            const groupObj = { groupName, entries: [] };
            groupMap.set(groupName, groupObj);
            groupOrder.push(groupObj);
        }

        groupMap.get(groupName).entries.push({
            pattern,
            leafLabel: leaf,
            fullName: name,
        });
    }

    return groupOrder;
}


/* ═══════════════════════════════════════════════════════════════════════════
   PatternGroup — Collapsible group header + nested sub-pattern rows
   ═══════════════════════════════════════════════════════════════════════════ */

function PatternGroup({
    group,
    nonEmptyEntries,
    category,
    expandedSubPatterns,
    setExpandedSubPatterns,
    solvedSet,
    isLight,
    search,
    selectedDifficulties,
    onSolveProblem,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const groupKey = `${category.id}__grp__${group.groupName}`;
    const isGroupExpanded = !!expandedSubPatterns[groupKey];

    // Aggregate stats across all sub-patterns in this group
    const totalProblems = nonEmptyEntries.reduce(
        (sum, e) => sum + (e.pattern.problems || []).length, 0
    );
    const solvedProblems = nonEmptyEntries.reduce(
        (sum, e) => sum + (e.pattern.problems || []).filter(
            (pr) => solvedSet.has(pr.id) || pr.status === 'solved'
        ).length, 0
    );
    const isComplete = totalProblems > 0 && solvedProblems === totalProblems;

    // Auto-expand groups when searching
    const effectiveExpanded = isGroupExpanded || !!search;

    return (
        <div>
            {/* ── Group header ── */}
            <div
                onClick={() =>
                    setExpandedSubPatterns((prev) => ({
                        ...prev,
                        [groupKey]: !prev[groupKey],
                    }))
                }
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 20px 10px 44px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.15s ease',
                    background: effectiveExpanded
                        ? isLight ? 'rgba(99,102,241,0.03)' : 'rgba(99,102,241,0.04)'
                        : isHovered
                          ? isLight ? 'rgba(0,0,0,0.012)' : 'rgba(255,255,255,0.015)'
                          : 'transparent',
                    borderBottom: isLight
                        ? '1px solid rgba(0,0,0,0.05)'
                        : '1px solid rgba(255,255,255,0.04)',
                }}
            >
                {/* Chevron */}
                <div
                    style={{
                        transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                        transform: effectiveExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <ChevronRight
                        size={14}
                        color={isLight ? 'rgba(99,102,241,0.5)' : 'rgba(129,140,248,0.5)'}
                    />
                </div>

                {/* Group icon */}
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isLight ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.08)',
                        flexShrink: 0,
                    }}
                >
                    <Layers
                        size={11}
                        color={isLight ? 'rgba(99,102,241,0.6)' : 'rgba(129,140,248,0.6)'}
                    />
                </div>

                {/* Group name */}
                <span
                    style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: isComplete
                            ? isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'
                            : isLight ? '#4338ca' : 'rgba(165,180,252,0.92)',
                        textDecoration: isComplete ? 'line-through' : 'none',
                        textDecorationColor: isComplete ? 'rgba(110,231,183,0.35)' : undefined,
                        letterSpacing: '-0.01em',
                    }}
                >
                    {group.groupName}
                </span>

                {/* Sub-pattern count */}
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)',
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        flexShrink: 0,
                    }}
                >
                    {nonEmptyEntries.length} {nonEmptyEntries.length === 1 ? 'sub-pattern' : 'sub-patterns'}
                </span>

                {/* Aggregate progress */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: isComplete
                            ? 'rgba(110,231,183,0.1)'
                            : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: solvedProblems > 0
                                ? '#6ee7b7'
                                : isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.18)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {solvedProblems}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            color: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)',
                            fontWeight: 600,
                        }}
                    >
                        /
                    </span>
                    <span
                        style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {totalProblems}
                    </span>
                </div>
            </div>

            {/* ── Expanded: Nested sub-pattern rows ── */}
            {effectiveExpanded && (
                <div
                    style={{
                        borderLeft: isLight
                            ? '2px solid rgba(99,102,241,0.08)'
                            : '2px solid rgba(99,102,241,0.06)',
                        marginLeft: 54,
                    }}
                >
                    {nonEmptyEntries.map(({ pattern, leafLabel }) => (
                        <SubPatternRow
                            key={pattern.id}
                            pattern={pattern}
                            leafLabel={leafLabel}
                            category={category}
                            expandedSubPatterns={expandedSubPatterns}
                            setExpandedSubPatterns={setExpandedSubPatterns}
                            solvedSet={solvedSet}
                            isLight={isLight}
                            search={search}
                            selectedDifficulties={selectedDifficulties}
                            onSolveProblem={onSolveProblem}
                            indent={12}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SubPatternRow — One expandable sub-pattern
   ═══════════════════════════════════════════════════════════════════════════ */
const DIFF_COLORS = {
    Easy:   { text: '#6ee7b7', bg: 'rgba(110,231,183,0.08)' },
    Medium: { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    Hard:   { text: '#f87171', bg: 'rgba(248,113,113,0.08)' },
};

function SubPatternRow({
    pattern,
    leafLabel,
    category,
    expandedSubPatterns,
    setExpandedSubPatterns,
    solvedSet,
    isLight,
    search,
    selectedDifficulties,
    onSolveProblem,
    indent = 44,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const subKey = `${category.id}__${pattern.id}`;
    const isExpanded = !!expandedSubPatterns[subKey];
    const probs = pattern.problems || [];
    const solvedCount = probs.filter((pr) => solvedSet.has(pr.id) || pr.status === 'solved').length;
    const isComplete = probs.length > 0 && solvedCount === probs.length;

    const filteredProbs = probs.filter((pr) => {
        if (search) {
            const s = search.toLowerCase();
            if (
                !pr.title.toLowerCase().includes(s) &&
                !leafLabel.toLowerCase().includes(s) &&
                !category.name.toLowerCase().includes(s)
            )
                return false;
        }
        if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty))
            return false;
        return true;
    });

    // Hide sub-patterns with no matching problems when filtering
    if (search || selectedDifficulties.length > 0) {
        if (filteredProbs.length === 0 && !leafLabel.toLowerCase().includes((search || '').toLowerCase())) {
            return null;
        }
    }

    return (
        <div>
            {/* ── Sub-pattern header row ── */}
            <div
                onClick={() =>
                    setExpandedSubPatterns((prev) => ({
                        ...prev,
                        [subKey]: !prev[subKey],
                    }))
                }
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: `11px 20px 11px ${indent}px`,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.15s ease',
                    background: isExpanded
                        ? isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.025)'
                        : isHovered
                          ? isLight ? 'rgba(0,0,0,0.012)' : 'rgba(255,255,255,0.015)'
                          : 'transparent',
                    borderBottom: isLight
                        ? '1px solid rgba(0,0,0,0.04)'
                        : '1px solid rgba(255,255,255,0.03)',
                }}
            >
                {/* Chevron */}
                <div
                    style={{
                        transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <ChevronRight
                        size={14}
                        color={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}
                    />
                </div>

                {/* Pattern name */}
                <span
                    style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 600,
                        color: isComplete
                            ? isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'
                            : isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                        textDecoration: isComplete ? 'line-through' : 'none',
                        textDecorationColor: isComplete ? 'rgba(110,231,183,0.35)' : undefined,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {leafLabel}
                </span>

                {/* Theory button */}
                <Link
                    to={`/patterns/${pattern.id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isLight ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)',
                        color: '#60a5fa',
                        textDecoration: 'none',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        border: 'none',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = isLight
                            ? 'rgba(59,130,246,0.14)'
                            : 'rgba(59,130,246,0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = isLight
                            ? 'rgba(59,130,246,0.08)'
                            : 'rgba(59,130,246,0.1)';
                    }}
                >
                    <BookOpen size={11} />
                    Theory
                </Link>

                {/* Progress pill: "0 / 4" */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: isComplete
                            ? 'rgba(110,231,183,0.1)'
                            : isLight ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.04)',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: solvedCount > 0
                                ? '#6ee7b7'
                                : isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {solvedCount}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)',
                            fontWeight: 600,
                        }}
                    >
                        /
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {probs.length}
                    </span>
                </div>
            </div>

            {/* ── Expanded: Simple problem list ── */}
            {isExpanded && (
                <ExpandedProblems
                    pattern={pattern}
                    filteredProbs={filteredProbs}
                    isLight={isLight}
                    solvedSet={solvedSet}
                    onSolveProblem={onSolveProblem}
                    indent={indent + 20}
                />
            )}
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   ExpandedProblems — Clean, simple problem list (no grid table)
   Each row: # | Title | Difficulty | Solve/Solved | Link
   ═══════════════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 20;

function ExpandedProblems({ _pattern, filteredProbs, isLight, solvedSet, onSolveProblem, indent = 64 }) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const displayed = filteredProbs.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProbs.length;
    const remaining = filteredProbs.length - visibleCount;

    return (
        <div
            style={{
                background: isLight ? 'rgba(0,0,0,0.012)' : 'rgba(0,0,0,0.18)',
                borderBottom: isLight
                    ? '1px solid rgba(0,0,0,0.05)'
                    : '1px solid rgba(255,255,255,0.04)',
            }}
        >
            {displayed.map((problem, i) => {
                const isSolved = solvedSet.has(problem.id) || problem.status === 'solved';
                const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Medium;

                return (
                    <div
                        key={problem.id || i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: `8px 20px 8px ${indent}px`,
                            borderBottom:
                                i < displayed.length - 1
                                    ? isLight
                                        ? '1px solid rgba(0,0,0,0.03)'
                                        : '1px solid rgba(255,255,255,0.02)'
                                    : 'none',
                            transition: 'background 0.12s ease',
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
                        {/* Status / index */}
                        <div style={{ width: 22, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                            {isSolved ? (
                                <CheckCircle2
                                    size={15}
                                    color="#6ee7b7"
                                    style={{ filter: 'drop-shadow(0 0 3px rgba(110,231,183,0.3))' }}
                                />
                            ) : (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.14)',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {i + 1}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <span
                            style={{
                                flex: 1,
                                fontSize: 13,
                                fontWeight: isSolved ? 500 : 600,
                                color: isSolved
                                    ? isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                                    : isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                                textDecoration: isSolved ? 'line-through' : 'none',
                                textDecorationColor: isSolved ? 'rgba(110,231,183,0.4)' : undefined,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {problem.title}
                        </span>

                        {/* Difficulty chip */}
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 800,
                                color: dc.text,
                                background: dc.bg,
                                padding: '2px 8px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                                flexShrink: 0,
                            }}
                        >
                            {problem.difficulty}
                        </span>

                        {/* Solve / Solved */}
                        {isSolved ? (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#6ee7b7',
                                    flexShrink: 0,
                                    width: 48,
                                    textAlign: 'center',
                                }}
                            >
                                ✓ Done
                            </span>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSolveProblem && onSolveProblem(problem.id);
                                }}
                                style={{
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: isLight ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.08)',
                                    border: 'none',
                                    color: '#a78bfa',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isLight
                                        ? 'rgba(139,92,246,0.12)'
                                        : 'rgba(139,92,246,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isLight
                                        ? 'rgba(139,92,246,0.06)'
                                        : 'rgba(139,92,246,0.08)';
                                }}
                            >
                                <Code2 size={10} />
                                Solve
                            </button>
                        )}

                        {/* External link */}
                        {problem.link && (
                            <a
                                href={problem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.18)',
                                    textDecoration: 'none',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#60a5fa';
                                    e.currentTarget.style.background = isLight
                                        ? 'rgba(59,130,246,0.06)'
                                        : 'rgba(59,130,246,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = isLight
                                        ? 'rgba(0,0,0,0.2)'
                                        : 'rgba(255,255,255,0.18)';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                );
            })}

            {/* Load more */}
            {hasMore && (
                <div
                    style={{
                        padding: `8px 20px 8px ${indent}px`,
                        display: 'flex',
                        gap: 12,
                    }}
                >
                    <button
                        onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProbs.length))}
                        style={{
                            padding: '5px 14px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                            border: 'none',
                            color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight
                                ? 'rgba(0,0,0,0.06)'
                                : 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight
                                ? 'rgba(0,0,0,0.04)'
                                : 'rgba(255,255,255,0.04)';
                        }}
                    >
                        <ChevronDown size={12} />
                        Show {Math.min(remaining, PAGE_SIZE)} more
                        <span style={{ fontSize: 9, opacity: 0.5 }}>({remaining} left)</span>
                    </button>
                </div>
            )}

            {filteredProbs.length === 0 && (
                <div
                    style={{
                        padding: `16px 20px 16px ${indent}px`,
                        color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)',
                        fontSize: 11,
                        fontStyle: 'italic',
                    }}
                >
                    No problems match current filters.
                </div>
            )}
        </div>
    );
}
