CREATE OR REPLACE FUNCTION public.get_schedule_progress_for_books(
  book_ids uuid[]
)
RETURNS TABLE (
  book_id   uuid,
  total     bigint,
  completed bigint,
  overdue   bigint,
  ahead     bigint,
  last_date date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    s.book_id,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE s.completed IS TRUE)::bigint AS completed,
    COUNT(*) FILTER (
      WHERE s.date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND COALESCE(s.completed, false) IS NOT TRUE
    )::bigint AS overdue,
    COUNT(*) FILTER (
      WHERE s.date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND s.completed IS TRUE
    )::bigint AS ahead,
    MAX(s.date) AS last_date
  FROM public.schedule s
  WHERE s.owner = auth.uid()
    AND s.book_id = ANY(book_ids)
  GROUP BY s.book_id
  HAVING COUNT(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) TO authenticated;
