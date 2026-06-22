import { InterviewGroundingService as LegacyGroundingService } from './ragInterviewGroundingService.js';

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

  const candidateHeadline = normalizeText(
    resumeContext.candidateHeadline ||
    resumeContext.headline ||
    resumeContext.title
  );
  const summary = normalizeText(
    resumeContext.summary ||
    resumeContext.experienceSummary ||
    resumeContext.bio
  );

  return {
    ...resumeContext,
    candidateHeadline,
    summary,
    coreSkills: Array.from(new Set(normalizeList(resumeContext.coreSkills, resumeContext.skills))).slice(0, 12),
    projectHighlights: Array.from(new Set(normalizeList(resumeContext.projectHighlights, resumeContext.projects))).slice(0, 8),
    likelyQuestionAreas: Array.from(new Set(normalizeList(resumeContext.likelyQuestionAreas, resumeContext.questionAreas))).slice(0, 8),
  };
};

class LlamaIndexGroundingProvider {
  constructor() {
    this._available = null;
  }

  async isAvailable() {
    if (this._available !== null) {
      return this._available;
    }

    try {
      await import('llamaindex');
      this._available = true;
    } catch {
      this._available = false;
    }

    return this._available;
  }

  async fetchContext(request = {}) {
    // Until a full LlamaIndex index pipeline is configured, delegate to legacy retrieval.
    const context = await LegacyGroundingService.fetchGroundingContext(request);
    return {
      ...context,
      provider: 'llamaindex-bridge',
      retrievalSource: 'llamaindex-adapter-with-legacy-fallback',
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
