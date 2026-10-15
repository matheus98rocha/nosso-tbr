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
  current_readers uuid[];
  updated_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_reader_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT book.readers
    INTO current_readers
  FROM public.books AS book
  WHERE book.id = p_book_id
  FOR UPDATE;

  IF NOT FOUND THEN
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
        ) WITH ORDINALITY AS entry(reader_id, ordinality)
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
