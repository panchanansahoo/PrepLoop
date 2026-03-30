import React, { useRef } from 'react';
import { PatternCategoryItem } from './PatternCategoryItem';

/**
 * ProblemExplorerPatternView – Container component for the DSA pattern
 * accordion view. Delegates rendering to PatternCategoryItem, which in turn
 * uses SubPatternList and ProblemRow.
 *
 * Component hierarchy:
 *   ProblemExplorerPatternView
 *     └── PatternCategoryItem          (one per category)
 *           ├── SubPatternList          (one per group inside category)
 *           │     └── ProblemRow        (one per problem)
 *           └── ExtraProblemsSection    (optional overflow problems)
 */
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
    // Mutable ref to track global sub-pattern index across categories
    const globalIdxRef = useRef(0);

    if (viewMode !== 'patterns') {
        return null;
    }

    // Build set of all problem IDs already in dsaPatterns (to deduplicate)
    const dsaProblemIds = new Set();
    dsaPatterns.forEach((pat) => (pat.problems || []).forEach((p) => dsaProblemIds.add(p.id)));

    // Build global sub-pattern count
    let totalSubPatterns = 0;
    patternCategories.forEach((cat) => {
        const pats = cat.patternIds
            .map((id) => dsaPatterns.find((p) => p.id === id))
            .filter(Boolean);
        totalSubPatterns += pats.length;
        const extraProblems = problems.filter(
            (p) =>
                !dsaProblemIds.has(p.id) &&
                (p.topics || []).some((t) => (cat.topics || []).includes(t))
        );
        if (extraProblems.length > 0) totalSubPatterns += 1;
    });

    // Reset global index for this render
    globalIdxRef.current = 0;

    return (
        <React.Fragment>
            <div
                style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: isLight
                        ? '1px solid rgba(0,0,0,0.1)'
                        : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isLight
                        ? '0 4px 24px rgba(0,0,0,0.06)'
                        : '0 4px 24px rgba(0,0,0,0.2)',
                }}
            >
                {initialLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
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
                              <div
                                  style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 8,
                                      background: 'rgba(255,255,255,0.04)',
                                      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                                  }}
                              />
                              <div style={{ flex: 1 }}>
                                  <div
                                      style={{
                                          width: `${35 + ((i * 13) % 30)}%`,
                                          height: 13,
                                          borderRadius: 5,
                                          background: 'rgba(255,255,255,0.05)',
                                          animation:
                                              'skeleton-pulse 1.5s ease-in-out infinite 0.2s',
                                      }}
                                  />
                              </div>
                              <div
                                  style={{
                                      width: 60,
                                      height: 10,
                                      borderRadius: 4,
                                      background: 'rgba(255,255,255,0.03)',
                                      animation:
                                          'skeleton-pulse 1.5s ease-in-out infinite 0.35s',
                                  }}
                              />
                          </div>
                      ))
                    : patternCategories.map((category, catIdx) => {
                          const catPatterns = category.patternIds
                              .map((id) => dsaPatterns.find((p) => p.id === id))
                              .filter(Boolean);

                          const extraProblems = problems.filter(
                              (p) =>
                                  !dsaProblemIds.has(p.id) &&
                                  (p.topics || []).some((t) =>
                                      (category.topics || []).includes(t)
                                  )
                          );

                          const dsaTotal = catPatterns.reduce(
                              (sum, p) => sum + (p.problems || []).length,
                              0
                          );
                          const totalProblems = dsaTotal + extraProblems.length;
                          const dsaAttempted = catPatterns.reduce(
                              (sum, p) =>
                                  sum +
                                  (p.problems || []).filter(
                                      (pr) => solvedSet.has(pr.id) || pr.status === 'solved'
                                  ).length,
                              0
                          );
                          const extraAttempted = extraProblems.filter((p) =>
                              solvedSet.has(p.id)
                          ).length;
                          const attemptedProblems = dsaAttempted + extraAttempted;

                          return (
                              <PatternCategoryItem
                                  key={category.id}
                                  category={category}
                                  catIdx={catIdx}
                                  catPatterns={catPatterns}
                                  extraProblems={extraProblems}
                                  totalProblems={totalProblems}
                                  attemptedProblems={attemptedProblems}
                                  globalIdxRef={globalIdxRef}
                                  totalSubPatterns={totalSubPatterns}
                                  isLight={isLight}
                                  roman={roman}
                                  solvedSet={solvedSet}
                                  expandedCategories={expandedCategories}
                                  setExpandedCategories={setExpandedCategories}
                                  expandedSubPatterns={expandedSubPatterns}
                                  setExpandedSubPatterns={setExpandedSubPatterns}
                                  search={search}
                                  selectedDifficulties={selectedDifficulties}
                                  getExplanationSnippet={getExplanationSnippet}
                                  onSolveProblem={onSolveProblem}
                              />
                          );
                      })}
            </div>
        </React.Fragment>
    );
}
