// Phase 5.1: Discussion Service
// Manages threaded discussions and comments on solutions

import { supabaseAdmin } from '../db/supabaseClient.js';

class DiscussionService {
  /**
   * Create a new root discussion thread on a solution
   * @param {string} solutionId - Solution ID
   * @param {string} userId - User ID
   * @param {string} comment - Comment text
   * @returns {Promise<{id, solutionId, userId, comment, likes, createdAt}>}
   */
  async createDiscussion(solutionId, userId, comment) {
    if (!solutionId || !userId || !comment) {
      throw new Error('solutionId, userId, and comment are required');
    }

    if (comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    if (comment.length > 5000) {
      throw new Error('Comment is too long (max 5000 characters)');
    }

    // Check if solution exists
    const { data: solution, error: solError } = await supabaseAdmin
      .from('solution_submissions')
      .select('id')
      .eq('id', solutionId)
      .single();

    if (solError) throw new Error(`Solution not found: ${solError.message}`);

    try {
      const { data: discussion, error } = await supabaseAdmin
        .from('solution_discussions')
        .insert({
          solution_id: solutionId,
          user_id: userId,
          comment: comment.trim(),
          thread_id: null, // Root thread
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: discussion.id,
        solutionId: discussion.solution_id,
        userId: discussion.user_id,
        comment: discussion.comment,
        likes: discussion.likes,
        createdAt: discussion.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to create discussion: ${error.message}`);
    }
  }

  /**
   * Reply to an existing discussion thread
   * @param {string} solutionId - Solution ID
   * @param {string} threadId - Parent thread ID
   * @param {string} userId - User ID
   * @param {string} comment - Reply text
   * @returns {Promise<{id, threadId, userId, comment, likes, createdAt}>}
   */
  async replyToDiscussion(solutionId, threadId, userId, comment) {
    if (!solutionId || !threadId || !userId || !comment) {
      throw new Error('solutionId, threadId, userId, and comment are required');
    }

    if (comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    if (comment.length > 5000) {
      throw new Error('Comment is too long (max 5000 characters)');
    }

    // Check if thread exists
    const { data: parentThread, error: threadError } = await supabaseAdmin
      .from('solution_discussions')
      .select('id')
      .eq('id', threadId)
      .eq('solution_id', solutionId);

    if (threadError || !parentThread || parentThread.length === 0) {
      throw new Error(`Thread not found: ${threadError?.message || 'No matching thread'}`);
    }

    try {
      const { data: reply, error } = await supabaseAdmin
        .from('solution_discussions')
        .insert({
          solution_id: solutionId,
          thread_id: threadId,
          user_id: userId,
          comment: comment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: reply.id,
        threadId: reply.thread_id,
        userId: reply.user_id,
        comment: reply.comment,
        likes: reply.likes,
        createdAt: reply.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to reply: ${error.message}`);
    }
  }

  /**
   * Get discussions for a solution with optional sorting
   * @param {string} solutionId - Solution ID
   * @param {object} options - {sortBy: 'recent'|'likes', limit, offset}
   * @returns {Promise<{discussions: array, total}>}
   */
  async getDiscussions(solutionId, options = {}) {
    const {
      sortBy = 'recent',
      limit = 20,
      offset = 0,
    } = options;

    if (!solutionId) throw new Error('solutionId is required');
    if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100');
    if (offset < 0) throw new Error('Offset must be >= 0');

    let query = supabaseAdmin
      .from('solution_discussions')
      .select('*', { count: 'exact' })
      .eq('solution_id', solutionId)
      .is('thread_id', null); // Only root discussions

    // Sort
    if (sortBy === 'likes') {
      query = query.order('likes', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: discussions, error, count } = await query;

    if (error) throw new Error(`Failed to fetch discussions: ${error.message}`);

    // For each root discussion, fetch replies
    const result = [];
    for (const discussion of discussions) {
      const { data: replies, error: repliesError } = await supabaseAdmin
        .from('solution_discussions')
        .select('*')
        .eq('thread_id', discussion.id)
        .order('created_at', { ascending: true });

      if (repliesError) console.error(`Failed to fetch replies: ${repliesError.message}`);

      result.push({
        id: discussion.id,
        solutionId: discussion.solution_id,
        userId: discussion.user_id,
        comment: discussion.comment,
        likes: discussion.likes,
        createdAt: discussion.created_at,
        replies: (replies || []).map((r) => ({
          id: r.id,
          userId: r.user_id,
          comment: r.comment,
          likes: r.likes,
          createdAt: r.created_at,
        })),
      });
    }

    return {
      discussions: result,
      total: count || 0,
    };
  }

  /**
   * Like a comment
   * @param {string} commentId - Discussion/comment ID
   * @returns {Promise<{id, likes}>}
   */
  async likeComment(commentId) {
    if (!commentId) throw new Error('commentId is required');

    try {
      // Increment likes
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('solution_discussions')
        .select('likes')
        .eq('id', commentId)
        .single();

      if (fetchError) throw fetchError;

      const newLikes = (current.likes || 0) + 1;

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('solution_discussions')
        .update({ likes: newLikes, updated_at: new Date() })
        .eq('id', commentId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        id: updated.id,
        likes: updated.likes,
      };
    } catch (error) {
      throw new Error(`Failed to like comment: ${error.message}`);
    }
  }

  /**
   * Get discussion count for a solution
   * @param {string} solutionId - Solution ID
   * @returns {Promise<number>}
   */
  async getDiscussionCount(solutionId) {
    if (!solutionId) throw new Error('solutionId is required');

    const { data: discussions, error, count } = await supabaseAdmin
      .from('solution_discussions')
      .select('*', { count: 'exact' })
      .eq('solution_id', solutionId)
      .is('thread_id', null);

    if (error) throw new Error(`Failed to count discussions: ${error.message}`);

    return count || 0;
  }

  /**
   * Get a single discussion thread with all replies
   * @param {string} threadId - Thread ID
   * @returns {Promise<{id, comment, userId, likes, replies}>}
   */
  async getThread(threadId) {
    if (!threadId) throw new Error('threadId is required');

    const { data: thread, error } = await supabaseAdmin
      .from('solution_discussions')
      .select('*')
      .eq('id', threadId)
      .single();

    if (error) throw new Error(`Thread not found: ${error.message}`);

    // Fetch replies
    const { data: replies, error: repliesError } = await supabaseAdmin
      .from('solution_discussions')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (repliesError) console.error(`Failed to fetch replies: ${repliesError.message}`);

    return {
      id: thread.id,
      comment: thread.comment,
      userId: thread.user_id,
      likes: thread.likes,
      createdAt: thread.created_at,
      replies: (replies || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        comment: r.comment,
        likes: r.likes,
        createdAt: r.created_at,
      })),
    };
  }
}

export default new DiscussionService();
