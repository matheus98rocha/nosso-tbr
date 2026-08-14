CREATE TABLE IF NOT EXISTS public.book_reading_ratings (
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  stars smallint NOT NULL CONSTRAINT book_reading_ratings_stars_check CHECK (
    stars >= 1 AND stars <= 5
  ),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_reading_ratings_pkey PRIMARY KEY (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_book_reading_ratings_book_id ON public.book_reading_ratings (book_id);

CREATE OR REPLACE FUNCTION public.book_reading_ratings_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS book_reading_ratings_set_updated_at ON public.book_reading_ratings;

CREATE TRIGGER book_reading_ratings_set_updated_at
  BEFORE INSERT OR UPDATE ON public.book_reading_ratings
  FOR EACH ROW EXECUTE FUNCTION public.book_reading_ratings_touch_updated_at();

ALTER TABLE public.book_reading_ratings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.book_reading_ratings FORCE ROW LEVEL SECURITY;

CREATE POLICY book_reading_ratings_select_own
  ON public.book_reading_ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY book_reading_ratings_delete_own
  ON public.book_reading_ratings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY book_reading_ratings_insert_finished_participant
  ON public.book_reading_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_reading_ratings.book_id
        AND b.status = 'finished'::public.book_status
        AND (
          b.user_id IS NOT DISTINCT FROM auth.uid()
          OR b.chosen_by = auth.uid()
          OR auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))
        )
    )
  );

CREATE POLICY book_reading_ratings_update_finished_participant
  ON public.book_reading_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_reading_ratings.book_id
        AND b.status = 'finished'::public.book_status
        AND (
          b.user_id IS NOT DISTINCT FROM auth.uid()
          OR b.chosen_by = auth.uid()
          OR auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))
        )
    )
  );

REVOKE ALL ON public.book_reading_ratings FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reading_ratings TO authenticated;
