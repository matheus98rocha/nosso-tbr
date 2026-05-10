CREATE TABLE public.collective_reading_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.collective_reading_comments (id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

CREATE INDEX collective_reading_comment_reactions_book_id_idx
  ON public.collective_reading_comment_reactions (book_id);

CREATE INDEX collective_reading_comment_reactions_comment_id_idx
  ON public.collective_reading_comment_reactions (comment_id);

CREATE OR REPLACE FUNCTION public.collective_reading_comment_reactions_set_book_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  SELECT c.book_id INTO v_book_id
  FROM public.collective_reading_comments c
  WHERE c.id = NEW.comment_id;
  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'collective_reading_comment_reactions: comment not found';
  END IF;
  NEW.book_id := v_book_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS collective_reading_comment_reactions_set_book_id
  ON public.collective_reading_comment_reactions;

CREATE TRIGGER collective_reading_comment_reactions_set_book_id
  BEFORE INSERT OR UPDATE OF comment_id ON public.collective_reading_comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.collective_reading_comment_reactions_set_book_id();

ALTER TABLE public.collective_reading_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_reading_comment_reactions FORCE ROW LEVEL SECURITY;

CREATE POLICY collective_reading_comment_reactions_select_participants
  ON public.collective_reading_comment_reactions
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

CREATE POLICY collective_reading_comment_reactions_select_anon
  ON public.collective_reading_comment_reactions
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY collective_reading_comment_reactions_insert_participant
  ON public.collective_reading_comment_reactions
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

CREATE POLICY collective_reading_comment_reactions_update_own
  ON public.collective_reading_comment_reactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
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

CREATE POLICY collective_reading_comment_reactions_delete_own
  ON public.collective_reading_comment_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.collective_reading_comment_reactions;
