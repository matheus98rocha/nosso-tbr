-- RPCs de estatísticas e leaderboard fazem JOIN em public.users para resolver display_name.
-- Visitantes (anon) precisam ler id + display_name sem expor email (RN46 complementar).

REVOKE SELECT ON TABLE public.users FROM anon;
GRANT SELECT (id, display_name) ON TABLE public.users TO anon;

DROP POLICY IF EXISTS users_select_anon ON public.users;

CREATE POLICY users_select_anon
  ON public.users
  FOR SELECT
  TO anon
  USING (true);
