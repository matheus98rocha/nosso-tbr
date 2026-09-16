-- =============================================================================
-- RPC Contract — get_community_reader_genres (feature 005)
-- SECURITY INVOKER: SELECT em books respeita is_book_visible_to_current_user.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_community_reader_genres()
RETURNS TABLE (
  reader_id uuid,
  gender text,
  finished_count bigint,
  registered_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH eligible AS (
    SELECT
      participant_id AS reader_id,
      b.gender,
      b.status
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
    WHERE b.gender IS NOT NULL
      AND btrim(b.gender) <> ''
  )
  SELECT
    e.reader_id,
    e.gender,
    COUNT(*) FILTER (WHERE e.status = 'finished')::bigint AS finished_count,
    COUNT(*)::bigint AS registered_count
  FROM eligible e
  GROUP BY e.reader_id, e.gender
  HAVING COUNT(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_community_reader_genres() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_community_reader_genres() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_community_reader_genres() TO authenticated;

-- =============================================================================
-- RPC Contract — get_community_reader_activity (feature 005 / US8)
-- SECURITY INVOKER: SELECT em books respeita is_book_visible_to_current_user.
-- Cadastrados = qualquer status visível. Lidos = finished. Lendo = título reading.
-- =============================================================================

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

-- Casos manuais
-- 1) Visitante não segue B; B tem só livro solo finished gender=fantasy
--    → nenhuma linha para B
-- 2) Visitante segue B; mesmo livro
--    → (B, fantasy, finished_count=1, registered_count=1)
-- 3) B participa de 2 fantasy finished + 1 romance not_started (visíveis)
--    → (B, fantasy, 2, 2), (B, romance, 0, 1)
-- 4) anon: EXECUTE negado
