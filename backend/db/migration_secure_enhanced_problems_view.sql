-- Make the public problem catalog honor the querying user's permissions and RLS.

ALTER VIEW public.enhanced_problems
SET (security_invoker = true);
