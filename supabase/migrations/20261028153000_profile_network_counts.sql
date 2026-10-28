-- user_followers SELECT only returns edges the caller is part of.
-- A direct count of another reader's network is therefore 0, or 1 when the
-- viewer shares that single edge. Profile totals need the aggregate only.

CREATE OR REPLACE FUNCTION public.count_following_of(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR p_user_id IS NULL THEN 0::bigint
    ELSE (
      SELECT COUNT(*)::bigint
      FROM public.user_followers
      WHERE follower_id = p_user_id
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.count_following_of(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_following_of(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_following_of(uuid) TO authenticated;
