export function filterAndSortProblems({
    problems,
    patternsCatalog,
    studyPlans,
    difficulties,
    bookmarks,
    solvedSet,
    filters,
}) {
    const {
        showBookmarksOnly,
        hideSolved,
        activePlan,
        search,
        selectedDifficulties,
        selectedTopics,
        selectedCompanies,
        selectedPatterns,
        selectedFrequency,
        maxTime,
        sortBy,
        sortDir,
    } = filters;

    const searchNeedle = String(search || '').trim().toLowerCase();
    const plan = activePlan ? studyPlans.find((item) => item.id === activePlan) : null;
    const maxTimeLimit = Number.parseInt(maxTime, 10);

    const filtered = problems.filter((problem) => {
        const problemPatterns = problem.patterns || [];

        if (showBookmarksOnly && !bookmarks.has(problem.id)) return false;
        if (hideSolved && solvedSet.has(problem.id)) return false;
        if (plan && !plan.filter(problem)) return false;

        if (searchNeedle) {
            const titleMatch = String(problem.title || '').toLowerCase().includes(searchNeedle);
            const topicMatch = (problem.topics || []).some((topic) =>
                String(topic).toLowerCase().includes(searchNeedle)
            );
            const patternMatch = problemPatterns.some((patternId) => {
                const pattern = patternsCatalog.find((item) => item.id === patternId);
                return pattern && String(pattern.name || '').toLowerCase().includes(searchNeedle);
            });

            if (!titleMatch && !topicMatch && !patternMatch) return false;
        }

        if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(problem.difficulty)) return false;
        if (selectedTopics.length > 0 && !(problem.topics || []).some((topic) => selectedTopics.includes(topic))) return false;
        if (selectedCompanies.length > 0 && !(problem.companies || []).some((company) => selectedCompanies.includes(company))) return false;
        if (selectedPatterns.length > 0 && !problemPatterns.some((pattern) => selectedPatterns.includes(pattern))) return false;
        if (selectedFrequency && problem.frequency !== selectedFrequency) return false;
        if (!Number.isNaN(maxTimeLimit) && problem.timeEstimate > maxTimeLimit) return false;

        return true;
    });

    const sorted = [...filtered].sort((left, right) => {
        let compare = 0;

        if (sortBy === 'title') compare = left.title.localeCompare(right.title);
        else if (sortBy === 'difficulty') compare = difficulties.indexOf(left.difficulty) - difficulties.indexOf(right.difficulty);
        else if (sortBy === 'acceptance') compare = left.acceptance - right.acceptance;
        else if (sortBy === 'time') compare = left.timeEstimate - right.timeEstimate;
        else compare = left.id - right.id;

        return sortDir === 'asc' ? compare : -compare;
    });

    return sorted;
}
