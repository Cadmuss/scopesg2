-- Remove overly permissive policies on market_trends_cache
DROP POLICY IF EXISTS "Service role can insert cache" ON public.market_trends_cache;
DROP POLICY IF EXISTS "Service role can delete cache" ON public.market_trends_cache;

-- Service role bypasses RLS automatically, so no replacement policies needed for INSERT/DELETE.
-- Public SELECT policy remains intact for read access.

-- Lock down has_role SECURITY DEFINER function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;