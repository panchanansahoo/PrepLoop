/**
 * useDsaPatterns Hook
 * 
 * Encapsulates the core "first-match-wins" deduplication logic for mapping
 * problems to sub-patterns. Extracted from ProblemExplorer.jsx for separation
 * of data concerns from UI concerns.
 */
import { useMemo } from 'react';
import { PROBLEMS } from '../data/problemsDatabase';
import { dsaPatternsAll as baseDsaPatterns } from '../data/dsaPatternsData';
import {
    PATTERN_CATEGORIES,
    EXTRA_SUBPATTERN_MATCHERS,
    FIXED_PATTERN_PROBLEM_COUNTS,
} from '../data/problemExplorerConfig';

export function useDsaPatterns(solvedSet) {
    const dsaPatterns = useMemo(() => {
        const basePatternsById = new Map(baseDsaPatterns.map((pattern) => [pattern.id, pattern]));

        // ── Global registry: first-match-wins deduplication ──
        const assignedProblemIds = new Set();
        const results = [];

        // First pass: collect all problem IDs from base (pre-existing) patterns
        // so dynamically-matched sub-patterns won't duplicate them
        for (const category of PATTERN_CATEGORIES) {
            for (const subPattern of category.subPatterns) {
                const existing = basePatternsById.get(subPattern.id);
                if (existing) {
                    (existing.problems || []).forEach(p => assignedProblemIds.add(p.id));
                }
            }
        }

        // Second pass: build each sub-pattern with deduplication
        for (const category of PATTERN_CATEGORIES) {
            for (const subPattern of category.subPatterns) {
                const existing = basePatternsById.get(subPattern.id);
                if (existing) {
                    // Use the config name (which has "Group - Subgroup" format)
                    // so PatternCategoryItem grouping works correctly
                    results.push({ ...existing, name: subPattern.name });
                    continue;
                }

                const topicSet = new Set([...(category.topics || []), ...(subPattern.topics || [])]);
                const matcher = EXTRA_SUBPATTERN_MATCHERS[subPattern.id];

                const scoredProblems = PROBLEMS
                    .filter((problem) => !assignedProblemIds.has(problem.id))   // skip already-assigned
                    .map((problem) => {
                        const title = String(problem.title || '').toLowerCase();
                        const topics = problem.topics || [];
                        const hasTopicMatch = topics.some((topic) => topicSet.has(topic));

                        let score = hasTopicMatch ? 1 : 0;

                        if (matcher) {
                            const keywordHits = (matcher.keywords || []).reduce((count, keyword) => (
                                title.includes(String(keyword).toLowerCase()) ? count + 1 : count
                            ), 0);

                            const hintTopicHits = (matcher.topicHints || []).reduce((count, hint) => (
                                topics.includes(hint) ? count + 1 : count
                            ), 0);

                            score += (keywordHits * 4) + (hintTopicHits * 2);
                        }

                        return { problem, score };
                    });

                let matchedProblems = scoredProblems
                    .filter(({ score }) => score > 0)
                    .sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return String(a.problem.id).localeCompare(String(b.problem.id));
                    })
                    .map(({ problem }) => problem);

                const targetCount = FIXED_PATTERN_PROBLEM_COUNTS[subPattern.id] ?? (matcher ? 12 : 20);
                if (typeof targetCount === 'number') matchedProblems = matchedProblems.slice(0, targetCount);

                // Register these problems as assigned
                matchedProblems.forEach(p => assignedProblemIds.add(p.id));

                const fallbackProblems = matchedProblems.map((problem) => ({
                    id: problem.id,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    status: solvedSet.has(problem.id) ? 'solved' : 'pending',
                    leetcodeLink: problem.leetcodeLink,
                    link: `/problem/${problem.id}`,
                }));

                results.push({
                    id: subPattern.id,
                    name: subPattern.name,
                    category: category.name,
                    difficulty: 'Mixed',
                    description: `${subPattern.name} practice track`,
                    theory: '',
                    examples: [],
                    problems: fallbackProblems,
                });
            }
        }

        return results;
    }, [solvedSet]);

    return dsaPatterns;
}
