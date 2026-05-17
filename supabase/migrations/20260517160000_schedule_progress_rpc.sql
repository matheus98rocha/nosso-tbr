-- =============================================================================
-- Feature 001 — Progresso de leitura baseado no cronograma
-- Spec: .sdd/specs/001-progresso-leitura-cronograma/
-- =============================================================================
--
-- Cria a RPC `get_schedule_progress_for_books(book_ids uuid[])` que agrega
-- (total, completed) por book_id para o usuário autenticado (auth.uid()),
-- alinhada a RN44 (cronograma isolado por owner).
--
-- A RPC é SECURITY INVOKER + WHERE explícito `owner = auth.uid()` (defesa em
-- profundidade) + search_path fixo + REVOKE PUBLIC + REVOKE anon + GRANT só
-- para authenticated. Livros sem cronograma são omitidos do retorno
-- (HAVING COUNT(*) > 0) -> invariante I-03 do data-model.
--
-- Adiciona o índice composto `schedule(owner, book_id)` que cobre o filtro
-- principal da RPC, ausente antes desta migration.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_schedule_progress_for_books(
  book_ids uuid[]
)
RETURNS TABLE (
  book_id   uuid,
  total     bigint,
  completed bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    s.book_id,
    COUNT(*)::bigint                                       AS total,
    COUNT(*) FILTER (WHERE s.completed IS TRUE)::bigint    AS completed
  FROM public.schedule s
  WHERE s.owner   = auth.uid()
    AND s.book_id = ANY(book_ids)
  GROUP BY s.book_id
  HAVING COUNT(*) > 0;
$$;

REVOKE ALL ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) TO authenticated;

CREATE INDEX IF NOT EXISTS schedule_owner_book_id_idx
  ON public.schedule (owner, book_id);
