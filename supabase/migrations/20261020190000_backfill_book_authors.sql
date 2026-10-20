-- Backfill book_authors from legacy books.author_id and keep them in sync for
-- single-author writes that still touch books.author_id (import RPC, etc.).
-- Junction book_authors is the multi-author source of truth; books.author_id
-- remains the optional primary/legacy author (first credit).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'book_authors_pkey'
  ) THEN
    ALTER TABLE public.book_authors
      ADD CONSTRAINT book_authors_pkey PRIMARY KEY (book_id, author_id);
  END IF;
END $$;

INSERT INTO public.book_authors (book_id, author_id)
SELECT b.id, b.author_id
FROM public.books b
WHERE b.author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.book_authors ba
    WHERE ba.book_id = b.id
      AND ba.author_id = b.author_id
  );

CREATE OR REPLACE FUNCTION public.sync_book_authors_from_legacy_author_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.book_authors (book_id, author_id)
  VALUES (NEW.id, NEW.author_id)
  ON CONFLICT (book_id, author_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_books_sync_book_authors_legacy ON public.books;
CREATE TRIGGER tr_books_sync_book_authors_legacy
AFTER INSERT OR UPDATE OF author_id ON public.books
FOR EACH ROW
EXECUTE PROCEDURE public.sync_book_authors_from_legacy_author_id();

CREATE OR REPLACE FUNCTION public.books_generate_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  author_names text;
BEGIN
  NEW.title_unaccent := lower(unaccent(coalesce(NEW.title, '')));

  SELECT string_agg(a.name, ' ' ORDER BY a.name)
    INTO author_names
  FROM public.book_authors ba
  JOIN public.authors a ON a.id = ba.author_id
  WHERE ba.book_id = NEW.id;

  IF author_names IS NULL AND NEW.author_id IS NOT NULL THEN
    SELECT name INTO author_names FROM public.authors WHERE id = NEW.author_id;
  END IF;

  NEW.search_vector :=
    to_tsvector('simple', lower(unaccent(coalesce(NEW.title, '')))) ||
    to_tsvector('simple', lower(unaccent(coalesce(author_names, ''))));
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.book_authors_refresh_book_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_book_id uuid;
BEGIN
  target_book_id := COALESCE(NEW.book_id, OLD.book_id);
  UPDATE public.books
  SET title = title
  WHERE id = target_book_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_book_authors_refresh_search ON public.book_authors;
CREATE TRIGGER tr_book_authors_refresh_search
AFTER INSERT OR UPDATE OR DELETE ON public.book_authors
FOR EACH ROW
EXECUTE PROCEDURE public.book_authors_refresh_book_search_vector();
