import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing roadmap filtering, sorting, and dynamic calculations
 */
export default function useRoadmapFilters(
    enrichedRoots = [],
    guideProgressById = new Map(),
    totalProblems = 0,
    solvedProblems = 0,
) {
    const [selectedDifficulties, setSelectedDifficulties] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [sortBy, setSortBy] = useState('default');

    // Build a flat list of all guides with their metadata
    const allGuides = useMemo(() => {
        const guides = [];

        const traverse = (node) => {
            if (node.guide) {
                const progress = guideProgressById.get(node.guide.id) || {};
                guides.push({
                    ...node.guide,
                    ...progress,
                    depth: node.depth,
                    category: node.label,
                    rootId: node.id,
                });
            }
            if (node.children) {
                node.children.forEach(traverse);
            }
        };

        enrichedRoots.forEach(traverse);
        return guides;
    }, [enrichedRoots, guideProgressById]);

    // Apply filters to guides
    const filteredGuides = useMemo(() => {
        return allGuides.filter((guide) => {
            // Filter by difficulty
            if (selectedDifficulties.length > 0) {
                if (!selectedDifficulties.includes(guide.difficulty)) {
                    return false;
                }
            }

            // Filter by completion status
            if (selectedStatuses.length > 0) {
                let status;
                if (guide.isComplete) {
                    status = 'completed';
                } else if ((guide.solvedCount || 0) > 0) {
                    status = 'in-progress';
                } else {
                    status = 'not-started';
                }
                if (!selectedStatuses.includes(status)) {
                    return false;
                }
            }

            return true;
        });
    }, [allGuides, selectedDifficulties, selectedStatuses]);

    // Apply sorting to guides
    const sortedGuides = useMemo(() => {
        const sorted = [...filteredGuides];

        switch (sortBy) {
            case 'difficulty-asc':
                return sorted.sort((a, b) => {
                    const order = { Easy: 1, Medium: 2, Hard: 3 };
                    return (order[a.difficulty] || 0) - (order[b.difficulty] || 0);
                });

            case 'difficulty-desc':
                return sorted.sort((a, b) => {
                    const order = { Easy: 1, Medium: 2, Hard: 3 };
                    return (order[b.difficulty] || 0) - (order[a.difficulty] || 0);
                });

            case 'progress-desc':
                return sorted.sort((a, b) => {
                    const progressA = a.progressPercent || 0;
                    const progressB = b.progressPercent || 0;
                    return progressB - progressA;
                });

            case 'progress-asc':
                return sorted.sort((a, b) => {
                    const progressA = a.progressPercent || 0;
                    const progressB = b.progressPercent || 0;
                    return progressA - progressB;
                });

            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));

            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));

            case 'default':
            default:
                return sorted;
        }
    }, [filteredGuides, sortBy]);

    // Calculate statistics for filtered guides
    const filteredStats = useMemo(() => {
        const completed = sortedGuides.filter((g) => g.isComplete).length;
        const inProgress = sortedGuides.filter((g) => !g.isComplete && (g.solvedCount || 0) > 0).length;
        const notStarted = sortedGuides.filter((g) => !g.isComplete && (g.solvedCount || 0) === 0).length;

        const totalSolved = sortedGuides.reduce((sum, g) => sum + (g.solvedCount || 0), 0);
        const totalCount = sortedGuides.reduce((sum, g) => sum + (g.problemCount || 0), 0);
        const filteredProgress = totalCount > 0 ? Math.round((totalSolved / totalCount) * 100) : 0;

        // Difficulty distribution
        const difficulties = {
            Easy: sortedGuides.filter((g) => g.difficulty === 'Easy').length,
            Medium: sortedGuides.filter((g) => g.difficulty === 'Medium').length,
            Hard: sortedGuides.filter((g) => g.difficulty === 'Hard').length,
        };

        return {
            total: sortedGuides.length,
            completed,
            inProgress,
            notStarted,
            totalSolved,
            totalCount,
            filteredProgress,
            difficulties,
        };
    }, [sortedGuides]);

    // Helper to determine if filters are active
    const isFiltered = useMemo(() => {
        return selectedDifficulties.length > 0 || selectedStatuses.length > 0 || sortBy !== 'default';
    }, [selectedDifficulties, selectedStatuses, sortBy]);

    // Reset all filters
    const resetFilters = useCallback(() => {
        setSelectedDifficulties([]);
        setSelectedStatuses([]);
        setSortBy('default');
    }, []);

    return {
        // State
        selectedDifficulties,
        selectedStatuses,
        sortBy,
        isFiltered,

        // Data
        filteredGuides: sortedGuides,
        filteredStats,

        // Handlers
        setSelectedDifficulties,
        setSelectedStatuses,
        setSortBy,
        resetFilters,
    };
}
