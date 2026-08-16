-- =============================================================================
-- RPC Contract — get_schedule_progress_for_books (extensão 003)
-- Substitui a assinatura RETURNS TABLE da feature 001 (colunas extras).
-- =============================================================================

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
    COUNT(*) FILTER (WHERE s.completed)::bigint AS completed,
    COUNT(*) FILTER (
      WHERE s.date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND NOT COALESCE(s.completed, false)
    )::bigint AS overdue,
    COUNT(*) FILTER (
      WHERE s.date > (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
        AND COALESCE(s.completed, false)
    )::bigint AS ahead,
    MAX(s.date) AS last_date
  FROM public.schedule s
  WHERE s.owner = auth.uid()
    AND s.book_id = ANY(book_ids)
  GROUP BY s.book_id
  HAVING COUNT(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) TO authenticated;

-- Casos manuais
-- 1) hoje = 05/08, linhas 01–10/08, 5 primeiros lidos:
--    overdue=0, ahead=0, last_date=2026-08-10
-- 2) mesmos 5 + dia 06/08 lido:
--    overdue=0, ahead=1, last_date=2026-08-10
-- 3) só 3 dos 5 vencidos lidos:
--    overdue=2, ahead=0
-- 4) hoje < primeira data, 0 lidos:
--    overdue=0, ahead=0
-- 5) owner alheio:
--    0 linhas
