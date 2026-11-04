import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { createLogger } from '../utils/structuredLogger.js';

const router = express.Router();
const logger = createLogger('community');

// Rate limiting for community mutations to prevent spam & bot posting
const communityMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many posts or comments. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

const DANGEROUS_XSS_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|on\w+\s*=|data:text\/html/gi;

function sanitizeCommunityText(str = '') {
  if (typeof str !== 'string') return '';
  return str.replace(DANGEROUS_XSS_REGEX, '').trim();
}

router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { filter = 'trending' } = req.query;

    let query = supabaseAdmin
      .from('community_posts')
      .select(`
        *,
        profiles!community_posts_user_id_fkey(full_name)
      `)
      .limit(50);

    if (filter === 'popular') {
      query = query.order('likes', { ascending: false });
    } else if (filter === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    const postIds = (data || []).map((post) => post.id).filter((id) => id !== undefined && id !== null);
    let replyCountMap = new Map();

    if (postIds.length > 0) {
      const { data: replyRows, error: replyError } = await supabaseAdmin
        .from('community_replies')
        .select('post_id')
        .in('post_id', postIds);

      if (replyError) throw replyError;

      replyCountMap = (replyRows || []).reduce((acc, row) => {
        acc.set(row.post_id, (acc.get(row.post_id) || 0) + 1);
        return acc;
      }, new Map());
    }

    const posts = (data || []).map(p => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      content: p.content,
      tags: p.tags || [],
      likes: p.likes || 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
      author_name: p.profiles?.full_name || 'Anonymous',
      reply_count: replyCountMap.get(p.id) ?? p.replies ?? 0,
    }));

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/posts', authenticateToken, communityMutationLimiter, async (req, res) => {
  try {
    const rawTitle = String(req.body?.title || '').trim().slice(0, 300);
    const rawContent = String(req.body?.content || '').trim().slice(0, 10000);
    const title = sanitizeCommunityText(rawTitle);
    const content = sanitizeCommunityText(rawContent);
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.slice(0, 10).map((t) => sanitizeCommunityText(String(t)).slice(0, 50))
      : [];

    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const { data, error } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: req.user.id,
        title,
        content,
        tags,
        likes: 0,
        replies: 0
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ post: data });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/posts/:id', authenticateToken, communityMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('community_posts')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to edit this post' });
    }

    const updates = {};
    if (req.body?.title !== undefined) {
      updates.title = sanitizeCommunityText(String(req.body.title)).slice(0, 300);
    }
    if (req.body?.content !== undefined) {
      updates.content = sanitizeCommunityText(String(req.body.content)).slice(0, 10000);
    }
    if (Array.isArray(req.body?.tags)) {
      updates.tags = req.body.tags.slice(0, 10).map((t) => sanitizeCommunityText(String(t)).slice(0, 50));
    }
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('community_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json({ post: updated });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('community_posts')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('community_posts')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.post('/posts/:id/report', authenticateToken, communityMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const reason = sanitizeCommunityText(String(req.body?.reason || '')).slice(0, 500);

    const { data: post, error: fetchError } = await supabaseAdmin
      .from('community_posts')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info('COMMUNITY_POST_REPORTED', {
      postId: id,
      reportedBy: req.user.id,
      postAuthorId: post.user_id,
      reason: reason || 'Unspecified inappropriate content',
    });

    res.json({ success: true, message: 'Report submitted for moderator review.' });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

router.post('/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Deduplicate: check if user already liked this post
    const { data: existingLike, error: existingLikeError } = await supabaseAdmin
      .from('community_post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (existingLikeError && existingLikeError.code !== 'PGRST116') {
      throw existingLikeError;
    }

    if (existingLike) {
      return res.status(400).json({ error: 'You have already liked this post' });
    }

    // Record the like for deduplication
    const { error: likeError } = await supabaseAdmin
      .from('community_post_likes')
      .insert({ post_id: id, user_id: req.user.id });

    if (likeError) throw likeError;

    // Atomic increment via raw SQL to prevent race conditions
    const { error: updateError } = await supabaseAdmin.rpc('increment_field', {
      table_name: 'community_posts',
      field_name: 'likes',
      row_id: id
    });

    // Fallback if RPC doesn't exist yet — still better than non-atomic
    if (updateError) {
      const { data: post, error: fetchError } = await supabaseAdmin
        .from('community_posts')
        .select('likes')
        .eq('id', id)
        .maybeSingle();

      if (!fetchError && post) {
        const { error: fallbackError } = await supabaseAdmin
          .from('community_posts')
          .update({ likes: (post?.likes || 0) + 1 })
          .eq('id', id);

        if (fallbackError) {
          return res.status(500).json({ error: 'Failed to like post' });
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.post('/posts/:id/reply', authenticateToken, communityMutationLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const rawContent = String(req.body?.content || '').trim().slice(0, 4000);
    const content = sanitizeCommunityText(rawContent);

    if (!content || content.length === 0) {
      return res.status(400).json({ error: 'Reply content is required' });
    }

    const { error: replyError } = await supabaseAdmin
      .from('community_replies')
      .insert({
        post_id: id,
        user_id: req.user.id,
        content
      });

    if (replyError) throw replyError;

    // Atomic increment via raw SQL to prevent race conditions
    const { error: updateError } = await supabaseAdmin.rpc('increment_field', {
      table_name: 'community_posts',
      field_name: 'replies',
      row_id: id
    });

    // Fallback if RPC doesn't exist yet
    if (updateError) {
      const { data: post } = await supabaseAdmin
        .from('community_posts')
        .select('replies')
        .eq('id', id)
        .maybeSingle();
      await supabaseAdmin
        .from('community_posts')
        .update({ replies: (post?.replies || 0) + 1 })
        .eq('id', id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting reply:', error);
    res.status(500).json({ error: 'Failed to submit reply' });
  }
});

router.get('/posts/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('community_replies')
      .select('*, profiles(full_name)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const replies = (data || []).map(r => ({
      ...r,
      author_name: r.profiles?.full_name || 'Anonymous',
      profiles: undefined
    }));

    res.json({ replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

export default router;
