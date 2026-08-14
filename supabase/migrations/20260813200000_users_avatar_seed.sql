ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_seed text;

REVOKE SELECT ON TABLE public.users FROM anon;
GRANT SELECT (id, display_name, avatar_seed) ON TABLE public.users TO anon;
