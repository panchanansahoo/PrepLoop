// Phase 5.1: Solution Sharing Service
// Core CRUD operations for user-submitted solutions

import { supabaseAdmin } from '../db/supabaseClient.js';

class SolutionSharingService {
  /**
   * Submit a new solution for a problem
   * @param {string} userId - User ID
   * @param {number} problemId - Problem ID
   * @param {string} code - Solution code
   * @param {string} language - Programming language (e.g., 'javascript')
   * @param {string} visibility - 'public' | 'private' | 'unlisted'
   * @param {number} executionTimeMs - Execution time in milliseconds (optional)
   * @param {number} memoryMb - Memory usage in MB (optional)
   * @returns {Promise<{id, problemId, language, visibility, insights}>}
   */
  async submitSolution(userId, problemId, code, language = 'javascript', visibility = 'public', executionTimeMs = null, memoryMb = null) {
    if (!userId || !problemId || !code) {
      throw new Error('userId, problemId, and code are required');
    }

    if (!['public', 'private', 'unlisted'].includes(visibility)) {
      throw new Error('Invalid visibility: must be public, private, or unlisted');
    }

    const codeLength = code.length;

    try {
      const { data: solution, error } = await supabaseAdmin
        .from('solution_submissions')
        .insert({
          user_id: userId,
          problem_id: problemId,
          code,
          language,
          visibility,
          status: 'published',
          execution_time_ms: executionTimeMs,
          memory_mb: memoryMb,
          code_length: codeLength,
        })
        .select()
        .single();

      if (error) throw error;

      // Create placeholder insights
      await supabaseAdmin
        .from('solution_insights')
        .insert({
          solution_id: solution.id,
          approach: 'unknown',
          efficiency_score: 50,
          code_quality_score: 50,
          readability_score: 50,
        })
        .select()
        .single();

      return {
        id: solution.id,
        problemId: solution.problem_id,
        language: solution.language,
        visibility: solution.visibility,
        executionTimeMs: solution.execution_time_ms,
        memoryMb: solution.memory_mb,
        createdAt: solution.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to submit solution: ${error.message}`);
    }
  }

  /**
   * Get all solutions for a problem with optional filtering and sorting
   * @param {number} problemId - Problem ID
   * @param {object} options - {language, sortBy: 'votes'|'recent'|'efficiency', page, limit, userId}
   * @returns {Promise<{solutions, total, page, pageSize}>}
   */
  async getSolutionsByProblem(problemId, options = {}) {
    const {
      language = null,
      sortBy = 'recent',
      page = 1,
      limit = 10,
      userId = null,
    } = options;

    if (page < 1) throw new Error('Page must be >= 1');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    let query = supabaseAdmin
      .from('solution_submissions')
      .select(
        `
        id, user_id, problem_id, language, visibility, execution_time_ms, 
        memory_mb, code_length, created_at,
        solution_insights(efficiency_score, code_quality_score),
        solution_votes(count)
      `,
        { count: 'exact' }
      )
      .eq('problem_id', problemId)
      .eq('status', 'published');

    // Filter by visibility (only public by default, or owner's own solutions)
    if (userId) {
      query = query.or(`visibility.eq.public,and(visibility.eq.private,user_id.eq.${userId})`);
    } else {
      query = query.eq('visibility', 'public');
    }

    // Filter by language if specified
    if (language) {
      query = query.eq('language', language);
    }

    // Sort
    if (sortBy === 'votes') {
      query = query.order('id', { ascending: false }); // Will sort by vote count in code
    } else if (sortBy === 'efficiency') {
      query = query.order('id', { ascending: false }); // Will sort by efficiency in code
    } else {
      query = query.order('created_at', { ascending: false }); // Recent first
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: solutions, error, count } = await query;

    if (error) throw new Error(`Failed to fetch solutions: ${error.message}`);

    // Transform and sort results
    const transformed = solutions.map((sol) => ({
      id: sol.id,
      userId: sol.user_id,
      language: sol.language,
      visibility: sol.visibility,
      upvotes: sol.solution_votes?.[0]?.count || 0,
      commentCount: 0, // Will fetch separately if needed
      efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
      codeQuality: sol.solution_insights?.[0]?.code_quality_score || 50,
      codeLength: sol.code_length,
      executionTimeMs: sol.execution_time_ms,
      createdAt: sol.created_at,
    }));

    // Sort by selected criteria
    if (sortBy === 'votes') {
      transformed.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sortBy === 'efficiency') {
      transformed.sort((a, b) => b.efficiency - a.efficiency);
    }

    return {
      solutions: transformed,
      total: count || 0,
      page,
      pageSize: limit,
    };
  }

  /**
   * Get a single solution by ID with full details
   * @param {string} solutionId - Solution ID
   * @param {string} userId - Current user ID (for authorization)
   * @returns {Promise<{id, code, language, insights, votes, visibility, authorId, createdAt}>}
   */
  async getSolution(solutionId, userId = null) {
    if (!solutionId) throw new Error('solutionId is required');

    const { data: solution, error: solError } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, problem_id, code, language, visibility, 
        execution_time_ms, memory_mb, code_length, created_at,
        solution_insights(approach, time_complexity, space_complexity, efficiency_score, code_quality_score, readability_score)
      `)
      .eq('id', solutionId)
      .single();

    if (solError) throw new Error(`Solution not found: ${solError.message}`);

    // Check authorization
    const isPublic = solution.visibility === 'public';
    const isOwner = solution.user_id === userId;
    if (!isPublic && !isOwner) {
      throw new Error('Not authorized to view this solution');
    }

    // Get vote count
    const { data: votes, error: voteError } = await supabaseAdmin
      .from('solution_votes')
      .select('vote_value')
      .eq('solution_id', solutionId);

    if (voteError) throw new Error(`Failed to fetch votes: ${voteError.message}`);

    const upvotes = votes?.filter((v) => v.vote_value === 1).length || 0;
    const downvotes = votes?.filter((v) => v.vote_value === -1).length || 0;
    const userVote = userId
      ? votes?.find((v) => v.user_id === userId)?.vote_value || 0
      : 0;

    return {
      id: solution.id,
      userId: solution.user_id,
      problemId: solution.problem_id,
      code: solution.code,
      language: solution.language,
      visibility: solution.visibility,
      executionTimeMs: solution.execution_time_ms,
      memoryMb: solution.memory_mb,
      codeLength: solution.code_length,
      createdAt: solution.created_at,
      insights: solution.solution_insights?.[0] || {},
      votes: {
        upvotes,
        downvotes,
        userVote,
      },
    };
  }

  /**
   * Update solution visibility
   * @param {string} solutionId - Solution ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} newVisibility - 'public' | 'private' | 'unlisted'
   * @returns {Promise<{id, visibility}>}
   */
  async updateSolutionVisibility(solutionId, userId, newVisibility) {
    if (!['public', 'private', 'unlisted'].includes(newVisibility)) {
      throw new Error('Invalid visibility: must be public, private, or unlisted');
    }

    // Check ownership
    const { data: solution, error: fetchError } = await supabaseAdmin
      .from('solution_submissions')
      .select('user_id')
      .eq('id', solutionId)
      .single();

    if (fetchError) throw new Error(`Solution not found: ${fetchError.message}`);
    if (solution.user_id !== userId) {
      throw new Error('Only the solution owner can update visibility');
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('solution_submissions')
      .update({ visibility: newVisibility, updated_at: new Date() })
      .eq('id', solutionId)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update visibility: ${updateError.message}`);

    return {
      id: updated.id,
      visibility: updated.visibility,
    };
  }

  /**
   * Soft delete a solution (change status to 'deleted')
   * @param {string} solutionId - Solution ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<{id, status}>}
   */
  async deleteSolution(solutionId, userId) {
    // Check ownership
    const { data: solution, error: fetchError } = await supabaseAdmin
      .from('solution_submissions')
      .select('user_id')
      .eq('id', solutionId)
      .single();

    if (fetchError) throw new Error(`Solution not found: ${fetchError.message}`);
    if (solution.user_id !== userId) {
      throw new Error('Only the solution owner can delete this solution');
    }

    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from('solution_submissions')
      .update({ status: 'deleted', updated_at: new Date() })
      .eq('id', solutionId)
      .select()
      .single();

    if (deleteError) throw new Error(`Failed to delete solution: ${deleteError.message}`);

    return {
      id: deleted.id,
      status: deleted.status,
    };
  }

  /**
   * Search solutions by multiple criteria
   * @param {object} filters - {problemId, language, approach, minEfficiency, sortBy, limit}
   * @returns {Promise<{solutions, filters_applied, total}>}
   */
  async searchSolutions(filters = {}) {
    const {
      problemId = null,
      language = null,
      approach = null,
      minEfficiency = 0,
      sortBy = 'recent',
      limit = 20,
    } = filters;

    let query = supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, problem_id, language, visibility, code_length, created_at,
        solution_insights(approach, efficiency_score),
        solution_votes(vote_value)
      `, { count: 'exact' })
      .eq('visibility', 'public')
      .eq('status', 'published');

    if (problemId) {
      query = query.eq('problem_id', problemId);
    }

    if (language) {
      query = query.eq('language', language);
    }

    // Apply efficiency filter
    query = query.gte('solution_insights.efficiency_score', minEfficiency);

    // Sort
    if (sortBy === 'votes') {
      query = query.order('id', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data: solutions, error, count } = await query;

    if (error) throw new Error(`Search failed: ${error.message}`);

    // Filter by approach if specified
    let filtered = solutions;
    if (approach) {
      filtered = solutions.filter((s) => s.solution_insights?.[0]?.approach === approach);
    }

    // Sort by votes if requested
    if (sortBy === 'votes') {
      filtered.sort((a, b) => {
        const aVotes = a.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
        const bVotes = b.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
        return bVotes - aVotes;
      });
    }

    return {
      solutions: filtered.map((s) => ({
        id: s.id,
        language: s.language,
        approach: s.solution_insights?.[0]?.approach,
        efficiency: s.solution_insights?.[0]?.efficiency_score,
        codeLength: s.code_length,
        upvotes: s.solution_votes?.filter((v) => v.vote_value === 1).length || 0,
      })),
      filters_applied: {
        problemId,
        language,
        approach,
        minEfficiency,
      },
      total: count || 0,
    };
  }
}

export default new SolutionSharingService();
