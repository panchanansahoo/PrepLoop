// ─── Company Question Bank Service ───
// Provides access to company interview questions for the AI interview system.
// Data loading is lazy so backend startup does not depend on frontend-only files.

import crypto from 'crypto';

// In-memory cache for the question bank
let questionCache = null;
let companiesList = null;

/**
 * Try to resolve question data from known locations.
 * Returns null if source files are unavailable in this runtime.
 */
async function resolveQuestionModule() {
    const candidatesMeta = [
        '../../frontend/src/data/companyPrepMeta.js',
        '../data/companyPrepMeta.js',
    ];
    const candidatesQs = [
        '../../frontend/src/data/companyQuestions.js',
        '../data/companyQuestions.js',
    ];

    let metaMod = null;
    let qsMod = null;

    for (const candidate of candidatesMeta) {
        try { metaMod = await import(candidate); break; } catch (_) {}
    }
    for (const candidate of candidatesQs) {
        try { qsMod = await import(candidate); break; } catch (_) {}
    }

    if (metaMod || qsMod) return { metaMod, qsMod };
    return null;
}

/**
 * Load question data from the frontend data file.
 * Data is imported directly to avoid runtime code evaluation.
 */
async function loadQuestionData() {
    if (questionCache) return;

    const dataModules = await resolveQuestionModule();
    if (!dataModules || (!dataModules.metaMod && !dataModules.qsMod)) {
        console.warn('⚠️ Company question dataset not found in this runtime. Using empty fallback set.');
        questionCache = [];
        companiesList = [];
        return;
    }

    try {
        const rawQs = dataModules.qsMod?.companyQuestions || {};
        const flatQuestions = [];
        for (const [companyId, companyData] of Object.entries(rawQs)) {
            if (companyData && Array.isArray(companyData.questions)) {
                for (const q of companyData.questions) {
                    flatQuestions.push({
                        company: companyId,
                        ...q
                    });
                }
            }
        }
        questionCache = flatQuestions;
        companiesList = Array.isArray(dataModules.metaMod?.COMPANIES) ? dataModules.metaMod.COMPANIES : [];
        console.log(`✅ Company Question Bank loaded: ${questionCache.length} questions, ${companiesList.length} companies`);
    } catch (error) {
        console.error('Failed to parse company question data:', error.message);
        questionCache = [];
        companiesList = [];
    }
}

/**
 * Get filtered questions matching the given criteria
 * @param {string} company - Company ID (e.g., 'google', 'amazon')
 * @param {string} role - Role (e.g., 'SDE', 'Frontend')
 * @param {string} stage - Interview stage (e.g., 'Technical', 'HR')
 * @param {string} difficulty - Difficulty level (e.g., 'Easy', 'Medium', 'Hard')
 * @returns {Array} Filtered questions
 */
export async function getFilteredQuestions(company, role, stage, difficulty) {
    await loadQuestionData();

    const companyId = company?.toLowerCase().replace(/\s+/g, '_');

    let filtered = questionCache.filter(q => {
        // Company match (fuzzy — check if company ID contains or matches)
        const qCompany = q.company?.toLowerCase();
        if (companyId && qCompany && !qCompany.includes(companyId) && !companyId.includes(qCompany)) {
            return false;
        }
        return true;
    });

    // Apply stage filter if provided
    if (stage) {
        const stageFiltered = filtered.filter(q => {
            const qStage = q.stage?.toLowerCase();
            const targetStage = stage.toLowerCase();
            return qStage === targetStage || qStage?.includes(targetStage) || targetStage.includes(qStage);
        });
        if (stageFiltered.length > 0) filtered = stageFiltered;
    }

    // Apply role filter if provided (soft filter — don't over-restrict)
    if (role) {
        const roleFiltered = filtered.filter(q => {
            const qRole = q.role?.toLowerCase();
            const targetRole = role.toLowerCase();
            return qRole === targetRole || qRole?.includes(targetRole) || targetRole.includes(qRole);
        });
        if (roleFiltered.length >= 3) filtered = roleFiltered;
    }

    // Apply difficulty filter if provided (soft filter)
    if (difficulty) {
        const diffFiltered = filtered.filter(q => {
            return q.difficulty?.toLowerCase() === difficulty.toLowerCase();
        });
        if (diffFiltered.length >= 3) filtered = diffFiltered;
    }

    return filtered;
}

/**
 * Get a random set of questions for an interview session
 * @param {string} company - Company ID
 * @param {string} role - Role
 * @param {string} stage - Interview stage
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of questions to return
 * @returns {Array} Random question set
 */
export async function getRandomQuestionSet(company, role, stage, difficulty, count = 8) {
    const filtered = await getFilteredQuestions(company, role, stage, difficulty);

    if (filtered.length === 0) return [];

    // Fisher-Yates shuffle
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
}

/**
 * Get a single question by ID
 * @param {string} id - Question ID
 * @returns {Object|null} Question or null
 */
export async function getQuestionById(id) {
    await loadQuestionData();
    return questionCache.find(q => q.id === id) || null;
}

/**
 * Get available companies list
 * @returns {Array} Companies
 */
export async function getAvailableCompanies() {
    await loadQuestionData();
    return companiesList;
}

/**
 * Get question count for a company
 * @param {string} company - Company ID
 * @returns {number} Count
 */
export async function getQuestionCount(company) {
    await loadQuestionData();
    const companyId = company?.toLowerCase().replace(/\s+/g, '_');
    return questionCache.filter(q => q.company?.toLowerCase() === companyId).length;
}

export default {
    getFilteredQuestions,
    getRandomQuestionSet,
    getQuestionById,
    getAvailableCompanies,
    getQuestionCount,
};

// Backwards-compatible underscore-prefixed aliases
export const _getFilteredQuestions = getFilteredQuestions;
export const _getQuestionCount = getQuestionCount;
export const _getRandomQuestionSet = getRandomQuestionSet;
