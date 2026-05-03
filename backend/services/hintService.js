/**
 * Hint System Service - Phase 1.1
 *
 * Manages progressive hint disclosure with cooldown tracking
 * - First hint reveal: always free
 * - Subsequent reveals: require 5-minute cooldown
 * - Tracks hint usage for analytics
 *
 * Hint types: 'approach', 'code', 'edge_case'
 */

import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('HintService');

const HINT_COOLDOWN_MINUTES = 5; // Minutes between hint reveals
const HINT_TYPES = ['approach', 'code', 'edge_case'];

class HintService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get hint for a problem - checks cooldown before revealing
   * Returns: { hint_text, first_reveal, cooldown_remaining_seconds, can_reveal }
   */
  async getHint(userId, problemId, hintType) {
    if (!HINT_TYPES.includes(hintType)) {
      throw new Error(`Invalid hint type. Must be one of: ${HINT_TYPES.join(', ')}`);
    }

    // 1. Get problem to extract hint text
    const { data: problem, error: problemError } = await this.supabase
      .from('problems')
      .select('hints')
      .eq('id', problemId)
      .single();

    if (problemError) {
      logger.error('Hint retrieval error', {
        error: problemError.message,
        userId,
        problemId,
      });
      throw new Error('Problem not found');
    }

    const hintText = problem?.hints?.[hintType] || '';

    // 2. Check if user has revealed this hint before
    const { data: existingReveal, error: revealError } = await this.supabase
      .from('user_hint_usage')
      .select('revealed_at, cooldown_until')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .eq('hint_type', hintType)
      .single();

    if (revealError && revealError.code !== 'PGRST116') {
      // PGRST116 = no rows, which is expected for first reveal
      logger.error('Hint usage query error', { error: revealError.message, userId, problemId });
      throw revealError;
    }

    const firstReveal = !existingReveal;

    // 3. Check cooldown
    let canReveal = firstReveal;
    let cooldownRemaining = 0;

    if (!firstReveal) {
      const now = new Date();
      const cooldownUntil = existingReveal?.cooldown_until
        ? new Date(existingReveal.cooldown_until)
        : null;

      if (cooldownUntil && cooldownUntil > now) {
        cooldownRemaining = Math.ceil((cooldownUntil - now) / 1000);
        canReveal = false;
      } else {
        canReveal = true;
      }
    }

    if (!canReveal) {
      return {
        hint_text: null,
        first_reveal: false,
        cooldown_remaining_seconds: cooldownRemaining,
        can_reveal: false,
        message: `Hint available again in ${cooldownRemaining} seconds`,
      };
    }

    // 4. Record/update hint reveal with cooldown
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + HINT_COOLDOWN_MINUTES * 60 * 1000);

    if (firstReveal) {
      await this.supabase.from('user_hint_usage').insert({
        user_id: userId,
        problem_id: problemId,
        hint_type: hintType,
        revealed_at: now.toISOString(),
        cooldown_until: cooldownUntil.toISOString(),
      });
    } else {
      await this.supabase
        .from('user_hint_usage')
        .update({
          revealed_at: now.toISOString(),
          cooldown_until: cooldownUntil.toISOString(),
        })
        .eq('user_id', userId)
        .eq('problem_id', problemId)
        .eq('hint_type', hintType);
    }

    logger.info('Hint revealed', {
      userId,
      problemId,
      hintType,
      first_reveal: firstReveal,
    });

    return {
      hint_text: hintText,
      first_reveal: firstReveal,
      cooldown_remaining_seconds: 0,
      can_reveal: true,
    };
  }

  /**
   * Get all hints for a problem (admin/teacher view)
   */
  async getAllHints(problemId) {
    const { data: problem } = await this.supabase
      .from('problems')
      .select('id, title, hints')
      .eq('id', problemId)
      .single();

    if (!problem) {
      throw new Error('Problem not found');
    }

    return {
      problem_id: problem.id,
      problem_title: problem.title,
      hints: problem.hints || { approach: '', code: '', edge_case: '' },
    };
  }

  /**
   * Update hints for a problem (admin/content team)
   */
  async updateHints(problemId, hints) {
    // Validate structure
    if (!hints || typeof hints !== 'object') {
      throw new Error('Hints must be an object');
    }

    const validatedHints = {
      approach: hints.approach || '',
      code: hints.code || '',
      edge_case: hints.edge_case || '',
    };

    const { data, error } = await this.supabase
      .from('problems')
      .update({ hints: validatedHints })
      .eq('id', problemId)
      .select();

    if (error) {
      throw error;
    }

    logger.info('Hints updated', { problemId });
    return data?.[0];
  }

  /**
   * Get hint usage statistics for a user across all problems
   */
  async getUserHintStatistics(userId) {
    const { data: usage, error } = await this.supabase
      .from('user_hint_usage')
      .select('problem_id, hint_type, revealed_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Group by hint type
    const stats = {
      total_hints_revealed: usage?.length || 0,
      by_type: {
        approach: 0,
        code: 0,
        edge_case: 0,
      },
      problems_with_hints: new Set(),
    };

    (usage || []).forEach((record) => {
      stats.by_type[record.hint_type] = (stats.by_type[record.hint_type] || 0) + 1;
      stats.problems_with_hints.add(record.problem_id);
    });

    stats.problems_with_hints = stats.problems_with_hints.size;

    return stats;
  }

  /**
   * Reset hint cooldown for testing or admin override
   */
  async resetHintCooldown(userId, problemId, hintType) {
    const { error } = await this.supabase
      .from('user_hint_usage')
      .update({ cooldown_until: null })
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .eq('hint_type', hintType);

    if (error) {
      throw error;
    }

    logger.info('Hint cooldown reset', { userId, problemId, hintType });
  }
}

export default HintService;
