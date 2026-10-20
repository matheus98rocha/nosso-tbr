-- append_book_reader is executable by any authenticated session, not only
-- the API route. Without these checks a participant can add any user id,
-- which turns a solo book into a public reading and grants that user update.

CREATE OR REPLACE FUNCTION public.append_book_reader(
  p_book_id uuid,
  p_reader_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  current_readers uuid[];
  book_user_id uuid;
  book_chosen_by uuid;
  updated_id uuid;
BEGIN
  IF actor_id IS NULL OR p_book_id IS NULL OR p_reader_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_reader_id = actor_id THEN
    RETURN false;
  END IF;

  SELECT book.readers, book.user_id, book.chosen_by
    INTO current_readers, book_user_id, book_chosen_by
  FROM public.books AS book
  WHERE book.id = p_book_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (
    (book_user_id IS NOT NULL AND book_user_id = actor_id)
    OR book_chosen_by = actor_id
    OR actor_id = ANY (COALESCE(current_readers, ARRAY[]::uuid[]))
  ) THEN
    RETURN false;
  END IF;

  IF p_reader_id = ANY (COALESCE(current_readers, ARRAY[]::uuid[])) THEN
    RETURN true;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_followers
    WHERE follower_id = actor_id
      AND following_id = p_reader_id
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.books
  SET readers = (
    SELECT ARRAY(
      SELECT deduped.reader_id
      FROM (
        SELECT entry.reader_id, MIN(entry.ordinality) AS first_seen
        FROM unnest(
          COALESCE(current_readers, ARRAY[]::uuid[]) || ARRAY[p_reader_id]
        )         WITH ORDINALITY AS entry(reader_id, ordinality)
        GROUP BY entry.reader_id
      ) AS deduped
      ORDER BY deduped.first_seen
    )
  )
  WHERE id = p_book_id
  RETURNING id INTO updated_id;

  RETURN updated_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.append_book_reader(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.append_book_reader(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.append_book_reader(uuid, uuid) TO authenticated;
