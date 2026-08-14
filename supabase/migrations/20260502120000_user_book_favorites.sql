CREATE TABLE IF NOT EXISTS public.user_book_favorites (
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_book_favorites_pkey PRIMARY KEY (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_user_book_favorites_user_id
  ON public.user_book_favorites (user_id);

ALTER TABLE public.user_book_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_favorites FORCE ROW LEVEL SECURITY;

CREATE POLICY user_book_favorites_select_own
  ON public.user_book_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_book_favorites_insert_own
  ON public.user_book_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_book_favorites_delete_own
  ON public.user_book_favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.user_book_favorites TO authenticated;
