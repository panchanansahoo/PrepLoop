/**
 * Provider Stats Service — Track TTS provider performance with regional analysis
 * 
 * Collects metrics:
 *   • Per-provider success rate, latency, failure patterns
 *   • Regional performance (inferred from request headers)
 *   • Optimal provider selection for future requests
 * 
 * Usage:
 *   const stats = new ProviderStatsService();
 *   stats.recordSuccess('kokoro', 150, 'US-East');
 *   stats.recordFailure('groq', 'timeout');
 *   const provider = stats.getBestProvider('TTS', 'US-West');
 */

class ProviderStatsService {
  constructor() {
    // Regional stats: { [region]: { [provider]: { success, fail, avgLatency, ... } } }
    this.regionalStats = new Map();
    
    // Global stats (no regional breakdown)
    this.globalStats = {
      kokoro: { success: 0, fail: 0, avgLatency: 0, lastError: null },
      groq: { success: 0, fail: 0, avgLatency: 0, lastError: null },
      edge: { success: 0, fail: 0, avgLatency: 0, lastError: null },
      elevenlabs: { success: 0, fail: 0, avgLatency: 0, lastError: null },
      openai: { success: 0, fail: 0, avgLatency: 0, lastError: null },
    };
    
    // Cache for optimal provider selection (invalidated on stats update)
    this.optimalCache = new Map();
  }

  /**
   * Infer region from request headers or user info
   * Heuristic-based on IP geolocation, user timezone, or cloud region
   */
  inferRegion(ipAddress, userTimezone, cloudRegion) {
    // Simple heuristic: use cloud region if available, else timezone, else IP prefix
    if (cloudRegion) return cloudRegion;
    if (userTimezone) {
      // Rough mapping: timezones to regions
      const tzMap = {
        'America/': 'US',
        'Europe/': 'EU',
        'Asia/': 'APAC',
        'Australia/': 'APAC',
      };
      for (const [prefix, region] of Object.entries(tzMap)) {
        if (userTimezone.startsWith(prefix)) return region;
      }
    }
    if (ipAddress) {
      // Very rough: first octet of IP to region
      const firstOctet = parseInt(ipAddress.split('.')[0]);
      if (firstOctet < 50) return 'US-East';
      if (firstOctet < 100) return 'EU';
      if (firstOctet < 150) return 'APAC';
    }
    return 'UNKNOWN';
  }

  /**
   * Get or create stats bucket for region
   */
  getRegionalStats(region = 'UNKNOWN') {
    if (!this.regionalStats.has(region)) {
      this.regionalStats.set(region, {
        kokoro: { success: 0, fail: 0, avgLatency: 0, lastError: null },
        groq: { success: 0, fail: 0, avgLatency: 0, lastError: null },
        edge: { success: 0, fail: 0, avgLatency: 0, lastError: null },
        elevenlabs: { success: 0, fail: 0, avgLatency: 0, lastError: null },
        openai: { success: 0, fail: 0, avgLatency: 0, lastError: null },
      });
    }
    return this.regionalStats.get(region);
  }

  /**
   * Record successful TTS generation
   * @param {string} provider - Provider name (kokoro, groq, edge, etc.)
   * @param {number} latency - Time in milliseconds
   * @param {string} region - Optional region identifier
   */
  recordSuccess(provider, latency, region = 'UNKNOWN') {
    if (!this.globalStats[provider]) return;

    // Update global stats
    const global = this.globalStats[provider];
    global.success++;
    global.avgLatency = (global.avgLatency * (global.success - 1) + latency) / global.success;
    global.lastError = null;

    // Update regional stats
    const regional = this.getRegionalStats(region);
    if (regional[provider]) {
      regional[provider].success++;
      regional[provider].avgLatency = 
        (regional[provider].avgLatency * (regional[provider].success - 1) + latency) / 
        regional[provider].success;
      regional[provider].lastError = null;
    }

    // Invalidate cache
    this.optimalCache.clear();
  }

  /**
   * Record failed TTS generation
   * @param {string} provider - Provider name
   * @param {string} errorType - Error category (timeout, auth, unavailable, etc.)
   * @param {string} region - Optional region identifier
   */
  recordFailure(provider, errorType = 'unknown', region = 'UNKNOWN') {
    if (!this.globalStats[provider]) return;

    // Update global stats
    const global = this.globalStats[provider];
    global.fail++;
    global.lastError = { type: errorType, timestamp: Date.now() };

    // Update regional stats
    const regional = this.getRegionalStats(region);
    if (regional[provider]) {
      regional[provider].fail++;
      regional[provider].lastError = { type: errorType, timestamp: Date.now() };
    }

    // Invalidate cache
    this.optimalCache.clear();
  }

  /**
   * Calculate success rate for a provider
   * @param {string} provider
   * @param {string} region
   * @returns {number} Success rate 0-1 (or 0.5 if no data)
   */
  getSuccessRate(provider, region = null) {
    const stats = region ? this.getRegionalStats(region)[provider] : this.globalStats[provider];
    if (!stats) return 0.5;
    const total = stats.success + stats.fail;
    if (total === 0) return 0.5; // Default neutral if no history
    return stats.success / total;
  }

  /**
   * Calculate provider score for ranking
   * Score = (success_rate * 0.7) + (1 - normalized_latency * 0.3)
   * Higher score = better provider
   */
  calculateScore(provider, region = null) {
    const successRate = this.getSuccessRate(provider, region);
    
    // Get all latencies to normalize
    const stats = region ? this.getRegionalStats(region)[provider] : this.globalStats[provider];
    const avgLatency = stats?.avgLatency || 1000;
    
    // Normalize latency: 200ms = 1.0, 2000ms = 0.1
    const normalizedLatency = Math.max(0.1, Math.min(1.0, 1 - (avgLatency - 200) / 1800));
    
    // Score: 70% success rate, 30% latency
    return (successRate * 0.7) + (normalizedLatency * 0.3);
  }

  /**
   * Get best provider for a given service type and region
   * Returns provider name with highest score
   * @param {string} serviceType - 'TTS' or 'STT'
   * @param {string} region - Region for regional optimization
   * @returns {string} Best provider name, or null if no data
   */
  getBestProvider(serviceType = 'TTS', region = 'UNKNOWN') {
    // Check cache first
    const cacheKey = `${serviceType}:${region}`;
    if (this.optimalCache.has(cacheKey)) {
      return this.optimalCache.get(cacheKey);
    }

    // For TTS, rank available providers
    const providers = ['kokoro', 'groq', 'edge', 'elevenlabs', 'openai'];
    let best = null;
    let bestScore = -Infinity;

    for (const provider of providers) {
      const score = this.calculateScore(provider, region);
      if (score > bestScore) {
        bestScore = score;
        best = provider;
      }
    }

    // Cache result
    this.optimalCache.set(cacheKey, best);
    return best;
  }

  /**
   * Get ranked providers for a region
   * @param {string} region
   * @returns {array} Providers sorted by score (best first)
   */
  getRankedProviders(region = 'UNKNOWN') {
    const providers = ['kokoro', 'groq', 'edge', 'elevenlabs', 'openai'];
    return providers
      .map(provider => ({
        name: provider,
        score: this.calculateScore(provider, region),
        successRate: this.getSuccessRate(provider, region),
        avgLatency: this.globalStats[provider]?.avgLatency || 0,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get stats snapshot for monitoring/debugging
   * @param {string} region - Optional region filter
   * @returns {object} Stats summary
   */
  getStats(region = null) {
    if (region) {
      return {
        region,
        providers: this.getRankedProviders(region),
        regionalData: this.getRegionalStats(region),
      };
    }

    return {
      global: this.globalStats,
      regions: Array.from(this.regionalStats.entries()).reduce((acc, [r, stats]) => {
        acc[r] = stats;
        return acc;
      }, {}),
      optimalProviders: {
        TTS: this.getBestProvider('TTS', 'UNKNOWN'),
        byRegion: {
          'US-East': this.getBestProvider('TTS', 'US-East'),
          'US-West': this.getBestProvider('TTS', 'US-West'),
          'EU': this.getBestProvider('TTS', 'EU'),
          'APAC': this.getBestProvider('TTS', 'APAC'),
        },
      },
    };
  }

  /**
   * Clear all stats (for testing or reset)
   */
  reset() {
    this.regionalStats.clear();
    this.optimalCache.clear();
    for (const provider of Object.keys(this.globalStats)) {
      this.globalStats[provider] = { success: 0, fail: 0, avgLatency: 0, lastError: null };
    }
  }

  /**
   * Export stats as JSON (for persistence if needed)
   */
  export() {
    return {
      global: this.globalStats,
      regional: Object.fromEntries(this.regionalStats),
      timestamp: Date.now(),
    };
  }

  /**
   * Import stats from JSON (for recovery/migration)
   */
  import(data) {
    if (data.global) {
      Object.assign(this.globalStats, data.global);
    }
    if (data.regional) {
      for (const [region, stats] of Object.entries(data.regional)) {
        this.regionalStats.set(region, stats);
      }
    }
    this.optimalCache.clear();
  }
}

// Singleton instance
const providerStats = new ProviderStatsService();

export default providerStats;
export { ProviderStatsService };
