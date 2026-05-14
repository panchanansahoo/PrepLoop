import { useMemo } from 'react';

/**
 * AI-powered recommendation engine for roadmap guides.
 * Suggests next topics based on progress, difficulty, and learning patterns.
 */
export default function useAIRecommendations(enrichedRoots, guideProgressById = {}) {
    const recommendations = useMemo(() => {
        // Flatten the roadmap to get all guides
        const allGuides = [];
        const collectGuides = (nodes) => {
            nodes.forEach((node) => {
                if (node.guide) {
                    const progress = guideProgressById[node.guide.id] || {};
                    allGuides.push({
                        ...node.guide,
                        nodeId: node.id,
                        completed: progress.isComplete || false,
                        solvedCount: progress.solvedCount || 0,
                        totalCount: progress.solvedCount ? progress.solvedCount + progress.remainingCount : node.guide.problemCount || 0,
                        difficulty: node.difficulty || 'Medium',
                        lineage: node.lineage || [],
                        parent: node.parent,
                    });
                }
                if (node.children?.length) {
                    collectGuides(node.children);
                }
            });
        };
        collectGuides(enrichedRoots);

        // Calculate user metrics
        const completedGuides = allGuides.filter((g) => g.completed);
        const inProgressGuides = allGuides.filter((g) => !g.completed && g.solvedCount > 0);
        const notStartedGuides = allGuides.filter((g) => !g.completed && g.solvedCount === 0);

        const totalGuidesCompleted = completedGuides.length;
        const totalProblems = allGuides.reduce((sum, g) => sum + (g.totalCount || 0), 0);
        const totalSolved = allGuides.reduce((sum, g) => sum + g.solvedCount, 0);
        const overallProgress = totalProblems > 0 ? (totalSolved / totalProblems) * 100 : 0;

        // Identify user's difficulty level based on success rate
        const completionRateByDifficulty = {
            Easy: { completed: 0, total: 0 },
            Medium: { completed: 0, total: 0 },
            Hard: { completed: 0, total: 0 },
        };
        allGuides.forEach((guide) => {
            const level = guide.difficulty || 'Medium';
            if (completionRateByDifficulty[level]) {
                completionRateByDifficulty[level].total += 1;
                if (guide.completed) completionRateByDifficulty[level].completed += 1;
            }
        });

        const difficultyCompletionRate = {
            Easy: completionRateByDifficulty.Easy.total > 0 ? (completionRateByDifficulty.Easy.completed / completionRateByDifficulty.Easy.total) * 100 : 0,
            Medium: completionRateByDifficulty.Medium.total > 0 ? (completionRateByDifficulty.Medium.completed / completionRateByDifficulty.Medium.total) * 100 : 0,
            Hard: completionRateByDifficulty.Hard.total > 0 ? (completionRateByDifficulty.Hard.completed / completionRateByDifficulty.Hard.total) * 100 : 0,
        };

        // Recommendation logic
        const recommendations = [];

        // 1. Continue from in-progress
        if (inProgressGuides.length > 0) {
            const progressSorted = inProgressGuides.sort((a, b) => {
                const progressA = a.solvedCount / (a.totalCount || 1);
                const progressB = b.solvedCount / (b.totalCount || 1);
                return progressB - progressA; // Most progressed first
            });
            progressSorted.slice(0, 2).forEach((guide) => {
                recommendations.push({
                    type: 'continue',
                    guide,
                    reason: `You've already started this. You've solved ${guide.solvedCount} of ${guide.totalCount} problems. Keep the momentum!`,
                    priority: 100,
                });
            });
        }

        // 2. Recommend next based on parent completion
        const nextBySiblings = new Map(); // Track recommendations by guide ID
        completedGuides.forEach((completed) => {
            // Find siblings of completed guides
            const siblings = allGuides.filter(
                (g) =>
                    !g.completed &&
                    g.solvedCount === 0 &&
                    g.parent === completed.parent &&
                    g.difficulty === completed.difficulty
            );
            siblings.forEach((sibling) => {
                if (!nextBySiblings.has(sibling.id)) {
                    nextBySiblings.set(sibling.id, { guide: sibling, completedCount: 0 });
                }
                nextBySiblings.get(sibling.id).completedCount += 1;
            });
        });

        const siblingRecommendations = Array.from(nextBySiblings.values())
            .sort((a, b) => b.completedCount - a.completedCount)
            .slice(0, 3);

        siblingRecommendations.forEach(({ guide, completedCount }) => {
            const siblingCount = allGuides.filter((g) => g.parent === guide.parent).length;
            recommendations.push({
                type: 'natural-progression',
                guide,
                reason: `You've mastered ${completedCount} similar ${guide.difficulty.toLowerCase()} concepts. Try this next sibling topic.`,
                priority: 80 + Math.min(completedCount * 5, 10),
            });
        });

        // 3. Recommend by difficulty progression
        if (difficultyCompletionRate.Easy > 70 && difficultyCompletionRate.Medium < 50) {
            const mediumCandidates = notStartedGuides.filter((g) => g.difficulty === 'Medium').slice(0, 2);
            mediumCandidates.forEach((guide) => {
                recommendations.push({
                    type: 'difficulty-step-up',
                    guide,
                    reason: 'You\'ve mastered Easy concepts. Time to challenge yourself with Medium difficulty.',
                    priority: 70,
                });
            });
        }

        if (difficultyCompletionRate.Medium > 60 && difficultyCompletionRate.Hard < 40) {
            const hardCandidates = notStartedGuides.filter((g) => g.difficulty === 'Hard').slice(0, 2);
            hardCandidates.forEach((guide) => {
                recommendations.push({
                    type: 'difficulty-step-up',
                    guide,
                    reason: 'You\'ve conquered Medium concepts. Ready to tackle Hard challenges.',
                    priority: 65,
                });
            });
        }

        // 4. Weak area identification - find difficulty level with low completion
        const weakAreas = Object.entries(difficultyCompletionRate)
            .filter(([, rate]) => rate > 0 && rate < 50)
            .map(([difficulty]) => difficulty);

        if (weakAreas.length > 0) {
            const weakDifficulty = weakAreas[0];
            const weakCandidates = notStartedGuides.filter((g) => g.difficulty === weakDifficulty).slice(0, 2);
            weakCandidates.forEach((guide) => {
                recommendations.push({
                    type: 'weak-area',
                    guide,
                    reason: `You're struggling with ${weakDifficulty} concepts (${Math.round(difficultyCompletionRate[weakDifficulty])}% complete). Let's strengthen this area.`,
                    priority: 85,
                });
            });
        }

        // 5. Diversify if one branch is over-completed
        const completionByBranch = {};
        allGuides.forEach((guide) => {
            const branch = guide.lineage?.[0]?.id || 'other';
            if (!completionByBranch[branch]) {
                completionByBranch[branch] = { completed: 0, total: 0 };
            }
            completionByBranch[branch].total += 1;
            if (guide.completed) completionByBranch[branch].completed += 1;
        });

        const maxCompletion = Math.max(...Object.values(completionByBranch).map((b) => (b.total > 0 ? b.completed / b.total : 0)));
        const underdevelopedBranches = Object.entries(completionByBranch)
            .filter(([, data]) => data.total > 0 && data.completed / data.total < maxCompletion - 0.2)
            .map(([branch]) => branch);

        if (underdevelopedBranches.length > 0) {
            const diversifyGuides = notStartedGuides
                .filter((g) => underdevelopedBranches.includes(g.lineage?.[0]?.id || 'other'))
                .slice(0, 2);
            diversifyGuides.forEach((guide) => {
                recommendations.push({
                    type: 'diversify',
                    guide,
                    reason: 'Broaden your knowledge. You\'ve been focused on one area - let\'s explore another.',
                    priority: 60,
                });
            });
        }

        // 6. Quick wins - suggest easy topics if progress is slow
        if (overallProgress < 30 && inProgressGuides.length === 0) {
            const quickWins = notStartedGuides.filter((g) => g.difficulty === 'Easy').slice(0, 2);
            quickWins.forEach((guide) => {
                recommendations.push({
                    type: 'quick-win',
                    guide,
                    reason: 'Start with quick wins to build confidence and momentum.',
                    priority: 55,
                });
            });
        }

        // Remove duplicates and sort by priority
        const uniqueRecommendations = [];
        const seenGuideIds = new Set();
        recommendations
            .sort((a, b) => b.priority - a.priority)
            .forEach((rec) => {
                if (!seenGuideIds.has(rec.guide.id)) {
                    uniqueRecommendations.push(rec);
                    seenGuideIds.add(rec.guide.id);
                }
            });

        return {
            recommendations: uniqueRecommendations.slice(0, 5), // Top 5 recommendations
            stats: {
                totalGuides: allGuides.length,
                completedGuides: totalGuidesCompleted,
                inProgressGuides: inProgressGuides.length,
                notStartedGuides: notStartedGuides.length,
                overallProgress: Math.round(overallProgress),
                difficultyCompletionRate,
                totalProblems,
                totalSolved,
            },
            insights: generateInsights(
                totalGuidesCompleted,
                difficultyCompletionRate,
                overallProgress,
                inProgressGuides.length
            ),
        };
    }, [enrichedRoots, guideProgressById]);

    return recommendations;
}

/**
 * Generate actionable insights based on user progress
 */
function generateInsights(completedCount, difficultyRates, overallProgress, inProgressCount) {
    const insights = [];

    if (completedCount === 0) {
        insights.push({
            type: 'encouragement',
            message: 'Welcome! You\'re just getting started. Pick a guide and solve your first problem.',
        });
    } else if (completedCount < 5) {
        insights.push({
            type: 'momentum',
            message: `Great start! You've completed ${completedCount} ${completedCount === 1 ? 'guide' : 'guides'}. Keep going!`,
        });
    }

    if (difficultyRates.Easy > 80 && difficultyRates.Medium < 30) {
        insights.push({
            type: 'difficulty-advice',
            message: 'You\'ve mastered the basics. Challenge yourself with medium and hard problems to accelerate growth.',
        });
    }

    if (inProgressCount > 3) {
        insights.push({
            type: 'focus-advice',
            message: `You have ${inProgressCount} guides in progress. Consider finishing one before starting another.`,
        });
    }

    if (overallProgress > 50 && overallProgress < 80) {
        insights.push({
            type: 'momentum',
            message: 'You\'re more than halfway there! The toughest part is behind you.',
        });
    }

    if (overallProgress > 80) {
        insights.push({
            type: 'celebration',
            message: 'Impressive! You\'re almost done. Final push to the finish line!',
        });
    }

    if (difficultyRates.Hard < 30 && completedCount > 5) {
        insights.push({
            type: 'difficulty-advice',
            message: 'You\'re ready for advanced concepts. Hard problems will accelerate your learning the most.',
        });
    }

    return insights.slice(0, 3); // Return top 3 insights
}
