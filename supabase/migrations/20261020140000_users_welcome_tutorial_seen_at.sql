ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS welcome_tutorial_seen_at timestamptz;

UPDATE public.users
SET welcome_tutorial_seen_at = now()
WHERE welcome_tutorial_seen_at IS NULL;
