-- Replace legacy CHECK (chosen_by IN ('Matheus','Fabi','Barbara')) with uuid + FK to public.users.
-- Drop CHECK first so intermediate uuid-as-text values are valid during ALTER TYPE.

ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_chosen_by_check;

UPDATE public.books b
SET chosen_by = u.id::text
FROM public.users u
WHERE u.id::text = trim(b.chosen_by)
  OR lower(trim(coalesce(b.chosen_by, ''))) = lower(trim(coalesce(u.display_name::text, '')));

ALTER TABLE public.books
  ALTER COLUMN chosen_by TYPE uuid
  USING (trim(chosen_by)::uuid);

ALTER TABLE public.books
  ADD CONSTRAINT books_chosen_by_fkey
  FOREIGN KEY (chosen_by) REFERENCES public.users (id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
