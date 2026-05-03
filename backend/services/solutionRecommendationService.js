// Phase 5.1: Solution Recommendation Service
// Provides recommendations for related and trending solutions

import { supabaseAdmin } from '../db/supabaseClient.js';

class SolutionRecommendationService {
  /**
   * Get related solutions for a given solution (same problem, other approaches)
   * @param {string} solutionId - Solution ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<array of solutions>}
   */
  async getRelatedSolutions(solutionId, limit = 5) {
    if (!solutionId) throw new Error('solutionId is required');
    if (limit < 1 || limit > 50) throw new Error('Limit must be between 1 and 50');

    // Get the source solution
    const { data: sourceSolution, error: sourceError } = await supabaseAdmin
      .from('solution_submissions')
      .select('problem_id, language, solution_insights(approach)')
      .eq('id', solutionId)
      .single();

    if (sourceError) throw new Error(`Source solution not found: ${sourceError.message}`);

    // Find other solutions for the same problem with different approaches
    const { data: relatedSolutions, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, language, code_length, created_at,
        solution_insights(approach, efficiency_score),
        solution_votes(vote_value)
      `)
      .eq('problem_id', sourceSolution.problem_id)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .neq('id', solutionId)
      .limit(limit * 3); // Fetch more to account for filtering

    if (error) throw new Error(`Failed to fetch related solutions: ${error.message}`);

    // Filter and rank by approach diversity
    const grouped = {};
    for (const sol of relatedSolutions) {
      const approach = sol.solution_insights?.[0]?.approach || 'unknown';
      if (!grouped[approach]) {
        grouped[approach] = [];
      }
      grouped[approach].push(sol);
    }

    // Select top solution per approach
    const recommendations = [];
    for (const approach in grouped) {
      if (approach !== (sourceSolution.solution_insights?.[0]?.approach || 'unknown')) {
        // Sort by votes and take top 1
        const sorted = grouped[approach].sort((a, b) => {
          const aVotes = a.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
          const bVotes = b.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
          return bVotes - aVotes;
        });

        if (sorted[0]) {
          recommendations.push({
            id: sorted[0].id,
            approach: approach,
            language: sorted[0].language,
            codeLength: sorted[0].code_length,
            efficiency: sorted[0].solution_insights?.[0]?.efficiency_score || 50,
            upvotes: sorted[0].solution_votes?.filter((v) => v.vote_value === 1).length || 0,
            reason: `Alternative ${approach} approach`,
          });
        }
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Get solutions with a specific approach for a problem
   * @param {number} problemId - Problem ID
   * @param {string} approach - Approach type (e.g., 'recursive', 'dp', 'bfs')
   * @param {number} limit - Number to return
   * @returns {Promise<array of solutions>}
   */
  async getSolutionsByApproach(problemId, approach, limit = 10) {
    if (!problemId || !approach) {
      throw new Error('problemId and approach are required');
    }

    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    const { data: solutions, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, language, code_length, created_at,
        solution_insights(approach, efficiency_score, code_quality_score),
        solution_votes(vote_value)
      `)
      .eq('problem_id', problemId)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .eq('solution_insights.approach', approach)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch solutions: ${error.message}`);

    return solutions.map((sol) => ({
      id: sol.id,
      userId: sol.user_id,
      language: sol.language,
      approach: approach,
      codeLength: sol.code_length,
      efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
      codeQuality: sol.solution_insights?.[0]?.code_quality_score || 50,
      upvotes: sol.solution_votes?.filter((v) => v.vote_value === 1).length || 0,
      createdAt: sol.created_at,
    }));
  }

  /**
   * Get trending solutions across all problems in a time range
   * @param {string} timeRange - '24h' | '7d' | '30d'
   * @param {number} limit - Number of solutions
   * @returns {Promise<array of trending solutions>}
   */
  async getTrendingSolutions(timeRange = '7d', limit = 20) {
    if (!['24h', '7d', '30d'].includes(timeRange)) {
      throw new Error("timeRange must be '24h', '7d', or '30d'");
    }

    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    const now = new Date();
    let cutoffDate;

    if (timeRange === '24h') {
      cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data: solutions, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, problem_id, language, created_at,
        solution_insights(approach, efficiency_score),
        solution_votes(vote_value)
      `)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit * 3); // Fetch more to sort by votes

    if (error) throw new Error(`Failed to fetch trending solutions: ${error.message}`);

    // Sort by vote count
    const withVotes = solutions.map((sol) => {
      const upvotes = sol.solution_votes?.filter((v) => v.vote_value === 1).length || 0;
      const downvotes = sol.solution_votes?.filter((v) => v.vote_value === -1).length || 0;
      return {
        id: sol.id,
        userId: sol.user_id,
        problemId: sol.problem_id,
        language: sol.language,
        approach: sol.solution_insights?.[0]?.approach || 'unknown',
        efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
        upvotes,
        downvotes,
        voteTotal: upvotes - downvotes,
        createdAt: sol.created_at,
      };
    });

    return withVotes
      .sort((a, b) => b.voteTotal - a.voteTotal || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Get most efficient solutions for a problem
   * @param {number} problemId - Problem ID
   * @param {number} limit - Number of solutions
   * @returns {Promise<array of efficient solutions>}
   */
  async getMostEfficientSolutions(problemId, limit = 10) {
    if (!problemId) throw new Error('problemId is required');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    const { data: solutions, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, language, code_length, created_at,
        solution_insights(approach, efficiency_score, time_complexity, space_complexity),
        solution_votes(vote_value)
      `)
      .eq('problem_id', problemId)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .order('solution_insights.efficiency_score', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch solutions: ${error.message}`);

    return solutions.map((sol) => ({
      id: sol.id,
      userId: sol.user_id,
      language: sol.language,
      approach: sol.solution_insights?.[0]?.approach || 'unknown',
      efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
      timeComplexity: sol.solution_insights?.[0]?.time_complexity || 'unknown',
      spaceComplexity: sol.solution_insights?.[0]?.space_complexity || 'unknown',
      upvotes: sol.solution_votes?.filter((v) => v.vote_value === 1).length || 0,
      createdAt: sol.created_at,
    }));
  }

  /**
   * Get recommendations for a user based on their solved problems
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<array of problem solutions>}
   */
  async getRecommendationsForUser(userId, limit = 10) {
    if (!userId) throw new Error('userId is required');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');

    // Get user's solved problems (from their own submissions)
    const { data: userSolutions, error: userError } = await supabaseAdmin
      .from('solution_submissions')
      .select('problem_id')
      .eq('user_id', userId)
      .eq('status', 'published');

    if (userError) throw new Error(`Failed to fetch user solutions: ${userError.message}`);

    const solvedProblemIds = userSolutions.map((s) => s.problem_id);

    if (solvedProblemIds.length === 0) {
      // No solved problems, return trending solutions
      return this.getTrendingSolutions('7d', limit);
    }

    // Get top-voted solutions from same problems with different approaches
    const { data: recommendations, error } = await supabaseAdmin
      .from('solution_submissions')
      .select(`
        id, user_id, problem_id, language, code_length,
        solution_insights(approach, efficiency_score),
        solution_votes(vote_value)
      `)
      .in('problem_id', solvedProblemIds)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .neq('user_id', userId) // Exclude user's own solutions
      .limit(limit * 2);

    if (error) throw new Error(`Failed to fetch recommendations: ${error.message}`);

    // Sort by votes
    const sorted = recommendations
      .map((sol) => ({
        id: sol.id,
        problemId: sol.problem_id,
        approach: sol.solution_insights?.[0]?.approach || 'unknown',
        language: sol.language,
        efficiency: sol.solution_insights?.[0]?.efficiency_score || 50,
        upvotes: sol.solution_votes?.filter((v) => v.vote_value === 1).length || 0,
      }))
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit);

    return sorted;
  }
}

export default new SolutionRecommendationService();
