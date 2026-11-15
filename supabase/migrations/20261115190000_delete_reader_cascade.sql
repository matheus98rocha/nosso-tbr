CREATE INDEX IF NOT EXISTS books_readers_gin_idx
  ON public.books USING GIN (readers);

CREATE INDEX IF NOT EXISTS books_chosen_by_idx
  ON public.books (chosen_by);

CREATE INDEX IF NOT EXISTS books_user_id_idx
  ON public.books (user_id);

CREATE OR REPLACE FUNCTION public.reader_book_survivor_ids(
  p_readers uuid[],
  p_chosen_by uuid,
  p_registrar_id uuid,
  p_departing_id uuid
)
RETURNS uuid[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT survivor
      FROM (
        SELECT reader_id AS survivor, min(ord) AS ord
        FROM unnest(COALESCE(p_readers, ARRAY[]::uuid[]))
          WITH ORDINALITY AS t(reader_id, ord)
        WHERE reader_id IS NOT NULL
          AND reader_id <> p_departing_id
        GROUP BY reader_id
        UNION ALL
        SELECT p_chosen_by, 1000000000
        WHERE p_chosen_by IS NOT NULL
          AND p_chosen_by <> p_departing_id
          AND NOT (
            p_chosen_by = ANY (COALESCE(p_readers, ARRAY[]::uuid[]))
          )
        UNION ALL
        SELECT p_registrar_id, 1000000001
        WHERE p_registrar_id IS NOT NULL
          AND p_registrar_id <> p_departing_id
          AND p_registrar_id IS DISTINCT FROM p_chosen_by
          AND NOT (
            p_registrar_id = ANY (COALESCE(p_readers, ARRAY[]::uuid[]))
          )
      ) ranked
      ORDER BY ord
    ),
    ARRAY[]::uuid[]
  );
$$;

REVOKE ALL ON FUNCTION public.reader_book_survivor_ids(uuid[], uuid, uuid, uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reader_book_survivor_ids(uuid[], uuid, uuid, uuid)
  FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_reader_cascade(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier public.user_tier;
  v_admin_count integer;
  v_delete_ids uuid[];
BEGIN
  PERFORM 1
  FROM public.users
  WHERE id = p_user_id
     OR tier = 'admin'
  ORDER BY id
  FOR UPDATE;

  SELECT tier
  INTO v_tier
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_tier = 'admin' THEN
    SELECT count(*)
    INTO v_admin_count
    FROM public.users
    WHERE tier = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Não é possível excluir o último admin.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  PERFORM 1
  FROM public.books
  WHERE chosen_by = p_user_id
     OR user_id = p_user_id
     OR p_user_id = ANY (COALESCE(readers, ARRAY[]::uuid[]))
  ORDER BY id
  FOR UPDATE;

  SELECT COALESCE(array_agg(b.id), ARRAY[]::uuid[])
  INTO v_delete_ids
  FROM public.books b
  WHERE (
      b.chosen_by = p_user_id
      OR b.user_id = p_user_id
      OR p_user_id = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
    )
    AND cardinality(
      public.reader_book_survivor_ids(
        b.readers,
        b.chosen_by,
        b.user_id,
        p_user_id
      )
    ) = 0;

  DELETE FROM public.collective_reading_comment_reactions
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.collective_reading_comments
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.quotes
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.schedule
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.book_authors
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.custom_shelf_books
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.user_book_favorites
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.book_reading_ratings
  WHERE book_id = ANY (v_delete_ids);

  DELETE FROM public.books
  WHERE id = ANY (v_delete_ids);

  UPDATE public.books b
  SET
    readers = ARRAY(
      SELECT reader_id
      FROM (
        SELECT reader_id, min(ord) AS ord
        FROM unnest(COALESCE(b.readers, ARRAY[]::uuid[]))
          WITH ORDINALITY AS t(reader_id, ord)
        WHERE reader_id IS NOT NULL
          AND reader_id <> p_user_id
        GROUP BY reader_id
      ) remaining
      ORDER BY ord
    ),
    chosen_by = CASE
      WHEN b.chosen_by IS DISTINCT FROM p_user_id THEN b.chosen_by
      ELSE (
        public.reader_book_survivor_ids(
          b.readers,
          b.chosen_by,
          b.user_id,
          p_user_id
        )
      )[1]
    END,
    user_id = CASE
      WHEN b.user_id = p_user_id THEN NULL
      ELSE b.user_id
    END
  WHERE (
      b.chosen_by = p_user_id
      OR b.user_id = p_user_id
      OR p_user_id = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
    )
    AND cardinality(
      public.reader_book_survivor_ids(
        b.readers,
        b.chosen_by,
        b.user_id,
        p_user_id
      )
    ) > 0;

  DELETE FROM public.custom_shelf_books
  WHERE shelf_id IN (
    SELECT id
    FROM public.custom_shelves
    WHERE user_id = p_user_id
  );

  DELETE FROM public.custom_shelves
  WHERE user_id = p_user_id;

  DELETE FROM public.schedule
  WHERE owner = p_user_id;

  DELETE FROM public.collective_reading_comment_reactions
  WHERE user_id = p_user_id;

  DELETE FROM public.collective_reading_comments
  WHERE user_id = p_user_id;

  DELETE FROM public.user_book_favorites
  WHERE user_id = p_user_id;

  DELETE FROM public.book_reading_ratings
  WHERE user_id = p_user_id;

  DELETE FROM public.user_followers
  WHERE follower_id = p_user_id
     OR following_id = p_user_id;

  DELETE FROM public.user_notification_preferences
  WHERE follower_id = p_user_id
     OR following_id = p_user_id;

  DELETE FROM public.notifications
  WHERE recipient_id = p_user_id
     OR actor_id = p_user_id;

  DELETE FROM public.register_invites
  WHERE created_by = p_user_id;

  UPDATE public.registration_settings
  SET updated_by = NULL
  WHERE updated_by = p_user_id;

  DELETE FROM public.users
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_reader_cascade(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_reader_cascade(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_reader_cascade(uuid) TO service_role;
