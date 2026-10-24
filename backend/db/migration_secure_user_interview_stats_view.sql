-- Ensure user interview statistics honor the querying user's privileges and RLS.

ALTER VIEW public.user_interview_stats
SET (security_invoker = true);

REVOKE ALL ON public.user_interview_stats FROM anon;
GRANT SELECT ON public.user_interview_stats TO authenticated;
