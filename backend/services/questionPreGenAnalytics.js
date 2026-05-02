/**
 * Question Pre-generation Analytics Service — Phase 4.1
 * 
 * OPTIMIZATION: Track cache hit/miss ratios and usage patterns
 * Goal: Enable adaptive batch sizing based on real-world data
 * 
 * Metrics:
 * - Hit/miss ratio per question type/difficulty
 * - Session length distribution (how many questions per session)
 * - Time-of-day patterns (detect peak hours)
 * - Average time between questions (user think time)
 * - Pre-generation latency (compute cost per question)
 * 
 * Storage: In-memory with exponential smoothing to prevent oscillation
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('QuestionPreGenAnalytics');

// Analytics state per question type/difficulty
class HitMissTracker {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
    this.lastUpdated = Date.now();
    this.window1h = [];  // Requests in last hour (for peak detection)
  }

  recordHit() {
    this.hits++;
    this.totalRequests++;
    this.window1h.push({ type: 'hit', time: Date.now() });
    this.cleanup();
  }

  recordMiss() {
    this.misses++;
    this.totalRequests++;
    this.window1h.push({ type: 'miss', time: Date.now() });
    this.cleanup();
  }

  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.window1h = this.window1h.filter(r => r.time > oneHourAgo);
  }

  getHitRate() {
    if (this.totalRequests === 0) return 0.5; // Default neutral
    return this.hits / this.totalRequests;
  }

  getHitCount1h() {
    return this.window1h.filter(r => r.type === 'hit').length;
  }

  getRequestCount1h() {
    return this.window1h.length;
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.totalRequests = 0;
    this.window1h = [];
    this.lastUpdated = Date.now();
  }
}

// Session-level tracking
class SessionTracker {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.questionsAsked = [];
    this.sessionStart = Date.now();
  }

  recordQuestion(type, difficulty, isCacheHit) {
    this.questionsAsked.push({
      type,
      difficulty,
      isCacheHit,
      timestamp: Date.now()
    });
  }

  getSessionLength() {
    return this.questionsAsked.length;
  }

  getSessionDuration() {
    return Date.now() - this.sessionStart;
  }

  getAverageThinkTime() {
    if (this.questionsAsked.length < 2) return 0;
    const times = [];
    for (let i = 1; i < this.questionsAsked.length; i++) {
      const delta = this.questionsAsked[i].timestamp - this.questionsAsked[i - 1].timestamp;
      times.push(delta);
    }
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}

// Global analytics state
const hitMissTrackers = new Map(); // key: "type:difficulty"
const activeSessions = new Map();   // key: sessionId
const generationLatencies = [];      // Track pre-gen latency (keep last 100)
const peakHourCache = {
  lastUpdate: Date.now(),
  isPeak: false,
  estimatedLoad: 0.5 // 0-1 scale
};

/**
 * Record a question cache hit
 */
export function recordCacheHit(type, difficulty) {
  const key = `${type}:${difficulty}`;
  if (!hitMissTrackers.has(key)) {
    hitMissTrackers.set(key, new HitMissTracker());
  }
  hitMissTrackers.get(key).recordHit();
}

/**
 * Record a question cache miss
 */
export function recordCacheMiss(type, difficulty) {
  const key = `${type}:${difficulty}`;
  if (!hitMissTrackers.has(key)) {
    hitMissTrackers.set(key, new HitMissTracker());
  }
  hitMissTrackers.get(key).recordMiss();
}

/**
 * Track pre-generation latency (for cost estimation)
 */
export function recordGenerationLatency(type, difficulty, latencyMs, questionCount) {
  generationLatencies.push({
    type,
    difficulty,
    latencyMs,
    questionCount,
    costPerQuestion: latencyMs / Math.max(questionCount, 1),
    timestamp: Date.now()
  });

  // Keep only last 100 entries
  if (generationLatencies.length > 100) {
    generationLatencies.shift();
  }
}

/**
 * Track question request in a session
 */
export function recordSessionQuestion(sessionId, type, difficulty, isCacheHit) {
  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, new SessionTracker(sessionId));
  }
  activeSessions.get(sessionId).recordQuestion(type, difficulty, isCacheHit);
}

/**
 * End a session (cleanup)
 */
export function endSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    logger.info('Session ended', {
      sessionId,
      questionsAsked: session.getSessionLength(),
      durationMs: session.getSessionDuration(),
      avgThinkTimeMs: Math.round(session.getAverageThinkTime())
    });
  }
  activeSessions.delete(sessionId);
}

/**
 * Get analytics for a specific type/difficulty
 */
export function getAnalytics(type, difficulty) {
  const key = `${type}:${difficulty}`;
  const tracker = hitMissTrackers.get(key);

  if (!tracker) {
    return null;
  }

  return {
    type,
    difficulty,
    hitRate: tracker.getHitRate(),
    totalRequests: tracker.totalRequests,
    hits: tracker.hits,
    misses: tracker.misses,
    requests1h: tracker.getRequestCount1h(),
    hits1h: tracker.getHitCount1h(),
    avgLatencyMs: getAverageLatency(type, difficulty)
  };
}

/**
 * Get all analytics (for dashboard)
 */
export function getAllAnalytics() {
  const analytics = [];
  for (const [key, tracker] of hitMissTrackers) {
    const [type, difficulty] = key.split(':');
    analytics.push({
      type,
      difficulty,
      hitRate: tracker.getHitRate(),
      totalRequests: tracker.totalRequests,
      hits: tracker.hits,
      misses: tracker.misses,
      requests1h: tracker.getRequestCount1h(),
      hits1h: tracker.getHitCount1h(),
      avgLatencyMs: getAverageLatency(type, difficulty)
    });
  }
  return analytics;
}

/**
 * Get average generation latency for type/difficulty
 */
function getAverageLatency(type, difficulty) {
  const matching = generationLatencies.filter(
    g => g.type === type && g.difficulty === difficulty
  );
  if (matching.length === 0) return 0;
  const total = matching.reduce((sum, g) => sum + g.costPerQuestion, 0);
  return Math.round(total / matching.length);
}

/**
 * Detect if current time is peak hour (more than 1 std dev above mean)
 */
export function updatePeakHourDetection() {
  const now = Date.now();
  const timeSinceLastUpdate = now - peakHourCache.lastUpdate;

  // Update every 5 minutes
  if (timeSinceLastUpdate < 5 * 60 * 1000) {
    return peakHourCache.isPeak;
  }

  // Count requests in last hour across all types
  let totalRequests1h = 0;
  for (const tracker of hitMissTrackers.values()) {
    totalRequests1h += tracker.getRequestCount1h();
  }

  // Estimate load (this is a simple heuristic)
  // In production, you'd integrate with actual server metrics
  const estimatedLoad = Math.min(totalRequests1h / 100, 1.0); // 100 = reference load
  const isPeak = estimatedLoad > 0.7; // Peak if > 70% of reference load

  peakHourCache.lastUpdate = now;
  peakHourCache.isPeak = isPeak;
  peakHourCache.estimatedLoad = estimatedLoad;

  if (isPeak) {
    logger.info('Peak hour detected', { estimatedLoad, totalRequests1h });
  }

  return isPeak;
}

/**
 * Get current peak hour status
 */
export function getPeakHourStatus() {
  updatePeakHourDetection();
  return {
    isPeak: peakHourCache.isPeak,
    estimatedLoad: peakHourCache.estimatedLoad,
    timestamp: peakHourCache.lastUpdate
  };
}

/**
 * Get average session statistics
 */
export function getSessionStats() {
  if (activeSessions.size === 0) {
    return {
      activeSessions: 0,
      avgSessionLength: 0,
      avgThinkTimeMs: 0,
      avgSessionDurationMs: 0
    };
  }

  const sessions = Array.from(activeSessions.values());
  const lengths = sessions.map(s => s.getSessionLength());
  const thinkTimes = sessions.map(s => s.getAverageThinkTime());
  const durations = sessions.map(s => s.getSessionDuration());

  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const avgThinkTime = thinkTimes.reduce((a, b) => a + b, 0) / thinkTimes.length;
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  return {
    activeSessions: activeSessions.size,
    avgSessionLength: Math.round(avgLength * 10) / 10,
    avgThinkTimeMs: Math.round(avgThinkTime),
    avgSessionDurationMs: Math.round(avgDuration)
  };
}

/**
 * Reset all analytics (useful for testing)
 */
export function resetAnalytics() {
  hitMissTrackers.clear();
  activeSessions.clear();
  generationLatencies.length = 0;
  logger.info('Analytics reset');
}

/**
 * Get comprehensive analytics report
 */
export function getAnalyticsReport() {
  return {
    timestamp: Date.now(),
    hitMissStats: getAllAnalytics(),
    peakHourStatus: getPeakHourStatus(),
    sessionStats: getSessionStats(),
    generationLatencies: {
      samples: generationLatencies.length,
      avgCostPerQuestion: generationLatencies.length > 0
        ? Math.round(
            generationLatencies.reduce((sum, g) => sum + g.costPerQuestion, 0) /
            generationLatencies.length
          )
        : 0
    }
  };
}
