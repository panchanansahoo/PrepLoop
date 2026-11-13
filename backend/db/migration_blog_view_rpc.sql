-- Atomic view-count increment for blog_posts (UUID primary key)
CREATE OR REPLACE FUNCTION public.increment_blog_post_view(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_blog_post_view(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view(UUID) TO service_role;
