CREATE OR REPLACE FUNCTION public.get_community_reader_activity()
RETURNS TABLE (
  reader_id uuid,
  registered_count bigint,
  finished_count bigint,
  currently_reading_title text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH eligible AS (
    SELECT DISTINCT
      participant_id AS reader_id,
      b.id AS book_id,
      b.status,
      b.title,
      b.start_date
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
  reading_pick AS (
    SELECT DISTINCT ON (e.reader_id)
      e.reader_id,
      NULLIF(btrim(e.title), '') AS title
    FROM eligible e
    WHERE e.status = 'reading'
    ORDER BY e.reader_id, e.start_date DESC NULLS LAST, e.title ASC, e.book_id ASC
  )
  SELECT
    e.reader_id,
    COUNT(*)::bigint AS registered_count,
    COUNT(*) FILTER (WHERE e.status = 'finished')::bigint AS finished_count,
    rp.title AS currently_reading_title
  FROM eligible e
  LEFT JOIN reading_pick rp ON rp.reader_id = e.reader_id
  GROUP BY e.reader_id, rp.title;
$$;

REVOKE ALL ON FUNCTION public.get_community_reader_activity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_community_reader_activity() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_community_reader_activity() TO authenticated;
