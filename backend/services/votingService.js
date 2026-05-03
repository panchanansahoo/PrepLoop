// Phase 5.1: Voting Service
// Manages upvotes and downvotes for solutions

import { supabaseAdmin } from '../db/supabaseClient.js';

class VotingService {
  /**
   * Record or update a vote on a solution
   * @param {string} userId - User ID
   * @param {string} solutionId - Solution ID
   * @param {number} voteValue - -1 (downvote) | 0 (remove vote) | 1 (upvote)
   * @returns {Promise<{upvotes, downvotes, userVote}>}
   */
  async vote(userId, solutionId, voteValue) {
    if (!userId || !solutionId) {
      throw new Error('userId and solutionId are required');
    }

    if (![- 1, 0, 1].includes(voteValue)) {
      throw new Error('voteValue must be -1 (downvote), 0 (remove), or 1 (upvote)');
    }

    // Check if solution exists
    const { data: solution, error: solError } = await supabaseAdmin
      .from('solution_submissions')
      .select('id')
      .eq('id', solutionId)
      .single();

    if (solError) throw new Error(`Solution not found: ${solError.message}`);

    try {
      // Check if vote already exists
      const { data: existingVote, error: fetchError } = await supabaseAdmin
        .from('solution_votes')
        .select('*')
        .eq('user_id', userId)
        .eq('solution_id', solutionId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (voteValue === 0) {
        // Remove vote
        if (existingVote) {
          await supabaseAdmin
            .from('solution_votes')
            .delete()
            .eq('user_id', userId)
            .eq('solution_id', solutionId);
        }
      } else if (existingVote) {
        // Update existing vote
        await supabaseAdmin
          .from('solution_votes')
          .update({ vote_value: voteValue, updated_at: new Date() })
          .eq('user_id', userId)
          .eq('solution_id', solutionId);
      } else {
        // Insert new vote
        await supabaseAdmin
          .from('solution_votes')
          .insert({
            user_id: userId,
            solution_id: solutionId,
            vote_value: voteValue,
          });
      }

      // Return updated vote counts
      return await this.getVotes(solutionId, userId);
    } catch (error) {
      throw new Error(`Failed to record vote: ${error.message}`);
    }
  }

  /**
   * Remove a vote (convenience method for vote(..., 0))
   * @param {string} userId - User ID
   * @param {string} solutionId - Solution ID
   * @returns {Promise<{upvotes, downvotes, userVote}>}
   */
  async removeVote(userId, solutionId) {
    return this.vote(userId, solutionId, 0);
  }

  /**
   * Get vote counts for a solution
   * @param {string} solutionId - Solution ID
   * @param {string} userId - User ID (optional, for user's current vote)
   * @returns {Promise<{upvotes, downvotes, userVote, total}>}
   */
  async getVotes(solutionId, userId = null) {
    if (!solutionId) throw new Error('solutionId is required');

    const { data: votes, error } = await supabaseAdmin
      .from('solution_votes')
      .select('vote_value')
      .eq('solution_id', solutionId);

    if (error) throw new Error(`Failed to fetch votes: ${error.message}`);

    const upvotes = votes?.filter((v) => v.vote_value === 1).length || 0;
    const downvotes = votes?.filter((v) => v.vote_value === -1).length || 0;

    let userVote = 0;
    if (userId) {
      const { data: userVoteData, error: userVoteError } = await supabaseAdmin
        .from('solution_votes')
        .select('vote_value')
        .eq('user_id', userId)
        .eq('solution_id', solutionId)
        .maybeSingle();

      if (!userVoteError && userVoteData) {
        userVote = userVoteData.vote_value;
      }
    }

    return {
      upvotes,
      downvotes,
      userVote,
      total: upvotes - downvotes,
    };
  }

  /**
   * Get top solutions by vote count for a problem
   * @param {number} problemId - Problem ID
   * @param {number} limit - Number of solutions to return
   * @returns {Promise<array of solutions with vote counts>}
   */
  async getTopSolutionsByVotes(problemId, limit = 10) {
    if (!problemId) throw new Error('problemId is required');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    const { data: solutions, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, language, code_length, created_at,
        solution_insights(efficiency_score, code_quality_score),
        solution_votes(vote_value)
      `)
      .eq('problem_id', problemId)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .limit(limit * 2); // Fetch more to account for voting

    if (error) throw new Error(`Failed to fetch solutions: ${error.message}`);

    // Calculate vote totals and sort
    const withVotes = solutions.map((sol) => {
      const upvotes = sol.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
      const downvotes = sol.solution_votes?.filter((v) => v.vote_value === -1).length || 0;
      return {
        id: sol.id,
        userId: sol.user_id,
        language: sol.language,
        codeLength: sol.code_length,
        efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
        upvotes,
        downvotes,
        voteTotal: upvotes - downvotes,
        createdAt: sol.created_at,
      };
    });

    // Sort by vote total (highest first) and return top N
    return withVotes
      .sort((a, b) => b.voteTotal - a.voteTotal)
      .slice(0, limit);
  }

  /**
   * Get vote breakdown statistics for a solution
   * @param {string} solutionId - Solution ID
   * @returns {Promise<{upvotes, downvotes, total, ratio, voteCount}>}
   */
  async getVoteStats(solutionId) {
    if (!solutionId) throw new Error('solutionId is required');

    const { data: votes, error } = await supabaseAdmin
      .from('solution_votes')
      .select('vote_value')
      .eq('solution_id', solutionId);

    if (error) throw new Error(`Failed to fetch vote stats: ${error.message}`);

    const upvotes = votes?.filter((v) => v.vote_value === 1).length || 0;
    const downvotes = votes?.filter((v) => v.vote_value === -1).length || 0;
    const total = upvotes + downvotes;

    return {
      upvotes,
      downvotes,
      total,
      ratio: total > 0 ? (upvotes / total) * 100 : 0,
      voteCount: total,
    };
  }
}

export default new VotingService();
