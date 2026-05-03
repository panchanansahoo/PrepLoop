/**
 * Voice Provider Optimizer
 * Intelligently selects and routes to best-performing TTS/STT providers.
 * 
 * Optimizes based on:
 * - Circuit breaker state (availability)
 * - Success rate (reliability)
 * - Latency percentiles (performance)
 * - Cost/resource trade-offs
 */

import VoiceProviderCircuitBreaker from './voiceProviderCircuitBreaker.js';

// ─── Provider Profiles ───────────────────────────────────────────────

const PROVIDER_PROFILES = {
  kokoro: {
    name: 'Kokoro',
    type: 'tts',
    local: true,
    quality: 'high',
    cost: 'free',
    latencyP50Ms: 50,
    latencyP95Ms: 200,
    startupMs: 3000, // Lazy load
    priority: 1,
  },
  groq: {
    name: 'Groq',
    type: 'tts-stt',
    local: false,
    quality: 'high',
    cost: 'low',
    latencyP50Ms: 300,
    latencyP95Ms: 1000,
    startupMs: 0,
    priority: 2,
  },
  'edge-tts': {
    name: 'Microsoft Edge TTS',
    type: 'tts',
    local: false,
    quality: 'medium-high',
    cost: 'free',
    latencyP50Ms: 500,
    latencyP95Ms: 2000,
    startupMs: 0,
    priority: 3,
  },
  'web-speech': {
    name: 'Web Speech API',
    type: 'stt',
    local: true,
    quality: 'medium',
    cost: 'free',
    latencyP50Ms: 1000,
    latencyP95Ms: 5000,
    startupMs: 0,
    priority: 4,
  },
};

const DEFAULT_PROVIDER_CONFIG = {
  // Provider evaluation weights (must sum to 1.0)
  weightAvailability: 0.4,   // Is provider available (not OPEN)?
  weightReliability: 0.3,    // Success rate
  weightLatency: 0.2,        // Response time
  weightCost: 0.1,           // Resource efficiency

  // Timeout & retry settings
  requestTimeoutMs: 5000,
  maxRetries: 2,
  
  // Fallback chain
  fallbackChain: ['kokoro', 'groq', 'edge-tts', 'web-speech'],
};

// ─── Provider Optimizer ──────────────────────────────────────────────

export class VoiceProviderOptimizer {
  constructor(config = {}, circuitBreaker = null) {
    this.config = { ...DEFAULT_PROVIDER_CONFIG, ...config };
    this.breaker = circuitBreaker || new VoiceProviderCircuitBreaker();
    this.recentSelections = []; // Track provider selection for telemetry
  }

  /**
   * Select best provider for TTS given available options
   *
   * @param {array} availableProviders - List of provider IDs available
   * @param {string} preferredProvider - Preferred provider if available
   * @param {object} context - { type: 'tts'|'stt', quality: 'high'|'medium'|'low' }
   * @returns {object} { providerId, reason, fallbackAttempts }
   */
  selectBestProvider(availableProviders = [], preferredProvider = null, context = {}) {
    const now = Date.now();
    const selection = {
      timestamp: now,
      context: context || {},
      candidatesEvaluated: [],
      selectedProvider: null,
      selectedReason: '',
      alternativeProviders: [],
    };

    // If preferred provider is available and healthy, use it
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      const health = this.breaker.getHealth(preferredProvider);
      if (health !== 'failing') {
        selection.selectedProvider = preferredProvider;
        selection.selectedReason = 'User preference (healthy)';
        this.recentSelections.push(selection);
        return selection;
      }
    }

    // Score all available providers
    const scored = availableProviders
      .map(providerId => ({
        providerId,
        score: this._scoreProvider(providerId, context),
        metrics: this.breaker.getMetrics(providerId),
      }))
      .sort((a, b) => b.score - a.score);

    selection.candidatesEvaluated = scored.map(s => ({
      providerId: s.providerId,
      score: s.score,
      health: s.metrics.health,
      successRate: s.metrics.successRate,
      avgLatency: s.metrics.averageLatencyMs,
    }));

    // Check if any provider is available (not OPEN)
    const availableScored = scored.filter(s => s.metrics.health !== 'failing');

    if (availableScored.length > 0) {
      // Select best available provider
      const selected = availableScored[0];
      selection.selectedProvider = selected.providerId;
      selection.selectedReason = this._getSelectionReason(selected, context);
      selection.alternativeProviders = availableScored
        .slice(1, 3)
        .map(s => s.providerId);
    } else if (scored.length > 0) {
      // All OPEN, use fallback
      selection.selectedProvider = this._selectFromFallback(context);
      selection.selectedReason = 'Fallback chain (all primary providers unavailable)';
    } else {
      // No providers available
      selection.selectedProvider = this._selectFromFallback(context);
      selection.selectedReason = 'Fallback chain (no providers available)';
    }

    this.recentSelections.push(selection);
    return selection;
  }

  /**
   * Get recommended provider sequence for request attempts
   *
   * @param {object} context - { type, quality, userPreference }
   * @returns {array} List of provider IDs in order of preference
   */
  getProviderSequence(context = {}) {
    const available = this.breaker.getAvailableProviders();

    if (available.length === 0) {
      // All in OPEN state, return fallback for retry window
      return this.config.fallbackChain;
    }

    // Score and sort available providers
    const scored = available
      .map(providerId => ({
        providerId,
        score: this._scoreProvider(providerId, context),
      }))
      .sort((a, b) => b.score - a.score);

    return scored.map(s => s.providerId);
  }

  /**
   * Record request outcome and update provider metrics
   *
   * @param {string} providerId - Provider that handled request
   * @param {boolean} success - Whether request succeeded
   * @param {number} latencyMs - Request latency
   * @param {string} error - Error message if failed
   */
  recordOutcome(providerId, success, latencyMs = 0, error = null) {
    if (success) {
      this.breaker.recordSuccess(providerId, latencyMs);
    } else {
      this.breaker.recordFailure(providerId, error || 'Unknown error', latencyMs);
    }
  }

  /**
   * Get optimization telemetry
   */
  getTelemetry() {
    const healthSummary = this.breaker.getHealthSummary();
    const recentSelections = this.recentSelections.slice(-100); // Last 100

    // Calculate selection distribution
    const selectionCounts = {};
    for (const sel of recentSelections) {
      selectionCounts[sel.selectedProvider] = (selectionCounts[sel.selectedProvider] || 0) + 1;
    }

    // Calculate latency percentiles across all providers
    const allMetrics = this.breaker.getAllMetrics();
    const providerStats = {};
    for (const m of allMetrics) {
      providerStats[m.providerId] = {
        health: m.health,
        successRate: m.successRate,
        avgLatency: m.averageLatencyMs,
        totalAttempts: m.totalAttempts,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      healthSummary,
      selectionDistribution: selectionCounts,
      providerStats,
      recentSelectionCount: recentSelections.length,
      averageSelectionScore: this._calculateAverageScore(recentSelections),
    };
  }

  /**
   * Reset provider (for manual recovery)
   */
  resetProvider(providerId) {
    this.breaker.resetProvider(providerId);
  }

  /**
   * Reset all providers
   */
  resetAll() {
    this.breaker.resetAll();
  }

  // ─── Private Helpers ────────────────────────────────────────────

  _scoreProvider(providerId, context = {}) {
    const metrics = this.breaker.getMetrics(providerId);
    const profile = PROVIDER_PROFILES[providerId] || {};

    // Availability score: 0 if OPEN, 0.5 if degraded, 1.0 if healthy
    let availabilityScore = 0;
    if (metrics.health === 'healthy') availabilityScore = 1.0;
    else if (metrics.health === 'degraded') availabilityScore = 0.5;
    else if (metrics.health === 'unknown') availabilityScore = 0.7; // Give benefit of doubt
    // else failing = 0

    // Reliability score: success rate (0-1)
    // If no attempts yet, use higher default to encourage trying fresh providers
    const reliabilityScore = metrics.totalAttempts === 0 ? 0.9 : metrics.successRate;

    // Latency score: higher is better (inverse of latency)
    // Use expected latency from provider profile for normalization
    const expectedLatency = profile.latencyP95Ms || 1000;
    let actualLatency = metrics.averageLatencyMs;
    
    // If no attempts, assume expected latency
    if (metrics.totalAttempts === 0) actualLatency = profile.latencyP50Ms || (expectedLatency * 0.5);
    
    const latencyScore = Math.max(0, Math.min(1.0, expectedLatency / (actualLatency + 1)));

    // Quality/Cost score based on context
    let qualityScore = 0.7; // Default
    if (context.quality === 'high' && profile.quality === 'high') qualityScore = 1.0;
    else if (context.quality === 'medium' && profile.quality.includes('high')) qualityScore = 0.9;
    else if (context.quality === 'low') qualityScore = 0.8;

    // Weighted score
    const score =
      availabilityScore * this.config.weightAvailability +
      reliabilityScore * this.config.weightReliability +
      latencyScore * this.config.weightLatency +
      qualityScore * this.config.weightCost;

    return score;
  }

  _getSelectionReason(selected, context) {
    if (selected.metrics.health === 'healthy') {
      return `Healthy provider with score ${selected.score.toFixed(2)}`;
    }
    if (selected.metrics.health === 'degraded') {
      return `Degraded but available with score ${selected.score.toFixed(2)}`;
    }
    return `Selected with score ${selected.score.toFixed(2)}`;
  }

  _selectFromFallback(context = {}) {
    // Try fallback chain, skip providers that are OPEN
    for (const providerId of this.config.fallbackChain) {
      if (this.breaker.canAttempt(providerId)) {
        return providerId;
      }
    }

    // If all OPEN, return first in chain (will fail but can retry)
    return this.config.fallbackChain[0];
  }

  _calculateAverageScore(selections) {
    if (selections.length === 0) return 0;

    let totalScore = 0;
    for (const sel of selections) {
      const candidates = sel.candidatesEvaluated;
      if (candidates.length > 0) {
        const topScore = candidates[0].score;
        totalScore += topScore;
      }
    }

    return (totalScore / selections.length).toFixed(2);
  }
}

export default VoiceProviderOptimizer;
