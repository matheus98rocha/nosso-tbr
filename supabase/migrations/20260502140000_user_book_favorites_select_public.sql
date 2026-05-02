DROP POLICY IF EXISTS user_book_favorites_select_own ON public.user_book_favorites;

CREATE POLICY user_book_favorites_select_authenticated
  ON public.user_book_favorites
  FOR SELECT
  TO authenticated
  USING (true);
