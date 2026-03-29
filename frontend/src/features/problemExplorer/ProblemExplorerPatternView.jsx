import React from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ExternalLink,
    Lock,
    MessageSquare,
} from 'lucide-react';

export function ProblemExplorerPatternView({
    viewMode,
    isLight,
    dsaPatterns,
    patternCategories,
    problems,
    solvedSet,
    expandedCategories,
    setExpandedCategories,
    expandedSubPatterns,
    setExpandedSubPatterns,
    search,
    selectedDifficulties,
    initialLoading,
    roman,
    getExplanationSnippet,
    onSolveProblem,
}) {
    if (viewMode !== 'patterns') {
        return null;
    }

    return (
        <React.Fragment>
            {(() => {
                // Build set of all problem IDs already in dsaPatterns (to deduplicate)
                const dsaProblemIds = new Set();
                dsaPatterns.forEach((pat) => (pat.problems || []).forEach((p) => dsaProblemIds.add(p.id)));

                // Build global sub-pattern numbering (dsaPatterns + topic-based groups)
                let globalIdx = 0;
                let totalSubPatterns = 0;
                patternCategories.forEach((cat) => {
                    const pats = cat.patternIds.map((id) => dsaPatterns.find((p) => p.id === id)).filter(Boolean);
                    totalSubPatterns += pats.length;
                    // Count extra topic-based sub-pattern if there are matching problems
                    const extraProblems = problems.filter(
                        (p) => !dsaProblemIds.has(p.id) && (p.topics || []).some((t) => (cat.topics || []).includes(t))
                    );
                    if (extraProblems.length > 0) totalSubPatterns += 1;
                });

                return (
                    <div
                        style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.2)',
                        }}
                    >
                        {initialLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '14px 20px',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        animation: `fade-up-in 0.4s ease ${i * 0.07}s both`,
                                    }}
                                >
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: `${35 + (i * 13) % 30}%`, height: 13, borderRadius: 5, background: 'rgba(255,255,255,0.05)', animation: 'skeleton-pulse 1.5s ease-in-out infinite 0.2s' }} />
                                    </div>
                                    <div style={{ width: 60, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'skeleton-pulse 1.5s ease-in-out infinite 0.35s' }} />
                                </div>
                            ))
                        ) : (
                            patternCategories.map((category, catIdx) => {
                                const catPatterns = category.patternIds.map((id) => dsaPatterns.find((p) => p.id === id)).filter(Boolean);

                                // Topic-based extra problems from PROBLEMS database (deduplicated)
                                const extraProblems = problems.filter(
                                    (p) => !dsaProblemIds.has(p.id) && (p.topics || []).some((t) => (category.topics || []).includes(t))
                                );

                                const dsaTotal = catPatterns.reduce((sum, p) => sum + (p.problems || []).length, 0);
                                const totalProblems = dsaTotal + extraProblems.length;
                                const dsaAttempted = catPatterns.reduce(
                                    (sum, p) => sum + (p.problems || []).filter((pr) => solvedSet.has(pr.id) || pr.status === 'solved').length,
                                    0
                                );
                                const extraAttempted = extraProblems.filter((p) => solvedSet.has(p.id)).length;
                                const attemptedProblems = dsaAttempted + extraAttempted;
                                const isCatExpanded = !!expandedCategories[category.id];

                                // Filter: hide category if no matching problems
                                if (search || selectedDifficulties.length > 0) {
                                    const anyDsaMatch = catPatterns.some((pat) => {
                                        if (pat.name.toLowerCase().includes(search.toLowerCase()) || category.name.toLowerCase().includes(search.toLowerCase())) return true;
                                        return (pat.problems || []).some((pr) => {
                                            if (
                                                search &&
                                                !pr.title.toLowerCase().includes(search.toLowerCase()) &&
                                                !pat.name.toLowerCase().includes(search.toLowerCase()) &&
                                                !category.name.toLowerCase().includes(search.toLowerCase())
                                            ) {
                                                return false;
                                            }
                                            if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty)) return false;
                                            return true;
                                        });
                                    });
                                    const anyExtraMatch = extraProblems.some((p) => {
                                        if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !category.name.toLowerCase().includes(search.toLowerCase())) return false;
                                        if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(p.difficulty)) return false;
                                        return true;
                                    });
                                    if (!anyDsaMatch && !anyExtraMatch) return null;
                                }

                                return (
                                    <div key={category.id}>
                                        <div
                                            onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 14,
                                                padding: '15px 20px',
                                                background: isCatExpanded
                                                    ? 'rgba(139,92,246,0.05)'
                                                    : catIdx % 2 === 0
                                                      ? isLight
                                                          ? 'rgba(0,0,0,0.015)'
                                                          : 'rgba(255,255,255,0.015)'
                                                      : 'transparent',
                                                borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                userSelect: 'none',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(139,92,246,0.07)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isCatExpanded
                                                    ? 'rgba(139,92,246,0.05)'
                                                    : catIdx % 2 === 0
                                                      ? isLight
                                                          ? 'rgba(0,0,0,0.015)'
                                                          : 'rgba(255,255,255,0.015)'
                                                      : 'transparent';
                                            }}
                                        >
                                            <div style={{ transition: 'transform 0.2s ease', transform: isCatExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                <ChevronRight size={16} color={isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'} />
                                            </div>
                                            <div
                                                style={{
                                                    minWidth: 32,
                                                    height: 28,
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(139,92,246,0.15)',
                                                    border: '1px solid rgba(139,92,246,0.3)',
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    color: '#c084fc',
                                                    letterSpacing: 0.5,
                                                    padding: '0 6px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {roman[catIdx] || catIdx + 1}
                                            </div>
                                            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: isLight ? '#1e293b' : '#fff', letterSpacing: '-0.01em' }}>{category.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: isLight ? '#1e293b' : '#fff' }}>{totalProblems}</span>
                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)', display: 'block', lineHeight: 1, marginTop: 1 }}>problems</span>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: attemptedProblems > 0 ? '#6ee7b7' : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>{attemptedProblems}</span>
                                                    <span style={{ fontSize: 9, color: attemptedProblems > 0 ? 'rgba(110,231,183,0.6)' : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', display: 'block', lineHeight: 1, marginTop: 1 }}>attempted</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isCatExpanded &&
                                            (() => {
                                                const groupedPatterns = catPatterns.reduce((acc, pattern) => {
                                                    const nameParts = String(pattern.name || '')
                                                        .split(' - ')
                                                        .map((part) => part.trim())
                                                        .filter(Boolean);
                                                    const groupName = nameParts[0] || 'General';
                                                    const leafLabel = nameParts.length > 1 ? nameParts.slice(1).join(' → ') : pattern.name;

                                                    if (!acc[groupName]) acc[groupName] = [];
                                                    acc[groupName].push({ pattern, leafLabel, searchableLabel: `${groupName} ${leafLabel}`.toLowerCase() });
                                                    return acc;
                                                }, {});

                                                const groupColors = [
                                                    { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#c084fc', dot: '#a78bfa' },
                                                    { bg: 'rgba(103,232,249,0.08)', border: 'rgba(103,232,249,0.2)', text: '#67e8f9', dot: '#22d3ee' },
                                                    { bg: 'rgba(110,231,183,0.08)', border: 'rgba(110,231,183,0.2)', text: '#6ee7b7', dot: '#34d399' },
                                                    { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24', dot: '#f59e0b' },
                                                    { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', text: '#f87171', dot: '#ef4444' },
                                                    { bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)', text: '#f472b6', dot: '#ec4899' },
                                                ];

                                                return (
                                                    <div style={{ padding: '12px 16px 16px 16px' }}>
                                                        {Object.entries(groupedPatterns).map(([groupName, entries], groupIdx) => {
                                                            const gc = groupColors[groupIdx % groupColors.length];
                                                            const visibleEntries = entries.filter(({ pattern, searchableLabel }) => {
                                                                const probs = pattern.problems || [];
                                                                const hasMatchingProblems = probs.some((pr) => {
                                                                    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty)) return false;
                                                                    if (!search) return true;
                                                                    const searchKey = search.toLowerCase();
                                                                    return pr.title.toLowerCase().includes(searchKey) || searchableLabel.includes(searchKey) || category.name.toLowerCase().includes(searchKey);
                                                                });

                                                                if (!search && selectedDifficulties.length === 0) return true;
                                                                if (hasMatchingProblems) return true;
                                                                if (!search) return false;
                                                                return searchableLabel.includes(search.toLowerCase());
                                                            });

                                                            if (visibleEntries.length === 0) return null;

                                                            return (
                                                                <div key={`${category.id}__${groupName}`} style={{ marginBottom: 16 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', marginBottom: 8, marginLeft: 8 }}>
                                                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: gc.dot, boxShadow: `0 0 8px ${gc.dot}60`, flexShrink: 0 }} />
                                                                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: gc.text, textTransform: 'uppercase' }}>{groupName}</span>
                                                                        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${gc.border}, transparent)` }} />
                                                                        <span style={{ fontSize: 10, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)' }}>
                                                                            {visibleEntries.length} {visibleEntries.length === 1 ? 'pattern' : 'patterns'}
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 20 }}>
                                                                        {visibleEntries.map(({ pattern, leafLabel }) => {
                                                                            globalIdx++;
                                                                            const subKey = `${category.id}__${pattern.id}`;
                                                                            const isSubExpanded = !!expandedSubPatterns[subKey];
                                                                            const probs = pattern.problems || [];
                                                                            const subAttempted = probs.filter((pr) => solvedSet.has(pr.id) || pr.status === 'solved').length;
                                                                            const progressPct = probs.length > 0 ? Math.round((subAttempted / probs.length) * 100) : 0;
                                                                            const isComplete = progressPct === 100 && probs.length > 0;

                                                                            const filteredProbs = probs.filter((pr) => {
                                                                                if (search) {
                                                                                    const searchKey = search.toLowerCase();
                                                                                    const labelKey = `${groupName} ${leafLabel}`.toLowerCase();
                                                                                    if (!pr.title.toLowerCase().includes(searchKey) && !labelKey.includes(searchKey) && !category.name.toLowerCase().includes(searchKey)) return false;
                                                                                }
                                                                                if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(pr.difficulty)) return false;
                                                                                return true;
                                                                            });

                                                                            if (
                                                                                (search || selectedDifficulties.length > 0) &&
                                                                                filteredProbs.length === 0 &&
                                                                                !`${groupName} ${leafLabel}`.toLowerCase().includes(search.toLowerCase())
                                                                            ) {
                                                                                return null;
                                                                            }

                                                                            return (
                                                                                <div
                                                                                    key={pattern.id}
                                                                                    style={{
                                                                                        borderRadius: 12,
                                                                                        overflow: 'hidden',
                                                                                        border: isSubExpanded
                                                                                            ? `1px solid ${gc.border}`
                                                                                            : isLight
                                                                                              ? '1px solid rgba(0,0,0,0.06)'
                                                                                              : '1px solid rgba(255,255,255,0.05)',
                                                                                        background: isSubExpanded
                                                                                            ? isLight
                                                                                                ? 'rgba(255,255,255,0.8)'
                                                                                                : 'rgba(255,255,255,0.02)'
                                                                                            : isLight
                                                                                              ? 'rgba(255,255,255,0.5)'
                                                                                              : 'rgba(255,255,255,0.015)',
                                                                                        transition: 'all 0.25s ease',
                                                                                        boxShadow: isSubExpanded
                                                                                            ? `0 4px 20px rgba(0,0,0,${isLight ? '0.06' : '0.3'}), 0 0 0 1px ${gc.border}`
                                                                                            : `0 1px 4px rgba(0,0,0,${isLight ? '0.04' : '0.15'})`,
                                                                                    }}
                                                                                >
                                                                                    <div
                                                                                        onClick={() => setExpandedSubPatterns((prev) => ({ ...prev, [subKey]: !prev[subKey] }))}
                                                                                        style={{
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: 12,
                                                                                            padding: '12px 16px',
                                                                                            cursor: 'pointer',
                                                                                            transition: 'all 0.2s ease',
                                                                                            userSelect: 'none',
                                                                                            position: 'relative',
                                                                                        }}
                                                                                        onMouseEnter={(e) => {
                                                                                            e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.background = 'transparent';
                                                                                        }}
                                                                                    >
                                                                                        <div style={{ transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)', transform: isSubExpanded ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.5 }}>
                                                                                            <ChevronRight size={14} color={gc.text} />
                                                                                        </div>

                                                                                        <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                                                                                            <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: 'rotate(-90deg)' }}>
                                                                                                <circle cx="16" cy="16" r="13" stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'} strokeWidth="2.5" fill="none" />
                                                                                                <circle
                                                                                                    cx="16"
                                                                                                    cy="16"
                                                                                                    r="13"
                                                                                                    stroke={isComplete ? '#6ee7b7' : gc.dot}
                                                                                                    strokeWidth="2.5"
                                                                                                    fill="none"
                                                                                                    strokeDasharray={`${2 * Math.PI * 13}`}
                                                                                                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - progressPct / 100)}`}
                                                                                                    strokeLinecap="round"
                                                                                                    style={{
                                                                                                        transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)',
                                                                                                        filter: `drop-shadow(0 0 3px ${isComplete ? 'rgba(110,231,183,0.5)' : `${gc.dot}40`})`,
                                                                                                    }}
                                                                                                />
                                                                                            </svg>
                                                                                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: isComplete ? '#6ee7b7' : gc.text }}>
                                                                                                {isComplete ? '✓' : `${progressPct}%`}
                                                                                            </span>
                                                                                        </div>

                                                                                        <span style={{ fontSize: 10, fontWeight: 700, color: gc.text, background: gc.bg, border: `1px solid ${gc.border}`, padding: '2px 8px', borderRadius: 5, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                                                                                            {globalIdx}/{totalSubPatterns}
                                                                                        </span>

                                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                                            <span style={{ fontSize: 13.5, fontWeight: 600, color: isLight ? '#1e293b' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>{leafLabel}</span>
                                                                                        </div>

                                                                                        {pattern.theory && (
                                                                                            <Link
                                                                                                to={`/patterns/${pattern.id}`}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                style={{
                                                                                                    padding: '4px 10px',
                                                                                                    borderRadius: 6,
                                                                                                    fontSize: 10,
                                                                                                    fontWeight: 700,
                                                                                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.12))',
                                                                                                    border: '1px solid rgba(139,92,246,0.25)',
                                                                                                    color: '#c084fc',
                                                                                                    textDecoration: 'none',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    gap: 4,
                                                                                                    transition: 'all 0.2s ease',
                                                                                                    flexShrink: 0,
                                                                                                }}
                                                                                                onMouseEnter={(e) => {
                                                                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))';
                                                                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                                }}
                                                                                                onMouseLeave={(e) => {
                                                                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.12))';
                                                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                                                }}
                                                                                            >
                                                                                                <BookOpen size={10} /> Theory
                                                                                            </Link>
                                                                                        )}

                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 8px', borderRadius: 6, background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)' }}>
                                                                                                <span style={{ fontSize: 13, fontWeight: 700, color: isLight ? '#334155' : 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>{probs.length}</span>
                                                                                                <span style={{ fontSize: 8, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1 }}>problems</span>
                                                                                            </div>
                                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 8px', borderRadius: 6, background: subAttempted > 0 ? 'rgba(110,231,183,0.06)' : isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}>
                                                                                                <span style={{ fontSize: 13, fontWeight: 700, color: subAttempted > 0 ? '#6ee7b7' : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', lineHeight: 1.2 }}>{subAttempted}</span>
                                                                                                <span style={{ fontSize: 8, color: subAttempted > 0 ? 'rgba(110,231,183,0.6)' : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1 }}>solved</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {isSubExpanded && (
                                                                                        <div style={{ background: isLight ? 'rgba(0,0,0,0.015)' : 'rgba(0,0,0,0.2)', borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : `1px solid ${gc.border}` }}>
                                                                                            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 72px 64px 56px 52px', gap: 6, padding: '8px 16px 6px 16px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)' }}>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>#</span>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>Problem</span>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.3 }}>Notes</span>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.3 }}>Code</span>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.3 }}>AI</span>
                                                                                                <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 0.3 }}>Link</span>
                                                                                            </div>

                                                                                            {filteredProbs.map((problem, probIdx) => {
                                                                                                const isSolved = solvedSet.has(problem.id) || problem.status === 'solved';
                                                                                                const dc = problem.difficulty === 'Easy' ? '#6ee7b7' : problem.difficulty === 'Medium' ? '#fbbf24' : '#f87171';
                                                                                                const dbg = problem.difficulty === 'Easy' ? 'rgba(110,231,183,0.1)' : problem.difficulty === 'Medium' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)';
                                                                                                const dt = problem.difficulty === 'Easy' ? 'E' : problem.difficulty === 'Medium' ? 'M' : 'H';

                                                                                                return (
                                                                                                    <div
                                                                                                        key={problem.id || probIdx}
                                                                                                        style={{
                                                                                                            display: 'grid',
                                                                                                            gridTemplateColumns: '36px 1fr 72px 64px 56px 52px',
                                                                                                            gap: 6,
                                                                                                            padding: '10px 16px',
                                                                                                            alignItems: 'center',
                                                                                                            borderBottom: probIdx < filteredProbs.length - 1 ? (isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.025)') : 'none',
                                                                                                            background: isSolved ? 'rgba(110,231,183,0.03)' : 'transparent',
                                                                                                            transition: 'all 0.15s ease',
                                                                                                        }}
                                                                                                        onMouseEnter={(e) => {
                                                                                                            e.currentTarget.style.background = isLight ? 'rgba(139,92,246,0.03)' : 'rgba(139,92,246,0.04)';
                                                                                                            e.currentTarget.style.transform = 'translateX(2px)';
                                                                                                        }}
                                                                                                        onMouseLeave={(e) => {
                                                                                                            e.currentTarget.style.background = isSolved ? 'rgba(110,231,183,0.03)' : 'transparent';
                                                                                                            e.currentTarget.style.transform = 'translateX(0)';
                                                                                                        }}
                                                                                                    >
                                                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                                            {isSolved ? (
                                                                                                                <CheckCircle2 size={14} color="#6ee7b7" style={{ filter: 'drop-shadow(0 0 4px rgba(110,231,183,0.4))' }} />
                                                                                                            ) : (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        width: 22,
                                                                                                                        height: 22,
                                                                                                                        borderRadius: '50%',
                                                                                                                        display: 'flex',
                                                                                                                        alignItems: 'center',
                                                                                                                        justifyContent: 'center',
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 700,
                                                                                                                        color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)',
                                                                                                                        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                                                                                                        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
                                                                                                                    }}
                                                                                                                >
                                                                                                                    {probIdx + 1}
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                                                                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                                                                                                                <span style={{ fontSize: 13, fontWeight: isSolved ? 500 : 600, color: isSolved ? (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)') : isLight ? '#1e293b' : '#fff', textDecoration: isSolved ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                                                    {problem.title}
                                                                                                                </span>
                                                                                                                <span style={{ fontSize: 10, color: isLight ? 'rgba(30,41,59,0.45)' : 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                                                    {getExplanationSnippet(problem)}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                            <span style={{ fontSize: 9, fontWeight: 800, color: dc, background: dbg, padding: '2px 7px', borderRadius: 4, border: `1px solid ${dc}20`, letterSpacing: 0.5, flexShrink: 0 }}>{dt}</span>
                                                                                                        </div>

                                                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                                            {pattern.theory ? (
                                                                                                                <Link
                                                                                                                    to={`/patterns/${pattern.id}`}
                                                                                                                    style={{
                                                                                                                        padding: '3px 8px',
                                                                                                                        borderRadius: 5,
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 600,
                                                                                                                        background: 'rgba(139,92,246,0.1)',
                                                                                                                        color: '#c084fc',
                                                                                                                        textDecoration: 'none',
                                                                                                                        transition: 'all 0.15s',
                                                                                                                    }}
                                                                                                                    onMouseEnter={(e) => {
                                                                                                                        e.currentTarget.style.background = 'rgba(139,92,246,0.2)';
                                                                                                                    }}
                                                                                                                    onMouseLeave={(e) => {
                                                                                                                        e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Editorial
                                                                                                                </Link>
                                                                                                            ) : (
                                                                                                                <Lock size={12} color={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'} />
                                                                                                            )}
                                                                                                        </div>

                                                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                                            <button
                                                                                                                onClick={() => onSolveProblem(problem.id)}
                                                                                                                style={{
                                                                                                                    padding: '4px 12px',
                                                                                                                    borderRadius: 6,
                                                                                                                    fontSize: 10,
                                                                                                                    fontWeight: 700,
                                                                                                                    background: isSolved
                                                                                                                        ? 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(52,211,153,0.15))'
                                                                                                                        : 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(99,102,241,0.85))',
                                                                                                                    border: isSolved ? '1px solid rgba(110,231,183,0.3)' : 'none',
                                                                                                                    color: isSolved ? '#6ee7b7' : '#fff',
                                                                                                                    cursor: 'pointer',
                                                                                                                    boxShadow: isSolved ? 'none' : '0 2px 6px rgba(59,130,246,0.2)',
                                                                                                                    transition: 'all 0.2s ease',
                                                                                                                }}
                                                                                                                onMouseEnter={(e) => {
                                                                                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                                                    e.currentTarget.style.boxShadow = isSolved ? '0 2px 8px rgba(110,231,183,0.15)' : '0 4px 12px rgba(59,130,246,0.3)';
                                                                                                                }}
                                                                                                                onMouseLeave={(e) => {
                                                                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                                                                    e.currentTarget.style.boxShadow = isSolved ? 'none' : '0 2px 6px rgba(59,130,246,0.2)';
                                                                                                                }}
                                                                                                            >
                                                                                                                {isSolved ? 'Redo' : 'Solve'}
                                                                                                            </button>
                                                                                                        </div>

                                                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                                            <MessageSquare size={13} color={isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.15)'} style={{ cursor: 'pointer', transition: 'color 0.15s' }} />
                                                                                                        </div>

                                                                                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                                            {problem.leetcodeLink ? (
                                                                                                                <a
                                                                                                                    href={problem.leetcodeLink}
                                                                                                                    target="_blank"
                                                                                                                    rel="noopener noreferrer"
                                                                                                                    style={{
                                                                                                                        display: 'flex',
                                                                                                                        alignItems: 'center',
                                                                                                                        padding: 4,
                                                                                                                        borderRadius: 5,
                                                                                                                        color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)',
                                                                                                                        transition: 'all 0.15s',
                                                                                                                    }}
                                                                                                                    onMouseEnter={(e) => {
                                                                                                                        e.currentTarget.style.color = '#fbbf24';
                                                                                                                        e.currentTarget.style.background = 'rgba(251,191,36,0.08)';
                                                                                                                    }}
                                                                                                                    onMouseLeave={(e) => {
                                                                                                                        e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)';
                                                                                                                        e.currentTarget.style.background = 'transparent';
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <ExternalLink size={12} />
                                                                                                                </a>
                                                                                                            ) : (
                                                                                                                <span style={{ color: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}>—</span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}

                                                                                            {filteredProbs.length === 0 && (
                                                                                                <div style={{ padding: '20px 16px', textAlign: 'center', color: isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)', fontSize: 12, fontStyle: 'italic' }}>
                                                                                                    No problems match current filters.
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                        {isCatExpanded &&
                                            extraProblems.length > 0 &&
                                            (() => {
                                                globalIdx++;
                                                const extraKey = `${category.id}__extra`;
                                                const isExtraExpanded = !!expandedSubPatterns[extraKey];
                                                const extraAttemptedCount = extraProblems.filter((p) => solvedSet.has(p.id)).length;

                                                const filteredExtra = extraProblems.filter((p) => {
                                                    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !category.name.toLowerCase().includes(search.toLowerCase())) return false;
                                                    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(p.difficulty)) return false;
                                                    return true;
                                                });

                                                if ((search || selectedDifficulties.length > 0) && filteredExtra.length === 0) return null;

                                                return (
                                                    <div>
                                                        <div
                                                            onClick={() => setExpandedSubPatterns((prev) => ({ ...prev, [extraKey]: !prev[extraKey] }))}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 12,
                                                                padding: '11px 20px 11px 52px',
                                                                background: isExtraExpanded ? 'rgba(251,191,36,0.04)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.15)',
                                                                borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                                userSelect: 'none',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = 'rgba(251,191,36,0.06)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = isExtraExpanded ? 'rgba(251,191,36,0.04)' : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.15)';
                                                            }}
                                                        >
                                                            <div style={{ transition: 'transform 0.2s ease', transform: isExtraExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                                <ChevronRight size={14} color={isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'} />
                                                            </div>
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', padding: '2px 8px', borderRadius: 5, flexShrink: 0 }}>
                                                                {globalIdx}/{totalSubPatterns}
                                                            </span>
                                                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isLight ? '#334155' : 'rgba(255,255,255,0.85)' }}>
                                                                More {category.name.replace(' Patterns', '').replace(' Manipulation', '')} Problems
                                                            </span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }}>{extraProblems.length} problems</span>
                                                                <span style={{ fontSize: 12, fontWeight: 600, color: extraAttemptedCount > 0 ? '#6ee7b7' : isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>{extraAttemptedCount} attempted</span>
                                                            </div>
                                                        </div>

                                                        {isExtraExpanded && (
                                                            <div style={{ background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.3)' }}>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px 70px 60px', gap: 8, padding: '7px 20px 7px 90px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase' }}></span>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase' }}>Problem</span>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Editorial</span>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Code</span>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>AI Coach</span>
                                                                    <span style={{ fontSize: 9, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>External</span>
                                                                </div>

                                                                {filteredExtra.map((problem, probIdx) => {
                                                                    const isSolved = solvedSet.has(problem.id);
                                                                    const dc = problem.difficulty === 'Easy' ? '#6ee7b7' : problem.difficulty === 'Medium' ? '#fbbf24' : '#f87171';
                                                                    const dbg = problem.difficulty === 'Easy' ? 'rgba(110,231,183,0.12)' : problem.difficulty === 'Medium' ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';
                                                                    const dt = problem.difficulty === 'Easy' ? 'E' : problem.difficulty === 'Medium' ? 'M' : 'H';

                                                                    return (
                                                                        <div
                                                                            key={problem.id}
                                                                            style={{
                                                                                display: 'grid',
                                                                                gridTemplateColumns: '40px 1fr 80px 70px 70px 60px',
                                                                                gap: 8,
                                                                                padding: '9px 20px 9px 90px',
                                                                                alignItems: 'center',
                                                                                borderBottom: probIdx < filteredExtra.length - 1 ? (isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.025)') : 'none',
                                                                                background: isSolved ? 'rgba(110,231,183,0.025)' : probIdx % 2 === 0 ? (isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.008)') : 'transparent',
                                                                                transition: 'background 0.15s',
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.background = 'rgba(139,92,246,0.04)';
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.background = isSolved
                                                                                    ? 'rgba(110,231,183,0.025)'
                                                                                    : probIdx % 2 === 0
                                                                                      ? isLight
                                                                                          ? 'rgba(0,0,0,0.015)'
                                                                                          : 'rgba(255,255,255,0.008)'
                                                                                      : 'transparent';
                                                                            }}
                                                                        >
                                                                            <span style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{probIdx + 1}.</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                                                {isSolved && <CheckCircle2 size={12} color="#6ee7b7" style={{ flexShrink: 0 }} />}
                                                                                <span style={{ fontSize: 13, fontWeight: 500, color: isSolved ? (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)') : isLight ? '#1e293b' : '#fff', textDecoration: isSolved ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {problem.title}
                                                                                </span>
                                                                                <span style={{ fontSize: 9, fontWeight: 800, color: dc, background: dbg, padding: '1px 6px', borderRadius: 3, border: `1px solid ${dc}25`, letterSpacing: 0.5, flexShrink: 0 }}>{dt}</span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <Lock size={12} color={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'} />
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <button
                                                                                    onClick={() => onSolveProblem(problem.id)}
                                                                                    style={{
                                                                                        padding: '4px 14px',
                                                                                        borderRadius: 6,
                                                                                        fontSize: 11,
                                                                                        fontWeight: 700,
                                                                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))',
                                                                                        border: 'none',
                                                                                        color: '#fff',
                                                                                        cursor: 'pointer',
                                                                                        boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                                                                                    }}
                                                                                    onMouseEnter={(e) => {
                                                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.35)';
                                                                                    }}
                                                                                    onMouseLeave={(e) => {
                                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.2)';
                                                                                    }}
                                                                                >
                                                                                    Solve
                                                                                </button>
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <MessageSquare size={14} color={isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.18)'} style={{ cursor: 'pointer' }} />
                                                                            </div>
                                                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                                <span style={{ color: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)' }}>—</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {filteredExtra.length === 0 && (
                                                                    <div style={{ padding: '14px 90px', color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)', fontSize: 12 }}>No problems match current filters.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                    </div>
                                );
                            })
                        )}
                    </div>
                );
            })()}
        </React.Fragment>
    );
}
