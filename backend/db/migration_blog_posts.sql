-- Migration: Add Blog Posts Table (Admin Only)
-- Created: 2026-04-01

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  view_count INTEGER DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_admin_id ON public.blog_posts(admin_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can insert/update/delete their own posts
DROP POLICY IF EXISTS blog_posts_admin_write ON public.blog_posts;
CREATE POLICY blog_posts_admin_write ON public.blog_posts
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Anyone can read published posts
DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Admins can read all posts (drafts, published, archived)
DROP POLICY IF EXISTS blog_posts_admin_read ON public.blog_posts;
CREATE POLICY blog_posts_admin_read ON public.blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;

-- Grant sequence access
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
