import { InterviewGroundingService as LegacyGroundingService } from './ragInterviewGroundingService.js';

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

    if (canUseLlama) {
      const llamaContext = await this.llamaProvider.fetchContext(request);
      return {
        ...llamaContext,
        provider: llamaContext.provider || 'llamaindex',
        retrievalLatencyMs: Number(llamaContext.retrievalLatencyMs || Date.now() - startedAt),
      };
    }

    const legacyContext = await this.legacyService.fetchGroundingContext(request);
    return {
      ...legacyContext,
      provider: 'legacy-question-bank',
      retrievalLatencyMs: Number(legacyContext.retrievalLatencyMs || Date.now() - startedAt),
    };
  }
}

const interviewGroundingService = new InterviewGroundingServiceV2();

export default interviewGroundingService;
