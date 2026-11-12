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

// In-memory cache for the question bank
let questionCache: CompanyQuestion[] | null = null;
let companiesList: CompanyMeta[] | null = null;

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


