UPDATE public.books
SET end_date = inserted_at::date
WHERE status = 'finished'::public.book_status
  AND end_date IS NULL;

ALTER TABLE public.books
  DROP CONSTRAINT IF EXISTS books_finished_requires_end_date;

ALTER TABLE public.books
  ADD CONSTRAINT books_finished_requires_end_date
  CHECK (
    status <> 'finished'::public.book_status
    OR end_date IS NOT NULL
  );
