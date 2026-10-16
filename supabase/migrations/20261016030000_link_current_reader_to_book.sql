-- Joining an existing not-started reading adds the signed-in reader.
-- books UPDATE only allows current participants, so a plain readers write
-- from this route matched zero rows and still returned success.

CREATE OR REPLACE FUNCTION public.link_current_reader_to_book(p_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  book_chosen_by uuid;
  book_readers uuid[];
  book_status public.book_status;
  counterpart_id uuid;
  mutual_follow boolean;
BEGIN
  IF actor_id IS NULL OR p_book_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT book.chosen_by, book.readers, book.status
    INTO book_chosen_by, book_readers, book_status
  FROM public.books AS book
  WHERE book.id = p_book_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF actor_id = ANY (COALESCE(book_readers, ARRAY[]::uuid[])) THEN
    RETURN true;
  END IF;

  IF book_status IS DISTINCT FROM 'not_started'::public.book_status THEN
    RETURN false;
  END IF;

  IF book_chosen_by IS NOT NULL AND book_chosen_by IS DISTINCT FROM actor_id THEN
    counterpart_id := book_chosen_by;
  ELSE
    SELECT entry.reader_id
      INTO counterpart_id
    FROM unnest(COALESCE(book_readers, ARRAY[]::uuid[]))
      WITH ORDINALITY AS entry(reader_id, ordinality)
    WHERE entry.reader_id IS NOT NULL
      AND entry.reader_id IS DISTINCT FROM actor_id
    ORDER BY entry.ordinality
    LIMIT 1;
  END IF;

  IF counterpart_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT
    EXISTS (
      SELECT 1
      FROM public.user_followers
      WHERE follower_id = actor_id
        AND following_id = counterpart_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.user_followers
      WHERE follower_id = counterpart_id
        AND following_id = actor_id
    )
  INTO mutual_follow;

  IF NOT mutual_follow THEN
    RETURN false;
  END IF;

  UPDATE public.books
  SET readers = (
    SELECT ARRAY(
      SELECT deduped.reader_id
      FROM (
        SELECT entry.reader_id, MIN(entry.ordinality) AS first_seen
        FROM unnest(
          COALESCE(book_readers, ARRAY[]::uuid[]) || ARRAY[actor_id]
        ) WITH ORDINALITY AS entry(reader_id, ordinality)
        WHERE entry.reader_id IS NOT NULL
        GROUP BY entry.reader_id
      ) AS deduped
      ORDER BY deduped.first_seen
    )
  )
  WHERE id = p_book_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.link_current_reader_to_book(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_current_reader_to_book(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.link_current_reader_to_book(uuid) TO authenticated;
