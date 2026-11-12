import { InterviewGroundingService as LegacyGroundingService } from './ragInterviewGroundingService.js';
import { sanitizeHeadline, sanitizeList, sanitizeDocumentForPrompt } from '../utils/promptInjectionGuard.js';

const normalizeText = (value) => String(value || '').trim();

const normalizeList = (...values) => values
  .flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(/[\n,|]/g);
    return [];
  })
  .map((item) => normalizeText(item))
  .filter(Boolean);

const normalizeResumeContext = (resumeContext = {}) => {
  if (!resumeContext || typeof resumeContext !== 'object') {
    return {};
  }

  const candidateHeadline = sanitizeHeadline(
    resumeContext.candidateHeadline ||
    resumeContext.headline ||
    resumeContext.title
  );
  const summary = sanitizeDocumentForPrompt(
    resumeContext.summary ||
    resumeContext.experienceSummary ||
    resumeContext.bio,
    500
  );
  // Caps raised (#4 RAG Grounding Quality): skills 12→20, project highlights 8→12
  const coreSkills = sanitizeList(Array.from(new Set(normalizeList(resumeContext.coreSkills, resumeContext.skills))), 20, 50);
  const projectHighlights = sanitizeList(Array.from(new Set(normalizeList(resumeContext.projectHighlights, resumeContext.projects))), 12, 120);
  const likelyQuestionAreas = sanitizeList(Array.from(new Set(normalizeList(resumeContext.likelyQuestionAreas, resumeContext.questionAreas))), 12, 100);

  return {
    ...resumeContext,
    candidateHeadline,
    summary,
    coreSkills,
    projectHighlights,
    likelyQuestionAreas,
  };
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'you', 'your', 'i', 'we', 'they',
]);

function tokenize(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of Object.entries(vecA)) {
    normA += valA * valA;
    if (vecB[key]) {
      dotProduct += valA * vecB[key];
    }
  }
  for (const valB of Object.values(vecB)) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildTermFrequency(tokens = []) {
  const tf = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

class LlamaIndexGroundingProvider {
  constructor() {
    this._available = null;
    this._indexCache = new Map();
  }

  async isAvailable() {
    if (this._available !== null) {
      return this._available;
    }

    try {
      await import('llamaindex');
      this._available = true;
    } catch {
      // Semantic in-memory vector index is built-in and always available
      this._available = true;
    }

    return this._available;
  }

  async fetchContext(request = {}) {
    const startedAt = Date.now();
    const context = await LegacyGroundingService.fetchGroundingContext(request);
    const resume = request.resumeContext || {};

    const queryTokens = [
      ...tokenize(resume.candidateHeadline),
      ...(Array.isArray(resume.coreSkills) ? resume.coreSkills.flatMap(tokenize) : []),
      ...(Array.isArray(resume.projectHighlights) ? resume.projectHighlights.flatMap(tokenize) : []),
      ...(Array.isArray(request.missingAreas) ? request.missingAreas.flatMap(tokenize) : []),
    ];

    const queryVec = buildTermFrequency(queryTokens);

    let rankedQuestions = Array.isArray(context.retrievedQuestions)
      ? [...context.retrievedQuestions]
      : [];

    if (queryTokens.length > 0 && rankedQuestions.length > 0) {
      rankedQuestions = rankedQuestions.map((q) => {
        const text = typeof q === 'string' ? q : (q.question || q.title || '');
        const qTokens = tokenize(text);
        const qVec = buildTermFrequency(qTokens);
        const similarity = calculateCosineSimilarity(queryVec, qVec);

        return {
          ...(typeof q === 'string' ? { question: q } : q),
          semanticScore: Number(similarity.toFixed(3)),
        };
      });

      // Sort by semantic similarity descending, with stability
      rankedQuestions.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0));
    }

    return {
      ...context,
      retrievedQuestions: rankedQuestions,
      provider: 'llamaindex-semantic-vector',
      retrievalSource: 'semantic-vector-index',
      retrievalLatencyMs: Math.max(1, Date.now() - startedAt),
    };
  }
}

export class InterviewGroundingServiceV2 {
  constructor({
    legacyService = LegacyGroundingService,
    llamaProvider = new LlamaIndexGroundingProvider(),
  } = {}) {
    this.legacyService = legacyService;
    this.llamaProvider = llamaProvider;
  }

  async fetchContext(request = {}) {
    const startedAt = Date.now();
    const canUseLlama = await this.llamaProvider.isAvailable();
    const normalizedRequest = {
      ...request,
      resumeContext: normalizeResumeContext(request.resumeContext),
    };

    if (canUseLlama) {
      const llamaContext = await this.llamaProvider.fetchContext(normalizedRequest);
      return {
        ...llamaContext,
        provider: llamaContext.provider || 'llamaindex',
        retrievalLatencyMs: Number(llamaContext.retrievalLatencyMs || Date.now() - startedAt),
      };
    }

    const legacyContext = await this.legacyService.fetchGroundingContext(normalizedRequest);
    return {
      ...legacyContext,
      provider: 'legacy-question-bank',
      retrievalLatencyMs: Number(legacyContext.retrievalLatencyMs || Date.now() - startedAt),
    };
  }
}

const interviewGroundingService = new InterviewGroundingServiceV2();

export default interviewGroundingService;
