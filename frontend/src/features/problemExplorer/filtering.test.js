import { describe, it, expect } from 'vitest';
import { filterAndSortProblems } from './filtering';

const PATTERNS = [
    { id: 'two-pointers', name: 'Two Pointers' },
    { id: 'dp', name: 'Dynamic Programming' },
];

const STUDY_PLANS = [
    { id: 'easy-only', filter: (problem) => problem.difficulty === 'Easy' },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const PROBLEMS = [
    {
        id: 1,
        title: 'Two Sum',
        topics: ['Arrays', 'Hashing'],
        patterns: ['two-pointers'],
        difficulty: 'Easy',
        companies: ['Google'],
        frequency: 'high',
        timeEstimate: 15,
        acceptance: 50,
    },
    {
        id: 2,
        title: 'Word Break',
        topics: ['Dynamic Programming', 'Strings'],
        patterns: ['dp'],
        difficulty: 'Medium',
        companies: ['Amazon'],
        frequency: 'medium',
        timeEstimate: 30,
        acceptance: 42,
    },
    {
        id: 3,
        title: 'Hard Graph Problem',
        topics: ['Graphs'],
        patterns: [],
        difficulty: 'Hard',
        companies: ['Meta'],
        frequency: 'low',
        timeEstimate: 50,
        acceptance: 20,
    },
];

function buildFilters(overrides = {}) {
    return {
        showBookmarksOnly: false,
        hideSolved: false,
        activePlan: null,
        search: '',
        selectedDifficulties: [],
        selectedTopics: [],
        selectedCompanies: [],
        selectedPatterns: [],
        selectedFrequency: '',
        maxTime: '',
        sortBy: 'id',
        sortDir: 'asc',
        ...overrides,
    };
}

describe('filterAndSortProblems', () => {
    it('applies search over title, topics, and pattern names', () => {
        const result = filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks: new Set(),
            solvedSet: new Set(),
            filters: buildFilters({ search: 'dynamic' }),
        });

        expect(result.map((item) => item.id)).toEqual([2]);
    });

    it('applies bookmark and solved toggles together', () => {
        const result = filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks: new Set([1, 2]),
            solvedSet: new Set([1]),
            filters: buildFilters({ showBookmarksOnly: true, hideSolved: true }),
        });

        expect(result.map((item) => item.id)).toEqual([2]);
    });

    it('applies active plan and max time filters', () => {
        const result = filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks: new Set(),
            solvedSet: new Set(),
            filters: buildFilters({ activePlan: 'easy-only', maxTime: '20' }),
        });

        expect(result.map((item) => item.id)).toEqual([1]);
    });

    it('sorts by difficulty order using provided difficulty ranking', () => {
        const result = filterAndSortProblems({
            problems: PROBLEMS,
            patternsCatalog: PATTERNS,
            studyPlans: STUDY_PLANS,
            difficulties: DIFFICULTIES,
            bookmarks: new Set(),
            solvedSet: new Set(),
            filters: buildFilters({ sortBy: 'difficulty', sortDir: 'desc' }),
        });

        expect(result.map((item) => item.id)).toEqual([3, 2, 1]);
    });
});
