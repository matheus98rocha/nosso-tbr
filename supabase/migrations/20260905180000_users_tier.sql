CREATE TYPE public.user_tier AS ENUM ('admin', 'common_user');

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier public.user_tier NOT NULL DEFAULT 'common_user';

UPDATE public.users
SET tier = 'admin'
WHERE id = 'bd12cc9a-51ec-452d-8722-a97547b6e0c0';
