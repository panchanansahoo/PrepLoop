/**
 * Adaptive Interview Difficulty Service
 *
 * Analyzes user performance history to dynamically adjust interview difficulty.
 * Uses an Elo-like rating system per topic.
 */

import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('difficulty-adaptation');

const DIFFICULTY_LEVELS = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const BASE_RATING = 1200;
const K_FACTOR = 32;

/**
 * Get recommended difficulty for a user on a given topic.
 */
export async function getRecommendedDifficulty(userId, topic = 'general') {
  try {
    const { data: history } = await supabaseAdmin
      .from('interview_sessions')
      .select('overall_score, difficulty, session_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!history || history.length < 3) {
      return { level: 'medium', confidence: 'low', rating: BASE_RATING, reason: 'Not enough history' };
    }

    // Calculate Elo-like rating
    let rating = BASE_RATING;
    for (const interview of history.reverse()) {
      const score = interview.overall_score || 50;
      const difficultyIndex = DIFFICULTY_LEVELS.indexOf(interview.difficulty || 'medium');
      const expectedScore = 50 + (difficultyIndex - 2) * 10;
      const actual = score / 100;
      const expected = expectedScore / 100;
      rating += K_FACTOR * (actual - expected);
    }

    rating = Math.max(800, Math.min(2000, rating));

    // Map rating to difficulty level
    let level;
    if (rating < 1000) level = 'beginner';
    else if (rating < 1150) level = 'easy';
    else if (rating < 1350) level = 'medium';
    else if (rating < 1550) level = 'hard';
    else level = 'expert';

    // Check recent trend
    const recent = history.slice(-5);
    const avgRecentScore = recent.reduce((s, i) => s + (i.overall_score || 50), 0) / recent.length;
    const trend = avgRecentScore > 75 ? 'improving' : avgRecentScore < 40 ? 'struggling' : 'stable';

    // Adjust based on trend
    if (trend === 'improving' && level !== 'expert') {
      const idx = DIFFICULTY_LEVELS.indexOf(level);
      level = DIFFICULTY_LEVELS[Math.min(idx + 1, DIFFICULTY_LEVELS.length - 1)];
    }

    return {
      level,
      confidence: history.length >= 10 ? 'high' : 'medium',
      rating: Math.round(rating),
      trend,
      recentAvgScore: Math.round(avgRecentScore),
      totalInterviews: history.length,
    };
  } catch (error) {
    logger.error('Failed to calculate difficulty', { userId, error: error.message });
    return { level: 'medium', confidence: 'low', rating: BASE_RATING, reason: 'Calculation error' };
  }
}

/**
 * Identify areas where the user has consistently scored low recently.
 * @param {string} userId - The user ID
 * @param {string} topic - The interview topic/type
 * @returns {Promise<string[]>} Array of skill gap categories
 */
export async function getSkillGaps(userId, topic = null) {
  try {
    let query = supabaseAdmin
      .from('interview_sessions')
      .select('metrics')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (topic) {
      query = query.eq('session_type', topic);
    }
    
    const { data: sessions } = await query;
    
    if (!sessions || sessions.length === 0) return [];
    
    // Average metrics across recent sessions
    const aggregatedMetrics = {};
    const counts = {};
    
    for (const session of sessions) {
      if (session.metrics) {
        for (const [key, value] of Object.entries(session.metrics)) {
          if (typeof value === 'number') {
            aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + value;
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      }
    }
    
    // Identify gaps (average score < 60)
    const gaps = [];
    for (const key of Object.keys(aggregatedMetrics)) {
      const avg = aggregatedMetrics[key] / counts[key];
      if (avg < 60) {
        gaps.push(key);
      }
    }
    
    return gaps;
  } catch (error) {
    logger.error('Failed to calculate skill gaps', { userId, error: error.message });
    return [];
  }
}

/**
 * Generate difficulty-specific system prompt additions.
 */
export function getDifficultyPrompt(level) {
  const prompts = {
    beginner: 'Ask simple, foundational questions. Give helpful hints. Be encouraging.',
    easy: 'Ask straightforward questions with clear requirements. Provide gentle guidance.',
    medium: 'Ask standard interview-level questions. Expect structured thinking.',
    hard: 'Ask complex problems with edge cases. Expect optimal solutions and trade-off analysis.',
    expert: 'Ask system-design-level questions. Expect deep architectural reasoning and production considerations.',
  };
  return prompts[level] || prompts.medium;
}

export default { getRecommendedDifficulty, getSkillGaps, getDifficultyPrompt };
