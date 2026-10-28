CREATE TABLE public.registration_settings (
  id text PRIMARY KEY DEFAULT 'default',
  mode text NOT NULL DEFAULT 'invite',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT registration_settings_singleton CHECK (id = 'default'),
  CONSTRAINT registration_settings_mode_check CHECK (mode IN ('invite', 'open'))
);

INSERT INTO public.registration_settings (id, mode)
VALUES ('default', 'invite');

ALTER TABLE public.registration_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.registration_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.registration_settings TO service_role;
