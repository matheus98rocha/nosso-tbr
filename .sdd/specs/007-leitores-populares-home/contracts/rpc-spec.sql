-- =============================================================================
-- RPC Contract — get_popular_readers_for_home (feature 007)
-- SECURITY INVOKER: SELECT em books respeita is_book_visible_to_current_user.
-- Score MVP: follower_count + 3*shared_genders + 4*shared_authors
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_popular_readers_for_home(
  p_limit integer DEFAULT 12
)
RETURNS TABLE (
  reader_id uuid,
  display_name text,
  avatar_seed text,
  follower_count bigint,
  shared_gender_count bigint,
  shared_author_count bigint,
  score numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH params AS (
    SELECT LEAST(GREATEST(COALESCE(p_limit, 12), 1), 24) AS lim,
           auth.uid() AS me
  ),
  my_following AS (
    SELECT uf.following_id
    FROM public.user_followers uf
    CROSS JOIN params p
    WHERE uf.follower_id = p.me
  ),
  candidates AS (
    SELECT u.id, u.display_name, u.avatar_seed
    FROM public.users u
    CROSS JOIN params p
    WHERE u.id <> p.me
      AND NOT EXISTS (
        SELECT 1 FROM my_following mf WHERE mf.following_id = u.id
      )
  ),
  book_participants AS (
    SELECT
      participant_id AS reader_id,
      b.id AS book_id,
      NULLIF(btrim(b.gender), '') AS gender,
      b.author_id AS legacy_author_id
    FROM public.books b
    CROSS JOIN LATERAL unnest(
      ARRAY(
        SELECT DISTINCT x
        FROM unnest(
          COALESCE(b.readers, ARRAY[]::uuid[]) || ARRAY[b.chosen_by]
        ) AS x
        WHERE x IS NOT NULL
      )
    ) AS participant_id
  ),
  viewer_genders AS (
    SELECT DISTINCT bp.gender
    FROM book_participants bp
    CROSS JOIN params p
    WHERE bp.reader_id = p.me
      AND bp.gender IS NOT NULL
  ),
  viewer_authors AS (
    SELECT DISTINCT aid AS author_id
    FROM (
      SELECT ba.author_id AS aid
      FROM book_participants bp
      JOIN public.book_authors ba ON ba.book_id = bp.book_id
      CROSS JOIN params p
      WHERE bp.reader_id = p.me
      UNION
      SELECT bp.legacy_author_id AS aid
      FROM book_participants bp
      CROSS JOIN params p
      WHERE bp.reader_id = p.me
        AND bp.legacy_author_id IS NOT NULL
    ) a
    WHERE aid IS NOT NULL
  ),
  candidate_genders AS (
    SELECT DISTINCT bp.reader_id, bp.gender
    FROM book_participants bp
    JOIN candidates c ON c.id = bp.reader_id
    WHERE bp.gender IS NOT NULL
  ),
  candidate_authors AS (
    SELECT DISTINCT reader_id, author_id
    FROM (
      SELECT bp.reader_id, ba.author_id
      FROM book_participants bp
      JOIN public.book_authors ba ON ba.book_id = bp.book_id
      JOIN candidates c ON c.id = bp.reader_id
      UNION
      SELECT bp.reader_id, bp.legacy_author_id AS author_id
      FROM book_participants bp
      JOIN candidates c ON c.id = bp.reader_id
      WHERE bp.legacy_author_id IS NOT NULL
    ) x
    WHERE author_id IS NOT NULL
  ),
  scored AS (
    SELECT
      c.id AS reader_id,
      c.display_name,
      c.avatar_seed,
      COALESCE((
        SELECT COUNT(*)::bigint
        FROM public.user_followers uf
        WHERE uf.following_id = c.id
      ), 0) AS follower_count,
      COALESCE((
        SELECT COUNT(*)::bigint
        FROM candidate_genders cg
        JOIN viewer_genders vg ON vg.gender = cg.gender
        WHERE cg.reader_id = c.id
      ), 0) AS shared_gender_count,
      COALESCE((
        SELECT COUNT(*)::bigint
        FROM candidate_authors ca
        JOIN viewer_authors va ON va.author_id = ca.author_id
        WHERE ca.reader_id = c.id
      ), 0) AS shared_author_count
    FROM candidates c
  )
  SELECT
    s.reader_id,
    s.display_name,
    s.avatar_seed,
    s.follower_count,
    s.shared_gender_count,
    s.shared_author_count,
    (
      (s.follower_count)::numeric
      + (s.shared_gender_count * 3)
      + (s.shared_author_count * 4)
    ) AS score
  FROM scored s
  CROSS JOIN params p
  ORDER BY
    score DESC,
    s.display_name ASC NULLS LAST,
    s.reader_id ASC
  LIMIT (SELECT lim FROM params);
$$;

REVOKE ALL ON FUNCTION public.get_popular_readers_for_home(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_popular_readers_for_home(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_popular_readers_for_home(integer) TO authenticated;
