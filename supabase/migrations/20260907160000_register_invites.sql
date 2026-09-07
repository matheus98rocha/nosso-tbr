CREATE TABLE public.register_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE INDEX register_invites_expires_at_idx
  ON public.register_invites (expires_at);

CREATE INDEX register_invites_created_by_idx
  ON public.register_invites (created_by);

ALTER TABLE public.register_invites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.register_invites FROM anon, authenticated;
GRANT ALL ON TABLE public.register_invites TO service_role;
