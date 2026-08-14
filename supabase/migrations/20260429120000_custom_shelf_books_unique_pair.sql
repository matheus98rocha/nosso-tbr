DELETE FROM public.custom_shelf_books csb
WHERE csb.id IN (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY shelf_id, book_id
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.custom_shelf_books
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS custom_shelf_books_shelf_book_unique
  ON public.custom_shelf_books (shelf_id, book_id);
