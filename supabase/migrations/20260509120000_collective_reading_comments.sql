CREATE TABLE public.collective_reading_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX collective_reading_comments_book_id_created_at_idx
  ON public.collective_reading_comments (book_id, created_at DESC);

ALTER TABLE public.collective_reading_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_reading_comments FORCE ROW LEVEL SECURITY;

CREATE POLICY collective_reading_comments_select_participants
  ON public.collective_reading_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND COALESCE(array_length(b.readers, 1), 0) > 1
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

CREATE POLICY collective_reading_comments_select_anon
  ON public.collective_reading_comments
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY collective_reading_comments_insert_participant
  ON public.collective_reading_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND COALESCE(array_length(b.readers, 1), 0) > 1
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );
