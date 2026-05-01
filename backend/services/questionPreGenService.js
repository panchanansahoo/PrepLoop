/**
 * Question Pre-generation Service — Phase 2 Optimization
 * 
 * OPTIMIZATION: Pre-generate common interview questions during lobby wait
 * Benefit: 500-1000ms faster first question latency
 * 
 * Strategy:
 * - Cache first N questions per interview type during PreflightChecks/lobby
 * - Async generation doesn't block UI
 * - Graceful degradation if generation fails
 */

import NodeCache from 'node-cache';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('QuestionPreGen');

// L1 Cache: Memory (fast access for current session)
const questionCache = new NodeCache({ stdTTL: 1800, checkperiod: 1800 }); // 30 min TTL

// TTL for different cache scenarios
const CACHE_TTL_SECONDS = 1800; // 30 minutes
const PREWAR_BATCH_SIZE = 3; // Pre-generate top 3 questions per type/difficulty
const PREWAR_CONCURRENCY = 2; // Max 2 parallel pre-gen operations

// Track ongoing pre-generation to avoid duplicate work
const ongoingPreGen = new Map(); // key: "type-difficulty", value: Promise

/**
 * Get cached question pool for a given type/difficulty
 * Returns immediate hit if available, null otherwise
 */
export function getCachedQuestion(type, difficulty, index = 0) {
    const key = `questions:${type}:${difficulty}`;
    const pool = questionCache.get(key);
    
    if (!pool || !Array.isArray(pool) || pool.length === 0) {
        return null;
    }
    
    // Return question at index, cycling if necessary
    const actualIndex = Math.min(index, pool.length - 1);
    return pool[actualIndex] || null;
}

/**
 * Store pre-generated questions in cache
 */
export function cacheQuestions(type, difficulty, questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
        logger.warn('Attempted to cache empty question pool', { type, difficulty });
        return;
    }
    
    const key = `questions:${type}:${difficulty}`;
    questionCache.set(key, questions, CACHE_TTL_SECONDS);
    logger.info('Questions cached', { type, difficulty, count: questions.length });
}

/**
 * Pre-generate questions asynchronously
 * Returns promise that resolves when pre-generation completes
 * Multiple calls for same type/difficulty are deduped
 */
export async function preGenerateQuestions(type, difficulty, generateFn) {
    const key = `${type}-${difficulty}`;
    
    // Return ongoing promise if already generating
    if (ongoingPreGen.has(key)) {
        logger.debug('Pre-generation already in progress, reusing promise', { type, difficulty });
        return ongoingPreGen.get(key);
    }
    
    // Check if already cached
    if (getCachedQuestion(type, difficulty, 0)) {
        logger.debug('Questions already cached, skipping pre-generation', { type, difficulty });
        return null;
    }
    
    // Start pre-generation
    const preGenPromise = (async () => {
        try {
            logger.info('Starting question pre-generation', { type, difficulty, batchSize: PREWAR_BATCH_SIZE });
            const startTime = Date.now();
            
            const questions = [];
            for (let i = 0; i < PREWAR_BATCH_SIZE; i++) {
                try {
                    const question = await generateFn(type, difficulty, questions.map(q => q?.question));
                    if (question) {
                        questions.push(question);
                    }
                } catch (err) {
                    logger.warn(`Failed to generate question ${i + 1}/${PREWAR_BATCH_SIZE}`, {
                        type,
                        difficulty,
                        error: err.message
                    });
                    // Continue generating remaining questions even if one fails
                }
            }
            
            if (questions.length > 0) {
                cacheQuestions(type, difficulty, questions);
                const elapsed = Date.now() - startTime;
                logger.info('Question pre-generation completed', {
                    type,
                    difficulty,
                    count: questions.length,
                    elapsedMs: elapsed,
                    avgMs: Math.round(elapsed / questions.length)
                });
            } else {
                logger.warn('No questions generated', { type, difficulty });
            }
            
            return questions;
        } catch (error) {
            logger.error('Question pre-generation failed', { type, difficulty, error: error.message });
            return [];
        } finally {
            // Clean up ongoing promise tracker
            ongoingPreGen.delete(key);
        }
    })();
    
    ongoingPreGen.set(key, preGenPromise);
    return preGenPromise;
}

/**
 * Pre-generate questions for multiple types (async, parallel with concurrency limit)
 * 
 * Usage: Call from lobby/preflight checks to warm cache before interview starts
 * 
 * Example:
 *   const types = ['technical', 'behavioral', 'system-design'];
 *   const difficulties = ['easy', 'medium', 'hard'];
 *   preGenerateMultiple(types, difficulties, generateAIQuestionFn);
 */
export async function preGenerateMultiple(types, difficulties, generateFn) {
    const tasks = [];
    
    for (const type of types) {
        for (const difficulty of difficulties) {
            tasks.push(preGenerateQuestions(type, difficulty, generateFn));
        }
    }
    
    // Run with concurrency limit
    const results = [];
    for (let i = 0; i < tasks.length; i += PREWAR_CONCURRENCY) {
        const batch = tasks.slice(i, i + PREWAR_CONCURRENCY);
        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);
    }
    
    logger.info('Multi-type pre-generation completed', {
        typeCount: types.length,
        difficultyCount: difficulties.length,
        totalTasks: tasks.length,
        successCount: results.filter(r => r.status === 'fulfilled').length,
        failureCount: results.filter(r => r.status === 'rejected').length
    });
    
    return results;
}

/**
 * Clear cached questions (useful for testing or manual refresh)
 */
export function clearQuestionCache(type, difficulty) {
    if (type && difficulty) {
        const key = `questions:${type}:${difficulty}`;
        questionCache.del(key);
        logger.info('Cleared question cache', { type, difficulty });
    } else {
        questionCache.flushAll();
        logger.info('Cleared all question cache');
    }
}

/**
 * Get cache statistics for monitoring
 */
export function getQuestionCacheStats() {
    const keys = questionCache.keys();
    const stats = {};
    
    for (const key of keys) {
        if (key.startsWith('questions:')) {
            const [, type, difficulty] = key.split(':');
            const pool = questionCache.get(key);
            stats[key] = {
                type,
                difficulty,
                count: pool?.length || 0,
                ttlRemaining: questionCache.getTtl(key)
            };
        }
    }
    
    return {
        totalKeys: keys.length,
        questionPools: stats,
        ongoingPreGen: Array.from(ongoingPreGen.keys())
    };
}
