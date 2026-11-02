// ─── Company Question Bank Service (TypeScript) ───
// Provides access to company interview questions for the AI interview system.
// Data loading is lazy so backend startup does not depend on frontend-only files.

import crypto from 'crypto';
import { getRedisClient } from '../config/redis.js';

export interface CompanyQuestion {
  id: string;
  company: string;
  question: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  stage?: 'Technical' | 'HR' | 'System Design' | string;
  role?: string;
  category?: string;
  rubric?: Record<string, any>;
  [key: string]: any;
}

export interface CompanyMeta {
  id: string;
  name: string;
  industry?: string;
  logo?: string;
}

// In-memory cache for the question bank
let questionCache: CompanyQuestion[] | null = null;
let companiesList: CompanyMeta[] | null = null;

/**
 * Try to resolve question data from known locations.
 * Returns null if source files are unavailable in this runtime.
 */
async function resolveQuestionModule(): Promise<{ metaMod: any; qsMod: any } | null> {
  const candidatesMeta = [
    '../../frontend/src/data/companyPrepMeta.js',
    '../data/companyPrepMeta.js',
  ];
  const candidatesQs = [
    '../../frontend/src/data/companyQuestions.js',
    '../data/companyQuestions.js',
  ];

  let metaMod: any = null;
  let qsMod: any = null;

  for (const candidate of candidatesMeta) {
    try {
      metaMod = await import(candidate);
      break;
    } catch (_) {}
  }
  for (const candidate of candidatesQs) {
    try {
      qsMod = await import(candidate);
      break;
    } catch (_) {}
  }

  if (metaMod || qsMod) return { metaMod, qsMod };
  return null;
}

/**
 * Load question data from the frontend data file.
 * Data is imported directly to avoid runtime code evaluation.
 */
async function loadQuestionData(): Promise<void> {
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
    const flatQuestions: CompanyQuestion[] = [];
    for (const [companyId, companyData] of Object.entries(rawQs as Record<string, any>)) {
      if (companyData && Array.isArray(companyData.questions)) {
        for (const q of companyData.questions) {
          flatQuestions.push({
            company: companyId,
            ...q,
          });
        }
      }
    }
    questionCache = flatQuestions;
    companiesList = Array.isArray(dataModules.metaMod?.COMPANIES) ? dataModules.metaMod.COMPANIES : [];
    console.log(`✅ Company Question Bank loaded: ${questionCache.length} questions, ${companiesList?.length || 0} companies`);
  } catch (error: any) {
    console.error('Failed to parse company question data:', error.message);
    questionCache = [];
    companiesList = [];
  }
}

/**
 * Get filtered questions matching the given criteria
 */
export async function getFilteredQuestions(
  company?: string,
  role?: string,
  stage?: string,
  difficulty?: string
): Promise<CompanyQuestion[]> {
  const cacheKey = `company_questions:${(company || 'all').toLowerCase()}:${(role || 'all').toLowerCase()}:${(stage || 'all').toLowerCase()}:${(difficulty || 'all').toLowerCase()}`;
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
  }
  await loadQuestionData();

  const companyId = company?.toLowerCase().replace(/\s+/g, '_');

  let filtered = (questionCache || []).filter((q) => {
    const qCompany = q.company?.toLowerCase();
    if (companyId && qCompany && !qCompany.includes(companyId) && !companyId.includes(qCompany)) {
      return false;
    }
    return true;
  });

  if (stage) {
    const stageFiltered = filtered.filter((q) => {
      const qStage = q.stage?.toLowerCase();
      const targetStage = stage.toLowerCase();
      return qStage === targetStage || qStage?.includes(targetStage) || targetStage.includes(qStage || '');
    });
    if (stageFiltered.length > 0) filtered = stageFiltered;
  }

  if (role) {
    const roleFiltered = filtered.filter((q) => {
      const qRole = q.role?.toLowerCase();
      const targetRole = role.toLowerCase();
      return qRole === targetRole || qRole?.includes(targetRole) || targetRole.includes(qRole || '');
    });
    if (roleFiltered.length >= 3) filtered = roleFiltered;
  }

  if (difficulty) {
    const diffFiltered = filtered.filter((q) => {
      return q.difficulty?.toLowerCase() === difficulty.toLowerCase();
    });
    if (diffFiltered.length >= 3) filtered = diffFiltered;
  }

  if (redis && filtered && filtered.length > 0) {
    try {
      await redis.set(cacheKey, JSON.stringify(filtered), { EX: 3600 });
    } catch (_) {}
  }
  return filtered;
}

/**
 * Get a random set of questions for an interview session
 */
export async function getRandomQuestionSet(
  company?: string,
  role?: string,
  stage?: string,
  difficulty?: string,
  count = 8
): Promise<CompanyQuestion[]> {
  const filtered = await getFilteredQuestions(company, role, stage, difficulty);

  if (filtered.length === 0) return [];

  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(id: string): Promise<CompanyQuestion | null> {
  await loadQuestionData();
  return (questionCache || []).find((q) => q.id === id) || null;
}

/**
 * Get available companies list
 */
export async function getAvailableCompanies(): Promise<CompanyMeta[] | null> {
  await loadQuestionData();
  return companiesList;
}

/**
 * Get question count for a company
 */
export async function getQuestionCount(company: string): Promise<number> {
  await loadQuestionData();
  const companyId = company?.toLowerCase().replace(/\s+/g, '_');
  return (questionCache || []).filter((q) => q.company?.toLowerCase() === companyId).length;
}

export default {
  getFilteredQuestions,
  getRandomQuestionSet,
  getQuestionById,
  getAvailableCompanies,
  getQuestionCount,
};

export const _getFilteredQuestions = getFilteredQuestions;
export const _getQuestionCount = getQuestionCount;
export const _getRandomQuestionSet = getRandomQuestionSet;

