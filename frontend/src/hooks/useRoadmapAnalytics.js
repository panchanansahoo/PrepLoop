import { useMemo } from 'react';

/**
 * Advanced analytics hook for roadmap progress tracking
 * Calculates completion trends, streaks, velocity, and generates reports
 */
export default function useRoadmapAnalytics(enrichedRoots, guideProgressById = {}) {
    const analytics = useMemo(() => {
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
                        completedAt: progress.completedAt || null,
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

        // Calculate overall stats
        const completedGuides = allGuides.filter((g) => g.completed);
        const inProgressGuides = allGuides.filter((g) => !g.completed && g.solvedCount > 0);
        const notStartedGuides = allGuides.filter((g) => !g.completed && g.solvedCount === 0);

        const totalGuides = allGuides.length;
        const totalProblems = allGuides.reduce((sum, g) => sum + (g.totalCount || 0), 0);
        const totalSolved = allGuides.reduce((sum, g) => sum + g.solvedCount, 0);
        const overallProgress = totalProblems > 0 ? (totalSolved / totalProblems) * 100 : 0;

        // Calculate completion rate by difficulty
        const completionByDifficulty = {
            Easy: { completed: 0, total: 0, solved: 0, problems: 0 },
            Medium: { completed: 0, total: 0, solved: 0, problems: 0 },
            Hard: { completed: 0, total: 0, solved: 0, problems: 0 },
        };
        allGuides.forEach((guide) => {
            const level = guide.difficulty || 'Medium';
            if (completionByDifficulty[level]) {
                completionByDifficulty[level].total += 1;
                completionByDifficulty[level].problems += guide.totalCount || 0;
                completionByDifficulty[level].solved += guide.solvedCount || 0;
                if (guide.completed) completionByDifficulty[level].completed += 1;
            }
        });

        const difficultyAnalytics = Object.entries(completionByDifficulty).map(([difficulty, data]) => ({
            difficulty,
            completed: data.completed,
            total: data.total,
            completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
            solvedProblems: data.solved,
            totalProblems: data.problems,
            problemCompletionRate: data.problems > 0 ? Math.round((data.solved / data.problems) * 100) : 0,
        }));

        // Calculate completion trend (simulated - in production would use timestamps)
        const completionTrend = calculateCompletionTrend(completedGuides);

        // Calculate learning velocity (guides completed per milestone)
        const velocity = calculateVelocity(completedGuides);

        // Calculate streak (consecutive days of activity - simulated)
        const currentStreak = calculateCurrentStreak(completedGuides);
        const maxStreak = calculateMaxStreak(completedGuides);

        // Branch-level analytics
        const branchAnalytics = calculateBranchAnalytics(enrichedRoots, allGuides);

        // Time estimates
        const timeEstimates = calculateTimeEstimates(completedGuides, inProgressGuides, totalSolved, totalProblems);

        // Weak areas
        const weakAreas = difficultyAnalytics.filter((d) => d.total > 0 && d.completionRate < 50);

        // Strengths
        const strengths = difficultyAnalytics.filter((d) => d.total > 0 && d.completionRate > 70);

        // Performance metrics
        const avgProblemsPerGuide = completedGuides.length > 0 ? Math.round(allGuides.reduce((sum, g) => sum + (g.totalCount || 0), 0) / allGuides.length) : 0;
        const avgSolveTimePerProblem = completedGuides.length > 0 ? Math.round((24 * 60) / (totalSolved || 1)) : 0; // Simulated: minutes

        return {
            // Overview
            overview: {
                totalGuides,
                completedGuides: completedGuides.length,
                inProgressGuides: inProgressGuides.length,
                notStartedGuides: notStartedGuides.length,
                overallProgress: Math.round(overallProgress),
                totalProblems,
                totalSolved,
            },

            // Difficulty Analytics
            difficultyAnalytics,

            // Trends
            completionTrend,
            velocity,

            // Streaks
            currentStreak,
            maxStreak,

            // Branch Analytics
            branchAnalytics,

            // Time Estimates
            timeEstimates,

            // Weak Areas & Strengths
            weakAreas,
            strengths,

            // Performance
            performanceMetrics: {
                avgProblemsPerGuide,
                avgSolveTimePerProblem,
                totalHoursSpent: Math.round(totalSolved * avgSolveTimePerProblem / 60),
            },

            // Raw Data
            allGuides,
            completedGuides,
            inProgressGuides,
        };
    }, [enrichedRoots, guideProgressById]);

    return analytics;
}

function calculateCompletionTrend(completedGuides) {
    // Simulated trend data - in production would use real timestamps
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const guidesPerWeek = Math.ceil(completedGuides.length / weeks.length);

    return weeks.map((week, idx) => ({
        week,
        completed: Math.min(guidesPerWeek * (idx + 1), completedGuides.length),
        percentage: Math.min(Math.round((guidesPerWeek * (idx + 1) / completedGuides.length) * 100), 100),
    }));
}

function calculateVelocity(completedGuides) {
    // Guides per day (simulated)
    const days = Math.max(1, Math.floor(completedGuides.length / 0.5)); // Simulated: ~0.5 guides/day
    return {
        guidesPerDay: (completedGuides.length / Math.max(1, days)).toFixed(2),
        guidesPerWeek: (completedGuides.length * 7 / Math.max(1, days)).toFixed(1),
        estimatedCompletionDays: Math.ceil(days),
    };
}

function calculateCurrentStreak(completedGuides) {
    // Simulated streak - in production would track actual daily activity
    return Math.min(completedGuides.length, 7); // Max 7-day streak for simulated data
}

function calculateMaxStreak(completedGuides) {
    // Simulated max streak
    return Math.ceil(completedGuides.length / 2); // Simulated historical max
}

function calculateBranchAnalytics(enrichedRoots, allGuides) {
    const branchData = {};

    enrichedRoots.forEach((root) => {
        const branchGuides = allGuides.filter((g) => g.lineage?.[0]?.id === root.id);
        const completed = branchGuides.filter((g) => g.completed).length;
        const problems = branchGuides.reduce((sum, g) => sum + (g.totalCount || 0), 0);
        const solved = branchGuides.reduce((sum, g) => sum + g.solvedCount, 0);

        branchData[root.id] = {
            name: root.label,
            totalGuides: branchGuides.length,
            completedGuides: completed,
            completionRate: branchGuides.length > 0 ? Math.round((completed / branchGuides.length) * 100) : 0,
            totalProblems: problems,
            solvedProblems: solved,
            problemCompletionRate: problems > 0 ? Math.round((solved / problems) * 100) : 0,
        };
    });

    return Object.entries(branchData).map(([, data]) => data);
}

function calculateTimeEstimates(completedGuides, inProgressGuides, totalSolved, totalProblems) {
    const remainingProblems = totalProblems - totalSolved;
    const avgTimePerProblem = totalSolved > 0 ? (24 / Math.max(1, totalSolved)) : 0.5; // Hours per problem

    return {
        hoursToComplete: Math.round(remainingProblems * avgTimePerProblem),
        daysToComplete: Math.round((remainingProblems * avgTimePerProblem) / 2), // Assuming 2 hrs/day
        estimatedCompletionDate: calculateCompletionDate(
            Math.round((remainingProblems * avgTimePerProblem) / 2)
        ),
    };
}

function calculateCompletionDate(daysRemaining) {
    const today = new Date();
    const completionDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    return completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
