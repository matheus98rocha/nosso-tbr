-- =============================================================================
-- RPC Contract — get_schedule_progress_for_books
-- Feature: 001 — Progresso de leitura baseado no cronograma
-- Status: Draft contract (referência para a migration final)
-- =============================================================================
--
-- ESPECIFICAÇÃO
-- -------------
-- Devolve, para os book_ids informados, o agregado (total, completed) do
-- cronograma do USUÁRIO AUTENTICADO (auth.uid()).
--
-- INVARIANTES
-- -----------
-- I-01  Apenas linhas com owner = auth.uid() são consideradas.
-- I-02  0 <= completed <= total
-- I-03  Apenas books com pelo menos 1 linha de schedule são retornados
--       (HAVING COUNT(*) > 0 — livros sem cronograma somem da resposta).
--
-- SEGURANÇA
-- ---------
-- - SECURITY INVOKER: a função executa com as permissões do chamador, então a
--   policy RLS de schedule (filtro owner = auth.uid() — RN44) é aplicada
--   automaticamente. O WHERE explícito na query é defesa em profundidade.
-- - GRANT EXECUTE apenas para `authenticated` (anon não pode chamar).
-- - REVOKE ALL primeiro para garantir estado limpo (idempotência).
--
-- COMPATIBILIDADE
-- ---------------
-- Adicionar colunas à TABLE de retorno é permitido (clientes ignoram).
-- Renomear/remover quebra contrato → exige nova função.
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
    COUNT(*)::bigint                                AS total,
    COUNT(*) FILTER (WHERE s.completed)::bigint     AS completed
  FROM public.schedule s
  WHERE s.owner   = auth.uid()
    AND s.book_id = ANY(book_ids)
  GROUP BY s.book_id
  HAVING COUNT(*) > 0;
$$;

-- Permissões: somente usuários autenticados.
REVOKE ALL ON FUNCTION public.get_schedule_progress_for_books(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_schedule_progress_for_books(uuid[]) TO authenticated;

-- Índice de apoio (criar APENAS se não existir já em database-indexes-views.md).
-- A query agrupa por book_id filtrando por owner — o índice composto cobre ambos.
CREATE INDEX IF NOT EXISTS schedule_owner_book_id_idx
  ON public.schedule (owner, book_id);

-- =============================================================================
-- Casos de teste manual (Supabase Studio / psql)
-- =============================================================================
--
-- 1) Como usuário sem cronograma para nenhum book:
--    SELECT * FROM public.get_schedule_progress_for_books(
--      ARRAY['00000000-0000-0000-0000-000000000001']::uuid[]
--    );
--    Resultado esperado: 0 linhas.
--
-- 2) Como usuário com cronograma de 10 dias, 4 completos no bookA:
--    SELECT * FROM public.get_schedule_progress_for_books(
--      ARRAY[<bookA_id>]::uuid[]
--    );
--    Resultado esperado: (<bookA_id>, 10, 4).
--
-- 3) Como anon (sem JWT):
--    SELECT * FROM public.get_schedule_progress_for_books(...);
--    Resultado esperado: ERROR — permission denied for function (...).
--
-- 4) Defesa em profundidade — userX pedindo bookId de userY:
--    Logado como userX, chamar a função com bookId cujo cronograma é de userY:
--    Resultado esperado: 0 linhas (a função filtra por auth.uid()).
--
-- =============================================================================
