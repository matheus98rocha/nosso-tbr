-- RPC: gêneros visíveis por leitor para a tela Comunidade.
-- SECURITY INVOKER: SELECT em books respeita is_book_visible_to_current_user.

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
