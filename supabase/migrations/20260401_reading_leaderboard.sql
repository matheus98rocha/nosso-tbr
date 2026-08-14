-- Leaderboard: completed books per reader (readers array + end_date). Optional calendar year filter.

CREATE OR REPLACE FUNCTION public.get_reading_leaderboard(year_input integer DEFAULT NULL)
RETURNS TABLE (
  reader_id uuid,
  display_name text,
  books_read bigint,
  total_pages bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.id AS reader_id,
    COALESCE(u.display_name, u.id::text) AS display_name,
    COUNT(*)::bigint AS books_read,
    COALESCE(SUM(b.pages), 0)::bigint AS total_pages
  FROM public.books b
  CROSS JOIN LATERAL unnest(b.readers) AS r(reader_id)
  INNER JOIN public.users u ON u.id = r.reader_id
  WHERE b.end_date IS NOT NULL
    AND (year_input IS NULL OR EXTRACT(YEAR FROM b.end_date)::integer = year_input)
  GROUP BY u.id, u.display_name
  ORDER BY books_read DESC, total_pages DESC, display_name ASC;
$$;
