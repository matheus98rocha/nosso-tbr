-- Stats comparisons (collaboration + leaderboard) only include mutual follows.
-- Ranking is empty when the viewer has no mutual follows.

CREATE OR REPLACE FUNCTION public.get_reader_collaboration_stats(reader_input text)
RETURNS TABLE (
  reader_name text,
  books_read bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH resolved AS (
    SELECT u.id AS reader_id
    FROM public.users u
    WHERE u.id::text = trim(reader_input)
      OR lower(trim(coalesce(u.display_name::text, ''))) = lower(trim(reader_input))
    ORDER BY CASE WHEN u.id::text = trim(reader_input) THEN 0 ELSE 1 END
    LIMIT 1
  ),
  mutual_peers AS (
    SELECT uf.following_id AS peer_id
    FROM public.user_followers uf
    CROSS JOIN resolved r
    WHERE uf.follower_id = r.reader_id
      AND EXISTS (
        SELECT 1
        FROM public.user_followers uf_back
        WHERE uf_back.follower_id = uf.following_id
          AND uf_back.following_id = r.reader_id
      )
  ),
  filtered_books AS (
    SELECT b.readers
    FROM public.books b
    CROSS JOIN resolved r
    WHERE r.reader_id = ANY (b.readers)
      AND b.end_date IS NOT NULL
  ),
  per_reader AS (
    SELECT
      ur AS reader_uuid,
      COUNT(*)::bigint AS cnt
    FROM filtered_books fb
    CROSS JOIN unnest(fb.readers) AS ur
    CROSS JOIN resolved r
    WHERE ur = r.reader_id
       OR ur IN (SELECT peer_id FROM mutual_peers)
    GROUP BY ur
  )
  SELECT
    COALESCE(u.display_name, pr.reader_uuid::text) AS reader_name,
    pr.cnt AS books_read
  FROM per_reader pr
  LEFT JOIN public.users u ON u.id = pr.reader_uuid
  CROSS JOIN resolved r
  ORDER BY
    CASE WHEN pr.reader_uuid = r.reader_id THEN 0 ELSE 1 END,
    pr.cnt DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reading_leaderboard(year_input integer DEFAULT NULL)
RETURNS TABLE (
  reader_id uuid,
  display_name text,
  books_read bigint,
  total_pages bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viewer AS (
    SELECT auth.uid() AS viewer_id
  ),
  mutual_peers AS (
    SELECT uf.following_id AS peer_id
    FROM public.user_followers uf
    CROSS JOIN viewer v
    WHERE v.viewer_id IS NOT NULL
      AND uf.follower_id = v.viewer_id
      AND EXISTS (
        SELECT 1
        FROM public.user_followers uf_back
        WHERE uf_back.follower_id = uf.following_id
          AND uf_back.following_id = v.viewer_id
      )
  ),
  allowed_readers AS (
    SELECT peer_id AS id
    FROM mutual_peers
    UNION
    SELECT v.viewer_id AS id
    FROM viewer v
    WHERE v.viewer_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM mutual_peers)
  )
  SELECT
    u.id AS reader_id,
    COALESCE(u.display_name, u.id::text) AS display_name,
    COUNT(*)::bigint AS books_read,
    COALESCE(SUM(b.pages), 0)::bigint AS total_pages
  FROM public.books b
  CROSS JOIN LATERAL unnest(b.readers) AS r(reader_id)
  INNER JOIN public.users u ON u.id = r.reader_id
  INNER JOIN allowed_readers ar ON ar.id = u.id
  WHERE b.end_date IS NOT NULL
    AND (year_input IS NULL OR EXTRACT(YEAR FROM b.end_date)::integer = year_input)
  GROUP BY u.id, u.display_name
  ORDER BY books_read DESC, total_pages DESC, display_name ASC;
$$;
