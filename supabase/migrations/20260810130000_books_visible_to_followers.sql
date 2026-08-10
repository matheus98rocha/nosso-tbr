-- RN56 extension: followers can see solo/private books of users they follow.
-- Fixes empty "Seguindo" feed when followed users mostly have individual readings.

CREATE OR REPLACE FUNCTION public.is_book_visible_to_current_user(
  p_readers uuid[],
  p_chosen_by uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    NOT (
      array_length(COALESCE(p_readers, ARRAY[]::uuid[]), 1) = 1
      AND (COALESCE(p_readers, ARRAY[]::uuid[]))[1] = p_chosen_by
    )
    OR p_chosen_by = auth.uid()
    OR (
      auth.uid() IS NOT NULL
      AND array_length(COALESCE(p_readers, ARRAY[]::uuid[]), 1) = 1
      AND (COALESCE(p_readers, ARRAY[]::uuid[]))[1] = p_chosen_by
      AND EXISTS (
        SELECT 1
        FROM public.user_followers uf
        WHERE uf.follower_id = auth.uid()
          AND uf.following_id = p_chosen_by
      )
    );
$$;

DROP POLICY IF EXISTS books_select_non_solo_or_owner ON public.books;

CREATE POLICY books_select_non_solo_or_owner
  ON public.books
  FOR SELECT
  USING (public.is_book_visible_to_current_user(readers, chosen_by));

DROP POLICY IF EXISTS quotes_select_visible_if_book_visible ON public.quotes;

CREATE POLICY quotes_select_visible_if_book_visible
  ON public.quotes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND public.is_book_visible_to_current_user(b.readers, b.chosen_by)
    )
  );

DROP POLICY IF EXISTS book_authors_select_visible_if_book_visible ON public.book_authors;

CREATE POLICY book_authors_select_visible_if_book_visible
  ON public.book_authors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
      AND public.is_book_visible_to_current_user(b.readers, b.chosen_by)
    )
  );
