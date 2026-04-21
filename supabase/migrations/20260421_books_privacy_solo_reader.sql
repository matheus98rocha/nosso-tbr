-- RN56: Livros individuais (readers=[X] AND chosen_by=X) são visíveis apenas ao próprio dono.
-- Substitui books_select_all (USING true) por policy com filtro de privacidade solo.
--
-- Lógica (De Morgan): visível quando NOT(é_solo) OR (é_o_dono)
--   - Livros com múltiplos leitores: NOT(solo)=TRUE → visível para todos (incluindo anon).
--   - Livros solo: NOT(solo)=FALSE → visível apenas quando chosen_by = auth.uid().
--   - COALESCE garante que readers NULL (não deve ocorrer, mas schema usa COALESCE em outras policies)
--     seja tratado como array vazio → array_length=NULL → NOT(solo)=TRUE → visível (comportamento seguro).

DROP POLICY IF EXISTS books_select_all ON public.books;

CREATE POLICY books_select_non_solo_or_owner
  ON public.books
  FOR SELECT
  USING (
    NOT (
      array_length(COALESCE(readers, ARRAY[]::uuid[]), 1) = 1
      AND (COALESCE(readers, ARRAY[]::uuid[]))[1] = chosen_by
    )
    OR chosen_by = auth.uid()
  );
