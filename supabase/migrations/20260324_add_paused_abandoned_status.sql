DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'book_status'
      AND e.enumlabel = 'paused'
  ) THEN
    ALTER TYPE public.book_status ADD VALUE 'paused';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'book_status'
      AND e.enumlabel = 'abandoned'
  ) THEN
    ALTER TYPE public.book_status ADD VALUE 'abandoned';
  END IF;
END $$;

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS status public.book_status NOT NULL DEFAULT 'not_started';

UPDATE public.books
SET status = CASE
  WHEN end_date IS NOT NULL THEN 'finished'::public.book_status
  WHEN start_date IS NOT NULL THEN 'reading'::public.book_status
  WHEN planned_start_date IS NOT NULL THEN 'planned'::public.book_status
  ELSE 'not_started'::public.book_status
END
WHERE status IS NULL
   OR status = 'not_started'::public.book_status;
