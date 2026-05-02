/**
 * Question Pool Manager
 * Tracks questions asked in 24-hour window per user
 * Provides deduplication lookup with automatic TTL cleanup
 */

import * as questionHasher from './questionHasher.js';

// In-memory storage: userId -> { questions: [...], lastCleanup: timestamp }
const questionPools = new Map();

// Configuration
const CONFIG = {
  TTL_MS: 24 * 60 * 60 * 1000,  // 24 hours
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000,  // Run cleanup every 1 hour
  SIMILARITY_THRESHOLD: 80,  // Mark as potential duplicate if >= 80% similar
  MAX_POOL_SIZE: 500,  // Max questions per user before aggressive cleanup
  CLEANUP_BATCH_SIZE: 50  // Remove oldest 50 questions if pool exceeds max
};

// Question entry structure:
// {
//   id: string,
//   text: string,
//   fingerprint: string,
//   hash: string,
//   keyTerms: array,
//   category: string,
//   difficulty: string,  // easy | medium | hard
//   timestamp: number,
//   askedBy: string,  // userId
//   responseTime: number (ms, optional),
//   quality: number (0-100, optional)
// }

/**
 * Initialize or get pool for user
 */
function getOrCreatePool(userId) {
  if (!questionPools.has(userId)) {
    questionPools.set(userId, {
      questions: [],
      lastCleanup: Date.now()
    });
  }
  return questionPools.get(userId);
}

/**
 * Add question to pool
 */
export function addQuestion(userId, questionData) {
  if (!userId || !questionData) return false;
  
  const pool = getOrCreatePool(userId);
  
  // Generate fingerprint if not provided
  const fingerprint = questionData.fingerprint ||
    questionHasher.generateFingerprint(questionData.text);
  
  const entry = {
    id: questionData.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: (questionData.text || '').substring(0, 500),
    fingerprint: fingerprint.fingerprint || fingerprint,
    hash: questionHasher.quickHash(questionData.text),
    keyTerms: fingerprint.keyTerms || [],
    category: fingerprint.category || 'general',
    difficulty: questionData.difficulty || 'medium',
    timestamp: Date.now(),
    askedBy: userId,
    responseTime: questionData.responseTime || null,
    quality: questionData.quality || null
  };
  
  pool.questions.push(entry);
  
  // Trigger cleanup if pool is getting large
  if (pool.questions.length > CONFIG.MAX_POOL_SIZE) {
    cleanupPool(userId, true);  // Aggressive cleanup
  }
  
  return entry;
}

/**
 * Check if question is duplicate in pool
 */
export function isDuplicate(userId, questionText, options = {}) {
  const pool = getOrCreatePool(userId);
  const activeQuestions = getActiveQuestions(userId);
  
  if (activeQuestions.length === 0) {
    return {
      isDuplicate: false,
      matches: [],
      similarityScore: 0,
      reason: 'pool-empty'
    };
  }
  
  const similarityThreshold = options.threshold || CONFIG.SIMILARITY_THRESHOLD;
  const result = questionHasher.checkDuplicate(
    questionText,
    activeQuestions.map(q => ({
      text: q.text,
      keyTerms: q.keyTerms
    })),
    similarityThreshold
  );
  
  return {
    isDuplicate: result.isDuplicate,
    matches: result.matchedQuestions.map(m => ({
      text: m.question,
      similarity: m.similarity,
      reason: m.reason
    })),
    similarityScore: result.similarity,
    reason: result.reason
  };
}

/**
 * Get all active (non-expired) questions for user
 */
export function getActiveQuestions(userId) {
  const pool = getOrCreatePool(userId);
  const now = Date.now();
  
  const active = pool.questions.filter(q => {
    const age = now - q.timestamp;
    return age < CONFIG.TTL_MS;
  });
  
  return active;
}

/**
 * Get questions by difficulty
 */
export function getQuestionsByDifficulty(userId, difficulty) {
  const active = getActiveQuestions(userId);
  return active.filter(q => q.difficulty === difficulty);
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(userId, category) {
  const active = getActiveQuestions(userId);
  return active.filter(q => q.category === category);
}

/**
 * Get pool statistics
 */
export function getPoolStats(userId) {
  const pool = getOrCreatePool(userId);
  const active = getActiveQuestions(userId);
  
  const stats = {
    userId,
    totalQuestions: pool.questions.length,
    activeQuestions: active.length,
    expiredQuestions: pool.questions.length - active.length,
    lastCleanup: pool.lastCleanup,
    byDifficulty: {
      easy: active.filter(q => q.difficulty === 'easy').length,
      medium: active.filter(q => q.difficulty === 'medium').length,
      hard: active.filter(q => q.difficulty === 'hard').length
    },
    byCategory: {},
    oldestQuestion: active.length > 0 ? Math.min(...active.map(q => q.timestamp)) : null,
    newestQuestion: active.length > 0 ? Math.max(...active.map(q => q.timestamp)) : null
  };
  
  // Count by category
  for (const q of active) {
    stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
  }
  
  return stats;
}

/**
 * Cleanup expired questions from pool
 */
export function cleanupPool(userId, aggressive = false) {
  const pool = getOrCreatePool(userId);
  const now = Date.now();
  const before = pool.questions.length;
  
  // Remove expired questions
  pool.questions = pool.questions.filter(q => {
    const age = now - q.timestamp;
    return age < CONFIG.TTL_MS;
  });
  
  // Aggressive cleanup if pool too large
  if (aggressive && pool.questions.length > CONFIG.MAX_POOL_SIZE) {
    // Sort by quality score (ascending) and timestamp (ascending)
    pool.questions.sort((a, b) => {
      const qualityDiff = (a.quality || 50) - (b.quality || 50);
      if (qualityDiff !== 0) return qualityDiff;
      return a.timestamp - b.timestamp;
    });
    
    // Remove oldest CONFIG.CLEANUP_BATCH_SIZE questions
    pool.questions = pool.questions.slice(CONFIG.CLEANUP_BATCH_SIZE);
  }
  
  pool.lastCleanup = now;
  const after = pool.questions.length;
  
  return {
    userId,
    removed: before - after,
    before,
    after,
    aggressive
  };
}

/**
 * Cleanup ALL expired pools
 */
export function cleanupAllPools() {
  const results = [];
  
  for (const [userId, pool] of questionPools.entries()) {
    const result = cleanupPool(userId, false);
    if (result.removed > 0) {
      results.push(result);
    }
    
    // Remove empty pools
    if (pool.questions.length === 0) {
      questionPools.delete(userId);
    }
  }
  
  return {
    timestamp: Date.now(),
    poolsCleaned: results.length,
    totalRemoved: results.reduce((sum, r) => sum + r.removed, 0),
    details: results
  };
}

/**
 * Clear all questions for a user
 */
export function clearUserPool(userId) {
  if (questionPools.has(userId)) {
    const pool = questionPools.get(userId);
    const count = pool.questions.length;
    pool.questions = [];
    pool.lastCleanup = Date.now();
    return { userId, cleared: count };
  }
  return { userId, cleared: 0 };
}

/**
 * Remove specific question from pool
 */
export function removeQuestion(userId, questionId) {
  const pool = getOrCreatePool(userId);
  const before = pool.questions.length;
  
  pool.questions = pool.questions.filter(q => q.id !== questionId);
  
  return {
    userId,
    questionId,
    removed: before - pool.questions.length
  };
}

/**
 * Update question metadata (quality, response time, etc)
 */
export function updateQuestion(userId, questionId, updates) {
  const pool = getOrCreatePool(userId);
  const question = pool.questions.find(q => q.id === questionId);
  
  if (!question) {
    return { success: false, reason: 'question-not-found' };
  }
  
  // Allowed updates
  if (updates.quality !== undefined) {
    question.quality = Math.min(100, Math.max(0, updates.quality));
  }
  if (updates.responseTime !== undefined) {
    question.responseTime = updates.responseTime;
  }
  if (updates.feedback !== undefined) {
    question.feedback = updates.feedback;
  }
  
  return { success: true, question };
}

/**
 * Get duplicate candidates (questions similar to given question)
 */
export function findDuplicateCandidates(userId, questionText, options = {}) {
  const threshold = options.threshold || CONFIG.SIMILARITY_THRESHOLD;
  const active = getActiveQuestions(userId);
  
  const candidates = questionHasher.findSimilar(
    questionText,
    active.map(q => ({ id: q.id, text: q.text })),
    threshold
  );
  
  return {
    questionText: questionText.substring(0, 100),
    candidates: candidates.map(c => ({
      id: c.question.id,
      text: c.question.text,
      similarity: c.similarity
    })),
    threshold,
    foundCount: candidates.length
  };
}

/**
 * Start periodic cleanup task
 */
export function startPeriodicCleanup(intervalMs = CONFIG.CLEANUP_INTERVAL_MS) {
  const interval = setInterval(() => {
    const result = cleanupAllPools();
    if (result.totalRemoved > 0) {
      console.log(`[QuestionPool] Cleanup: removed ${result.totalRemoved} expired questions`);
    }
  }, intervalMs);
  
  // Allow unref so process can exit
  if (interval.unref) {
    interval.unref();
  }
  
  return {
    intervalId: interval,
    intervalMs,
    status: 'started'
  };
}

/**
 * Export current state for persistence (debugging/analytics)
 */
export function exportPoolState() {
  const state = {};
  
  for (const [userId, pool] of questionPools.entries()) {
    state[userId] = {
      totalQuestions: pool.questions.length,
      activeQuestions: getActiveQuestions(userId).length,
      lastCleanup: pool.lastCleanup,
      questions: pool.questions
    };
  }
  
  return state;
}

/**
 * Get total statistics across all users
 */
export function getGlobalStats() {
  const stats = {
    totalUsers: questionPools.size,
    totalQuestions: 0,
    totalActiveQuestions: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byCategory: {}
  };
  
  for (const [userId, pool] of questionPools.entries()) {
    const active = getActiveQuestions(userId);
    
    stats.totalQuestions += pool.questions.length;
    stats.totalActiveQuestions += active.length;
    
    for (const q of active) {
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
    }
  }
  
  return {
    timestamp: Date.now(),
    ...stats
  };
}

export default {
  addQuestion,
  isDuplicate,
  getActiveQuestions,
  getQuestionsByDifficulty,
  getQuestionsByCategory,
  getPoolStats,
  cleanupPool,
  cleanupAllPools,
  clearUserPool,
  removeQuestion,
  updateQuestion,
  findDuplicateCandidates,
  startPeriodicCleanup,
  exportPoolState,
  getGlobalStats,
  CONFIG
};
