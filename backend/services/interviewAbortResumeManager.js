/**
 * InterviewAbortResumeManager
 *
 * Handles graceful interview interruption and resumption:
 * - Save full interview state to Redis on abort/pause (7-day TTL)
 * - Restore context when user resumes within window
 * - Prevent score manipulation on resume (snapshot checksums)
 * - Generate post-interview snapshots (immutable analytics records)
 *
 * This ensures users can leave mid-interview and return to exact context,
 * while maintaining data integrity and preventing score tampering.
 */

import crypto from 'crypto';

export class InterviewAbortResumeManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.ABORT_STATE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
    this.SNAPSHOT_TTL = 30 * 24 * 60 * 60; // 30 days for analytics
  }

  /**
   * Save interview state on abort/pause
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @param {Object} interviewState - full interview state
   *   - stage, turns, scores, conversation, totalQuestions, etc.
   * @returns {Promise<Object>} abort checkpoint with timestamp and checksum
   */
  async saveAbortState(userId, interviewId, interviewState) {
    const timestamp = Date.now();

    const abortState = {
      user_id: userId,
      interview_id: interviewId,
      timestamp,
      state: {
        stage: interviewState.stage || 'unknown',
        turns: interviewState.turns || 0,
        current_scores: interviewState.scores || [], // Snapshot of scores so far
        total_questions: interviewState.totalQuestions || 0,
        conversation: interviewState.conversation || [],
        question_history: interviewState.questionHistory || [],
        strength_areas: interviewState.strengthAreas || [],
        weakness_areas: interviewState.weakAreas || [],
        feedback_received: interviewState.feedbackReceived || [],
        interview_type: interviewState.interviewType || 'technical',
      },
      // Context indicators for resume UX
      resume_indicator: this._buildResumeIndicator(interviewState),
    };

    // Calculate checksum AFTER creating the normalized state
    abortState.checksum = this._generateChecksum(abortState.state);

    // Store in Redis with TTL
    const key = this._getAbortStateKey(userId, interviewId);
    await this.redis.set(
      key,
      JSON.stringify(abortState),
      'EX',
      this.ABORT_STATE_TTL
    );

    return {
      status: 'aborted',
      checkpoint: abortState,
      can_resume_until: new Date(timestamp + this.ABORT_STATE_TTL * 1000).toISOString(),
    };
  }

  /**
   * Check if interview can be resumed
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @returns {Promise<Object|null>} abort checkpoint if exists, null if expired/not found
   */
  async getAbortState(userId, interviewId) {
    const key = this._getAbortStateKey(userId, interviewId);
    const data = await this.redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  /**
   * Restore interview from abort state (with validation)
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @param {Object} currentState - current interview state (may have changes)
   * @returns {Promise<Object>} validated restored state
   * @throws {Error} if checksum mismatch (state was modified)
   */
  async resumeFromAbort(userId, interviewId, currentState = {}) {
    const abortState = await this.getAbortState(userId, interviewId);

    if (!abortState) {
      throw new Error('No saved abort state found. Interview may have expired or been completed.');
    }

    // Validate checksum to prevent score manipulation
    const currentChecksum = this._generateChecksum(abortState.state);
    if (currentChecksum !== abortState.checksum) {
      throw new Error('Abort state checksum mismatch. State may have been modified.');
    }

    // Merge abort state with any updates (e.g., timestamps)
    const restoredState = {
      ...abortState.state,
      resumed_at: Date.now(),
      resumed_from_stage: abortState.state.stage,
      resume_indicator: abortState.resume_indicator,
      is_resumed: true,
    };

    return restoredState;
  }

  /**
   * Generate immutable post-interview snapshot
   * Called when interview is finalized (completed or definitively ended)
   * Snapshots are retained for 30 days for analytics
   *
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @param {Object} finalState - final interview state
   *   - stage, final_score, completion_time, all conversation
   * @returns {Promise<Object>} snapshot metadata
   */
  async generatePostInterviewSnapshot(userId, interviewId, finalState) {
    const timestamp = Date.now();
    const checksum = this._generateChecksum(finalState);

    const snapshot = {
      snapshot_id: `snapshot_${interviewId}_${timestamp}`,
      user_id: userId,
      interview_id: interviewId,
      timestamp,
      checksum, // Immutable marker
      completion_status: finalState.completionStatus || 'completed',
      final_stage: finalState.stage || 'feedback',
      final_score: finalState.finalScore || 0,
      completion_time_seconds: finalState.completionTimeSeconds || 0,
      total_turns: finalState.turns || 0,
      total_questions: finalState.totalQuestions || 0,
      interview_type: finalState.interviewType || 'technical',
      // Full analytics payload (immutable)
      full_state: {
        conversation: finalState.conversation || [],
        question_history: finalState.questionHistory || [],
        score_breakdown: finalState.scoreBreakdown || {},
        feedback: finalState.feedback || [],
      },
      // Metadata
      metadata: {
        is_completed: finalState.completionStatus === 'completed',
        was_resumed: finalState.isResumed || false,
        had_aborts: finalState.abortCount || 0,
        created_at: timestamp,
      },
    };

    // Store snapshot in Redis (immutable for 30 days)
    const key = this._getSnapshotKey(userId, interviewId);
    await this.redis.set(
      key,
      JSON.stringify(snapshot),
      'EX',
      this.SNAPSHOT_TTL
    );

    return {
      snapshot_id: snapshot.snapshot_id,
      status: 'snapshot_created',
      immutable_until: new Date(timestamp + this.SNAPSHOT_TTL * 1000).toISOString(),
    };
  }

  /**
   * Retrieve post-interview snapshot (for analytics/review)
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @returns {Promise<Object|null>} snapshot if exists
   */
  async getPostInterviewSnapshot(userId, interviewId) {
    const key = this._getSnapshotKey(userId, interviewId);
    const data = await this.redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  /**
   * Clear abort state (after successful resume or final completion)
   * @param {string} userId - user ID
   * @param {string} interviewId - interview ID
   * @returns {Promise<boolean>} true if deleted
   */
  async clearAbortState(userId, interviewId) {
    const key = this._getAbortStateKey(userId, interviewId);
    const result = await this.redis.del(key);
    return result > 0;
  }

  /**
   * List all resumable interviews for a user
   * @param {string} userId - user ID
   * @returns {Promise<Array>} array of resumable interviews
   */
  async listResumableInterviews(userId) {
    // Scan Redis for keys matching pattern
    const pattern = this._getAbortStateKey(userId, '*');
    let cursor = '0';
    const resumableInterviews = [];

    do {
      const reply = await this.redis.scan(cursor, 'MATCH', pattern);
      cursor = reply[0];
      const keys = reply[1];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const state = JSON.parse(data);
          resumableInterviews.push({
            interview_id: state.interview_id,
            stage: state.state.stage,
            turns: state.state.turns,
            aborted_at: new Date(state.timestamp).toISOString(),
            resume_indicator: state.resume_indicator,
          });
        }
      }
    } while (cursor !== '0');

    return resumableInterviews;
  }

  /**
   * Validate resume integrity
   * Checks if resume state hasn't been tampered with
   * @param {Object} abortState - abort state from getAbortState
   * @param {Object} resumeAttempt - any new data being merged
   * @returns {boolean} true if state is valid and untampered
   */
  validateResumeIntegrity(abortState, resumeAttempt = {}) {
    if (!abortState) return false;

    // Check checksum
    const calculatedChecksum = this._generateChecksum(abortState.state);
    if (calculatedChecksum !== abortState.checksum) {
      return false; // State was modified
    }

    // Check if resume attempt tries to modify immutable fields
    const immutableFields = ['current_scores', 'question_history', 'turns'];
    for (const field of immutableFields) {
      if (resumeAttempt[field] && JSON.stringify(resumeAttempt[field]) !== JSON.stringify(abortState.state[field])) {
        return false; // Attempt to change immutable field
      }
    }

    return true;
  }

  /**
   * Build user-facing resume indicator message
   * "You were at Stage 3 (Follow-up), scored 72% so far across 5 questions"
   * @private
   */
  _buildResumeIndicator(state) {
    const stageName = state.stage || 'unknown';
    const avgScore = state.scores && state.scores.length > 0
      ? Math.round(state.scores.reduce((a, b) => a + b, 0) / state.scores.length)
      : 0;
    const turnCount = state.turns || 0;

    return `You were at Stage ${stageName}, scored ${avgScore}% so far across ${turnCount} question${turnCount !== 1 ? 's' : ''}.`;
  }

  /**
   * Generate checksum for state validation
   * @private
   */
  _generateChecksum(state) {
    // Hash selective fields to prevent tampering
    const checksum = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        turns: state.turns,
        current_scores: state.current_scores || state.scores,
        question_history: state.question_history || state.questionHistory,
      }))
      .digest('hex');

    return checksum;
  }

  /**
   * Get Redis key for abort state
   * @private
   */
  _getAbortStateKey(userId, interviewId) {
    return `interview:abort:${userId}:${interviewId}`;
  }

  /**
   * Get Redis key for snapshot
   * @private
   */
  _getSnapshotKey(userId, interviewId) {
    return `interview:snapshot:${userId}:${interviewId}`;
  }
}
