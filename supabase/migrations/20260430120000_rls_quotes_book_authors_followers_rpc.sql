-- RN56: quotes e book_authors seguem a mesma visibilidade de books (livro solo só para chosen_by).
-- RN39-40: user_followers SELECT apenas nas linhas onde o usuário é follower ou following.
-- Reforço: anon não executa RPCs SECURITY DEFINER expostas indevidamente (Supabase advisor).

DROP POLICY IF EXISTS quotes_select_all ON public.quotes;

CREATE POLICY quotes_select_visible_if_book_visible
  ON public.quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          NOT (
            array_length(COALESCE(b.readers, ARRAY[]::uuid[]), 1) = 1
            AND (COALESCE(b.readers, ARRAY[]::uuid[]))[1] = b.chosen_by
          )
          OR b.chosen_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS book_authors_select_all ON public.book_authors;

CREATE POLICY book_authors_select_visible_if_book_visible
  ON public.book_authors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          NOT (
            array_length(COALESCE(b.readers, ARRAY[]::uuid[]), 1) = 1
            AND (COALESCE(b.readers, ARRAY[]::uuid[]))[1] = b.chosen_by
          )
          OR b.chosen_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "user_followers_select_authenticated" ON public.user_followers;

CREATE POLICY user_followers_select_involved
  ON public.user_followers
  FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

ALTER TABLE public.user_followers FORCE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.reorder_custom_shelf_books(uuid, uuid[]) FROM anon;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'handle_sync_user_email'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_sync_user_email() FROM anon';
  END IF;
END;
$$;
