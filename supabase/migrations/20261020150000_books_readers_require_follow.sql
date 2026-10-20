-- books INSERT/UPDATE is granted to any participant, so a reader list can be
-- rewritten without append_book_reader. Adding someone the actor does not
-- follow turns a solo book into a public reading and grants that person edit.

CREATE OR REPLACE FUNCTION public.enforce_followed_book_readers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  added_reader uuid;
BEGIN
  IF actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.readers IS NOT DISTINCT FROM OLD.readers THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    FOR added_reader IN
      SELECT DISTINCT candidate.reader_id
      FROM unnest(COALESCE(NEW.readers, ARRAY[]::uuid[])) AS candidate(reader_id)
      WHERE candidate.reader_id IS NOT NULL
        AND candidate.reader_id IS DISTINCT FROM actor_id
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.user_followers
        WHERE follower_id = actor_id
          AND following_id = added_reader
      ) THEN
        RAISE EXCEPTION 'Você só pode adicionar pessoas que segue'
          USING ERRCODE = '42501';
      END IF;
    END LOOP;

    RETURN NEW;
  END IF;

  FOR added_reader IN
    SELECT DISTINCT candidate.reader_id
    FROM unnest(COALESCE(NEW.readers, ARRAY[]::uuid[])) AS candidate(reader_id)
    WHERE candidate.reader_id IS NOT NULL
      AND candidate.reader_id IS DISTINCT FROM actor_id
      AND NOT (
        candidate.reader_id = ANY (COALESCE(OLD.readers, ARRAY[]::uuid[]))
      )
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_followers
      WHERE follower_id = actor_id
        AND following_id = added_reader
    ) THEN
      RAISE EXCEPTION 'Você só pode adicionar pessoas que segue'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_followed_book_readers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_followed_book_readers() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_followed_book_readers() FROM authenticated;

DROP TRIGGER IF EXISTS books_enforce_followed_readers ON public.books;

CREATE TRIGGER books_enforce_followed_readers
  BEFORE INSERT OR UPDATE OF readers ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_followed_book_readers();
