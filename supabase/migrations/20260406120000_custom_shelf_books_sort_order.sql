-- Ordenação manual de livros nas estantes (Second Brain: business-rules.md RN50–RN54).
-- Índice em (shelf_id, sort_order) para listagem ordenada (query performance).

ALTER TABLE public.custom_shelf_books
  ADD COLUMN IF NOT EXISTS sort_order integer;

UPDATE public.custom_shelf_books csb
SET sort_order = sub.rn
FROM (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY shelf_id
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) - 1)::integer AS rn
  FROM public.custom_shelf_books
) AS sub
WHERE csb.id = sub.id;

UPDATE public.custom_shelf_books
SET sort_order = 0
WHERE sort_order IS NULL;

ALTER TABLE public.custom_shelf_books
  ALTER COLUMN sort_order SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_shelf_books_shelf_sort
  ON public.custom_shelf_books (shelf_id, sort_order);

CREATE OR REPLACE FUNCTION public.custom_shelf_books_assign_sort_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(MAX(sort_order), -1) + 1
  INTO NEW.sort_order
  FROM public.custom_shelf_books
  WHERE shelf_id = NEW.shelf_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS custom_shelf_books_assign_sort_order ON public.custom_shelf_books;

CREATE TRIGGER custom_shelf_books_assign_sort_order
  BEFORE INSERT ON public.custom_shelf_books
  FOR EACH ROW
  EXECUTE FUNCTION public.custom_shelf_books_assign_sort_order();

CREATE OR REPLACE FUNCTION public.reorder_custom_shelf_books(
  p_shelf_id uuid,
  p_book_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  n int;
  i int;
BEGIN
  SELECT user_id INTO v_owner
  FROM public.custom_shelves
  WHERE id = p_shelf_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Shelf not found';
  END IF;

  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  n := COALESCE(array_length(p_book_ids, 1), 0);

  IF n = 0 THEN
    IF EXISTS (SELECT 1 FROM public.custom_shelf_books WHERE shelf_id = p_shelf_id) THEN
      RAISE EXCEPTION 'Book count mismatch';
    END IF;
    RETURN;
  END IF;

  IF (SELECT COUNT(DISTINCT x) FROM UNNEST(p_book_ids) AS u(x)) <> n THEN
    RAISE EXCEPTION 'Duplicate book ids in order payload';
  END IF;

  IF (SELECT COUNT(*) FROM public.custom_shelf_books WHERE shelf_id = p_shelf_id) <> n THEN
    RAISE EXCEPTION 'Book count mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.custom_shelf_books csb
    WHERE csb.shelf_id = p_shelf_id
      AND NOT (csb.book_id = ANY (p_book_ids))
  ) THEN
    RAISE EXCEPTION 'Shelf books mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM UNNEST(p_book_ids) AS bid(book_id)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.custom_shelf_books csb
      WHERE csb.shelf_id = p_shelf_id
        AND csb.book_id = bid.book_id
    )
  ) THEN
    RAISE EXCEPTION 'Extra book in payload';
  END IF;

  FOR i IN 1..n LOOP
    UPDATE public.custom_shelf_books
    SET sort_order = i - 1
    WHERE shelf_id = p_shelf_id
      AND book_id = p_book_ids[i];
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_custom_shelf_books(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_custom_shelf_books(uuid, uuid[]) TO authenticated;
