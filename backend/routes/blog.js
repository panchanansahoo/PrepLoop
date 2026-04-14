import express from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import multer from 'multer';
import pdf from 'pdf-parse';
import { simpleParser } from 'mailparser';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const isBlogPostsTableMissing = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return code === '42P01' || (message.includes('relation') && message.includes('blog_posts'));
};

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isLowerAlphaNumeric = (char) => {
  const code = char.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
};

const isValidSlug = (slug) => {
  if (typeof slug !== 'string' || slug.length === 0) return false;
  if (slug.startsWith('-') || slug.endsWith('-')) return false;

  let prevHyphen = false;
  for (const ch of slug) {
    if (ch === '-') {
      if (prevHyphen) return false;
      prevHyphen = true;
      continue;
    }

    if (!isLowerAlphaNumeric(ch)) return false;
    prevHyphen = false;
  }

  return true;
};

// ─── ADMIN BLOG POST MANAGEMENT ────────────────────────────────────
// These must be registered BEFORE the wildcard /:slug route

router.get('/admin/posts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from('blog_posts').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      posts: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    if (isBlogPostsTableMissing(error)) {
      return res.json({
        posts: [],
        pagination: { page: parsePositiveInt(req.query.page, 1), limit: parsePositiveInt(req.query.limit, 10), total: 0, totalPages: 0 },
        warning: 'blog_posts table is not available yet. Run migration_blog_posts.sql.',
      });
    }
    console.error('Failed to fetch blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('blog_posts').select('*').eq('id', id).single();
    if (error || !data) return res.status(404).json({ error: 'Blog post not found' });
    res.json(data);
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/admin/posts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, slug, content, excerpt, featured_image_url, status = 'draft' } = req.body;
    const admin_id = req.user.id;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Missing required fields: title, slug, content' });
    }
    const slugStr = String(slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugStr)) {
      return res.status(400).json({ error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' });
    }

    const { data: existing } = await supabaseAdmin.from('blog_posts').select('id').eq('slug', slugStr).single();
    if (existing) return res.status(409).json({ error: 'Slug already exists' });

    const published_at = status === 'published' ? new Date().toISOString() : null;
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({ admin_id, title, slug: slugStr, content, excerpt: excerpt || null, featured_image_url: featured_image_url || null, status, published_at })
      .select().single();

    if (error) throw error;
    res.status(201).json({ message: 'Blog post created successfully', post: data });
  } catch (error) {
    console.error('Failed to create blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, content, excerpt, featured_image_url, status } = req.body;

    const { data: currentPost, error: fetchError } = await supabaseAdmin.from('blog_posts').select('*').eq('id', id).single();
    if (fetchError || !currentPost) return res.status(404).json({ error: 'Blog post not found' });

    const updateData = { updated_at: new Date().toISOString() };
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url || null;
    if (status) updateData.status = status;
    if (status === 'published' && currentPost.status !== 'published') {
      updateData.published_at = new Date().toISOString();
    }

    if (slug && slug !== currentPost.slug) {
      if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'Invalid slug format.' });
      }
      const { data: existing } = await supabaseAdmin.from('blog_posts').select('id').eq('slug', slug).neq('id', id).single();
      if (existing) return res.status(409).json({ error: 'Slug already exists' });
      updateData.slug = slug;
    }

    const { data, error } = await supabaseAdmin.from('blog_posts').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: 'Blog post updated successfully', post: data });
  } catch (error) {
    console.error('Failed to update blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/admin/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: post, error: fetchError } = await supabaseAdmin.from('blog_posts').select('id').eq('id', id).single();
    if (fetchError || !post) return res.status(404).json({ error: 'Blog post not found' });

    const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

router.patch('/admin/posts/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: 'Blog post published successfully', post: data });
  } catch (error) {
    console.error('Failed to publish blog post:', error);
    res.status(500).json({ error: 'Failed to publish blog post' });
  }
});

router.patch('/admin/posts/:id/archive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json({ message: 'Blog post archived successfully', post: data });
  } catch (error) {
    console.error('Failed to archive blog post:', error);
    res.status(500).json({ error: 'Failed to archive blog post' });
  }
});

// ─── PUBLIC BLOG POSTS ──────────────────────────────────────────────

router.get('/public/posts', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      posts: data || [],
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    if (isBlogPostsTableMissing(error)) {
      return res.json({
        posts: [],
        pagination: { page: parsePositiveInt(req.query.page, 1), limit: parsePositiveInt(req.query.limit, 10), total: 0, totalPages: 0 },
        warning: 'blog_posts table is not available yet. Run migration_blog_posts.sql.',
      });
    }
    console.error('Failed to fetch published blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/public/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabaseAdmin
      .from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').single();

    if (error || !data) return res.status(404).json({ error: 'Blog post not found' });

    // Fix: use atomic RPC increment instead of read-then-write race condition
    await supabaseAdmin.rpc('increment_field', { table_name: 'blog_posts', field_name: 'view_count', row_id: data.id })
      .catch(() => {
        // If RPC is unavailable, skip increment rather than perform a stale read-modify-write.
        console.warn('increment_field RPC unavailable; skipping non-atomic view counter update');
      });

    res.json(data);
  } catch (error) {
    if (isBlogPostsTableMissing(error)) return res.status(404).json({ error: 'Blog post not found' });
    console.error('Failed to fetch blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// ─── PARSE ENDPOINTS ────────────────────────────────────────────────

router.post('/parse-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    const data = await pdf(req.file.buffer);
    res.json({ text: data.text });
  } catch (error) {
    console.error('PDF Parse Error:', error);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

router.post('/parse-eml', upload.single('eml'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No EML file uploaded' });
    const parsed = await simpleParser(req.file.buffer);
    const content = parsed.html || parsed.textAsHtml || parsed.text;
    res.json({ title: parsed.subject, content });
  } catch (error) {
    console.error('EML Parse Error:', error);
    res.status(500).json({ error: 'Failed to parse EML' });
  }
});

// ─── LEGACY BLOG ROUTES (blogs table) ──────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select('*, author:author_id(id, full_name, avatar_url)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, category, cover_image } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .insert({ title, slug, content, author_id: req.user.id, category, cover_image })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fix: /:slug wildcard is last to avoid shadowing /admin/*, /public/*, /parse-*
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabaseAdmin
      .from('blogs')
      .select('*, author:author_id(id, full_name, avatar_url)')
      .eq('slug', slug).single();
    if (error) throw error;
    // Atomic view increment via RPC; ignore errors
    await supabaseAdmin.rpc('increment_blog_view', { blog_id: data.id }).catch(() => {});
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: 'Blog not found' });
  }
});

export default router;
