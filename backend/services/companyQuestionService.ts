// ─── Company Question Bank Service (TypeScript) ───
// Provides access to company interview questions for the AI interview system.
// Data loading is lazy so backend startup does not depend on frontend-only files.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getRedisClient } from '../config/redis.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export interface PaginationOptions {
  company?: string;
  role?: string;
  stage?: string;
  difficulty?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedResult<T> {
  success: boolean;
  questions: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory cache for the question bank
let questionCache: CompanyQuestion[] | null = null;
let companiesList: CompanyMeta[] | null = null;

// Query cache for paginated requests
const queryResultCache = new Map<string, { result: PaginatedResult<CompanyQuestion>; timestamp: number }>();
const QUERY_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_QUERY_CACHE_SIZE = 500;

const EMBEDDED_DEFAULT_COMPANIES: CompanyMeta[] = [
  { id: 'google', name: 'Google', industry: 'Technology' },
  { id: 'amazon', name: 'Amazon', industry: 'E-commerce & Cloud' },
  { id: 'meta', name: 'Meta', industry: 'Social Technology' },
  { id: 'microsoft', name: 'Microsoft', industry: 'Cloud & Software' },
];

const EMBEDDED_DEFAULT_QUESTIONS: CompanyQuestion[] = [
  {
    id: 'g-1',
    company: 'google',
    question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    title: 'Two Sum & Window Target',
    role: 'Software Engineer',
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    stage: 'Technical',
  },
  {
    id: 'g-2',
    company: 'google',
    question: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) time complexity.',
    title: 'LRU Cache Design',
    role: 'Software Engineer',
    difficulty: 'medium',
    category: 'Design & Linked Lists',
    stage: 'Technical',
  },
  {
    id: 'a-1',
    company: 'amazon',
    question: 'Tell me about a time when you had to make a decision without all the data you needed. How did you handle customer impact?',
    title: 'Customer Obsession Conflict Resolution',
    role: 'Software Development Engineer',
    difficulty: 'medium',
    category: 'Leadership Principles',
    stage: 'HR',
  },
  {
    id: 'a-2',
    company: 'amazon',
    question: 'Given an integer array nums and an integer k, return the k most frequent elements in an incoming streaming pipeline.',
    title: 'Top K Frequent Elements in Stream',
    role: 'Software Development Engineer',
    difficulty: 'medium',
    category: 'Heap & Queue',
    stage: 'Technical',
  },
  {
    id: 'm-1',
    company: 'meta',
    question: 'Given the root of a binary tree, calculate the vertical order traversal of the binary tree nodes values.',
    title: 'Binary Tree Vertical Order Traversal',
    role: 'Software Engineer',
    difficulty: 'medium',
    category: 'Trees & BFS',
    stage: 'Technical',
  },
  {
    id: 'ms-1',
    company: 'microsoft',
    question: 'Design a globally distributed key-value store with eventual consistency, active replication, and partition tolerance.',
    title: 'Design distributed key-value store with replication',
    role: 'Software Engineer',
    difficulty: 'hard',
    category: 'System Design',
    stage: 'System Design',
  },
];

/**
 * Try to resolve question data from known locations.
 * Returns null if source files are unavailable in this runtime.
 */
async function resolveQuestionModule(): Promise<{ metaMod: any; qsMod: any } | null> {
  const candidatesMeta = [
    path.resolve(__dirname, '../../frontend/src/data/companyPrepMeta.js'),
    path.resolve(__dirname, '../data/companyPrepMeta.js'),
  ];
  const candidatesQs = [
    path.resolve(__dirname, '../../frontend/src/data/companyQuestions.js'),
    path.resolve(__dirname, '../data/companyQuestions.js'),
  ];

  let metaMod: any = null;
  let qsMod: any = null;

  for (const candidate of candidatesMeta) {
    try {
      if (fs.existsSync(candidate)) {
        metaMod = await import(/* @vite-ignore */ pathToFileURL(candidate).href);
        break;
      }
    } catch (_) {}
  }
  for (const candidate of candidatesQs) {
    try {
      if (fs.existsSync(candidate)) {
        qsMod = await import(/* @vite-ignore */ pathToFileURL(candidate).href);
        break;
      }
    } catch (_) {}
  }

  if (metaMod || qsMod) return { metaMod, qsMod };
  return null;
}

/**
 * Load question data from datasets or fallback modules.
 * In-memory questionCache acts as an in-process index after initial load.
 */
export async function loadQuestionData(): Promise<void> {
  if (questionCache && questionCache.length > 0) return;

  // 1. Try to load from structured JSON dataset
  const jsonCandidates = [
    path.resolve(__dirname, '../data/company-prep-questions.json'),
    path.resolve(__dirname, '../../frontend/public/company-prep-questions.json'),
    path.resolve(__dirname, '../../frontend/dist/company-prep-questions.json'),
  ];

  for (const candidate of jsonCandidates) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = await fs.promises.readFile(candidate, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questionCache = parsed;
          console.log(`✅ Company Question Bank loaded from ${path.basename(candidate)}: ${questionCache.length} questions`);
          break;
        }
      }
    } catch (err: any) {
      console.warn(`Failed reading candidate ${candidate}:`, err?.message);
    }
  }

  // 2. Resolve metadata module if available
  const dataModules = await resolveQuestionModule();
  if (dataModules?.metaMod?.COMPANIES && Array.isArray(dataModules.metaMod.COMPANIES)) {
    companiesList = dataModules.metaMod.COMPANIES;
  }

  // 3. Fallback to JS module questions if JSON was not found
  if (!questionCache || questionCache.length === 0) {
    if (dataModules?.qsMod?.companyQuestions) {
      try {
        const rawQs = dataModules.qsMod.companyQuestions || {};
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
        if (companiesList === null && Array.isArray(dataModules.metaMod?.COMPANIES)) {
          companiesList = dataModules.metaMod.COMPANIES;
        }
        console.log(`✅ Company Question Bank loaded from JS module: ${questionCache.length} questions`);
      } catch (error: any) {
        console.error('Failed to parse company question data from JS module:', error.message);
      }
    }
  }

  // 4. Fallback to embedded default questions if all file sources fail
  if (!questionCache || questionCache.length === 0) {
    console.warn('⚠️ Company question dataset not found in this runtime. Using embedded fallback dataset.');
    questionCache = [...EMBEDDED_DEFAULT_QUESTIONS];
    companiesList = [...EMBEDDED_DEFAULT_COMPANIES];
  } else if (!companiesList || companiesList.length === 0) {
    // Generate company metadata from indexed questions
    const companyIds = Array.from(new Set(questionCache.map((q) => q.company).filter(Boolean)));
    companiesList = companyIds.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
    }));
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
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
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

/**
 * Get aggregated counts per company for fast metadata summaries
 */
export async function getCompanyStats(): Promise<Record<string, { total: number }>> {
  await loadQuestionData();
  const stats: Record<string, { total: number }> = {};
  for (const q of questionCache || []) {
    if (q.company) {
      const c = q.company.toLowerCase();
      if (!stats[c]) stats[c] = { total: 0 };
      stats[c].total += 1;
    }
  }
  return stats;
}

/**
 * Paginated and searchable question retriever with caching.
 * Supports query params: company, role, stage, difficulty, search, page (default 1), limit (default 20, max 100)
 */
export async function getPaginatedQuestions(
  options: PaginationOptions = {}
): Promise<PaginatedResult<CompanyQuestion>> {
  const page = Math.max(1, Math.floor(Number(options.page) || 1));
  const rawLimit = Math.floor(Number(options.limit) || 20);
  const limit = Math.min(100, Math.max(1, rawLimit));

  const company = typeof options.company === 'string' ? options.company.trim().toLowerCase() : '';
  const role = typeof options.role === 'string' ? options.role.trim().toLowerCase() : '';
  const stage = typeof options.stage === 'string' ? options.stage.trim().toLowerCase() : '';
  const difficulty = typeof options.difficulty === 'string' ? options.difficulty.trim().toLowerCase() : '';
  const search = typeof options.search === 'string' ? options.search.trim().toLowerCase() : '';

  const cacheKey = `company_paged:${company}:${role}:${stage}:${difficulty}:${search}:${page}:${limit}`;

  // 1. Check Redis cache if available
  const redis = getRedisClient();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
    } catch (_) {}
  }

  // 2. Check in-memory query cache
  const inMemoryCached = queryResultCache.get(cacheKey);
  if (inMemoryCached && Date.now() - inMemoryCached.timestamp < QUERY_CACHE_TTL_MS) {
    return inMemoryCached.result;
  }

  // 3. Ensure dataset is loaded and indexed
  await loadQuestionData();
  const allQuestions = questionCache || [];

  // 4. Apply filtering
  let filtered = allQuestions;

  if (company && company !== 'all') {
    const companies = company.split(',').map((c) => c.trim().replace(/\s+/g, '_')).filter(Boolean);
    filtered = filtered.filter((q) => {
      const qCompany = (q.company || '').toLowerCase();
      return companies.some((c) => qCompany === c || qCompany.includes(c) || c.includes(qCompany));
    });
  }

  if (stage && stage !== 'all') {
    filtered = filtered.filter((q) => {
      const qStage = (q.stage || '').toLowerCase();
      return qStage === stage || qStage.includes(stage) || stage.includes(qStage);
    });
  }

  if (role && role !== 'all') {
    filtered = filtered.filter((q) => {
      const qRole = (q.role || '').toLowerCase();
      return qRole === role || qRole.includes(role) || role.includes(qRole);
    });
  }

  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter((q) => {
      const qDiff = (q.difficulty || '').toLowerCase();
      return qDiff === difficulty;
    });
  }

  if (search) {
    filtered = filtered.filter((q) => {
      if (q.question && q.question.toLowerCase().includes(search)) return true;
      if (q.title && q.title.toLowerCase().includes(search)) return true;
      if (q.company && q.company.toLowerCase().includes(search)) return true;
      if (q.role && q.role.toLowerCase().includes(search)) return true;
      if (q.stage && q.stage.toLowerCase().includes(search)) return true;
      if (Array.isArray(q.tags)) {
        for (const tag of q.tags) {
          if (typeof tag === 'string' && tag.toLowerCase().includes(search)) return true;
        }
      }
      return false;
    });
  }

  const total = filtered.length;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const startIndex = (page - 1) * limit;
  const pageQuestions = startIndex < total ? filtered.slice(startIndex, startIndex + limit) : [];

  const result: PaginatedResult<CompanyQuestion> = {
    success: true,
    questions: pageQuestions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  // 5. Store in caches
  if (redis && total > 0) {
    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: 1800 });
    } catch (_) {}
  }

  if (queryResultCache.size >= MAX_QUERY_CACHE_SIZE) {
    const oldestKey = queryResultCache.keys().next().value;
    if (oldestKey) queryResultCache.delete(oldestKey);
  }
  queryResultCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

/**
 * Clear cached question and query data (useful for test resets)
 */
export function _clearQuestionCacheForTesting(): void {
  questionCache = null;
  companiesList = null;
  queryResultCache.clear();
}

export default {
  loadQuestionData,
  getFilteredQuestions,
  getRandomQuestionSet,
  getQuestionById,
  getAvailableCompanies,
  getQuestionCount,
  getCompanyStats,
  getPaginatedQuestions,
  _clearQuestionCacheForTesting,
};

export const _getFilteredQuestions = getFilteredQuestions;
export const _getQuestionCount = getQuestionCount;
export const _getRandomQuestionSet = getRandomQuestionSet;

// ─── F2-5: Company-Specific Interview Intelligence ───────────────────────────
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const recentSightings = new Map<string, string>(); // questionId -> ISO date

export type RoleTrack = 'SWE' | 'PM' | 'Data' | 'Design';

function inferRoleTrack(q: CompanyQuestion): RoleTrack {
  const hay = `${q.role || ''} ${q.category || ''} ${q.stage || ''} ${q.question || ''}`.toLowerCase();
  if (/(product manager|product sense|\bpm\b|roadmap|metrics|go-to-market)/.test(hay)) return 'PM';
  if (/(data scientist|data engineer|ml|machine learning|sql|analytics|statistics)/.test(hay)) return 'Data';
  if (/(system design|architecture|ux|ui|product design|scalability|distributed)/.test(hay)) return 'Design';
  return 'SWE';
}

export function isQuestionSeenRecently(q: CompanyQuestion, now = Date.now()): boolean {
  const overrideTs = recentSightings.get(q.id);
  const rawDate = overrideTs || q.lastReportedAt || q.reportedAt || q.lastSeenAt;
  if (rawDate) {
    const ms = new Date(rawDate).getTime();
    if (!Number.isNaN(ms) && now - ms <= NINETY_DAYS_MS) return true;
  }
  return Boolean(q.seenRecently || (typeof q.recencyDays === 'number' && q.recencyDays <= 90));
}

export function markQuestionSeenRecently(questionId: string): { questionId: string; lastReportedAt: string } {
  const lastReportedAt = new Date().toISOString();
  recentSightings.set(String(questionId), lastReportedAt);
  return { questionId: String(questionId), lastReportedAt };
}

export async function getCompanyIntelligence(company?: string, roleTrack?: RoleTrack | string) {
  await loadQuestionData();
  const companyId = company ? company.toLowerCase().replace(/\s+/g, '_') : '';

  const companyQuestions = (questionCache || []).filter((q) => {
    if (!companyId) return true;
    const qCompany = (q.company || '').toLowerCase();
    return qCompany.includes(companyId) || companyId.includes(qCompany);
  });

  const tracks: Record<RoleTrack, number> = { SWE: 0, PM: 0, Data: 0, Design: 0 };
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  let seenRecentlyCount = 0;

  const enriched = companyQuestions.map((q) => {
    const track = inferRoleTrack(q);
    tracks[track] = (tracks[track] || 0) + 1;

    const diff = String(q.difficulty || 'medium').toLowerCase();
    if (diff === 'easy') difficultyCounts.easy += 1;
    else if (diff === 'hard') difficultyCounts.hard += 1;
    else difficultyCounts.medium += 1;

    const seenRecently = isQuestionSeenRecently(q);
    if (seenRecently) seenRecentlyCount += 1;

    return {
      ...q,
      roleTrack: track,
      seenRecently,
    };
  });

  const filteredByTrack = roleTrack
    ? enriched.filter((q) => q.roleTrack.toLowerCase() === String(roleTrack).toLowerCase())
    : enriched;

  const total = companyQuestions.length || 1;
  return {
    company: company || 'all',
    totalQuestions: companyQuestions.length,
    seenRecentlyCount,
    roleTracks: (['SWE', 'PM', 'Data', 'Design'] as RoleTrack[]).map((track) => ({
      track,
      count: tracks[track],
    })),
    difficultyDistribution: {
      easy: { count: difficultyCounts.easy, percent: Math.round((difficultyCounts.easy / total) * 100) },
      medium: { count: difficultyCounts.medium, percent: Math.round((difficultyCounts.medium / total) * 100) },
      hard: { count: difficultyCounts.hard, percent: Math.round((difficultyCounts.hard / total) * 100) },
    },
    questions: filteredByTrack.slice(0, 50),
  };
}

export function buildDeterministicFollowUps(question: string, answer: string, company = 'this company'): string[] {
  const shortTopic = String(question || 'your solution').slice(0, 80);
  const mentionsScale = /(scale|latency|cache|redis|kafka|shard|throughput|million)/i.test(answer || '');
  return [
    `At ${company} scale, what bottleneck would appear first in "${shortTopic}" and how would you mitigate it?`,
    mentionsScale
      ? 'You mentioned scaling components — how would you handle a partial region outage or split-brain scenario?'
      : 'What time and space complexity trade-offs did you make, and could you optimize the worst-case path?',
    'How would you instrument metrics, alerts, and automated tests to verify this in production?',
  ];
}


