-- Legacy data: some rows stored multiple display names in one array element (e.g. 'Barbara,Fabi').
-- Split each element on commas, trim tokens, then resolve to user id by UUID text or display_name (case-insensitive).

UPDATE books b
SET readers = s.cleaned
FROM (
  SELECT
    b2.id,
    COALESCE(
      array_agg(resolved.id::text ORDER BY t.ord, s.subord) FILTER (WHERE resolved.id IS NOT NULL),
      ARRAY[]::text[]
    ) AS cleaned
  FROM books AS b2
  CROSS JOIN LATERAL unnest(COALESCE(b2.readers, ARRAY[]::text[])) WITH ORDINALITY AS t(elem, ord)
  CROSS JOIN LATERAL (
    SELECT *
    FROM regexp_split_to_table(trim(both FROM t.elem), ',') WITH ORDINALITY AS s2(token, subord)
    WHERE trim(both FROM s2.token) <> ''
  ) AS s
  LEFT JOIN LATERAL (
    SELECT u.id
    FROM public.users u
    WHERE u.id::text = trim(both FROM s.token)
      OR lower(trim(both FROM coalesce(u.display_name::text, ''))) = lower(trim(both FROM s.token))
    ORDER BY CASE WHEN u.id::text = trim(both FROM s.token) THEN 0 ELSE 1 END
    LIMIT 1
  ) resolved ON true
  GROUP BY b2.id
) AS s
WHERE b.id = s.id
  AND b.readers IS DISTINCT FROM s.cleaned;

ALTER TABLE public.books
  ALTER COLUMN readers TYPE uuid[]
  USING (COALESCE(readers, ARRAY[]::text[])::uuid[]);

CREATE TABLE IF NOT EXISTS public.user_followers (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_followers_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_followers_no_self CHECK (follower_id <> following_id),
  CONSTRAINT user_followers_follower_fk FOREIGN KEY (follower_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT user_followers_following_fk FOREIGN KEY (following_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON public.user_followers (following_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower_id ON public.user_followers (follower_id);

ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_followers_select_authenticated" ON public.user_followers;
CREATE POLICY "user_followers_select_authenticated"
  ON public.user_followers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "user_followers_insert_own_row" ON public.user_followers;
CREATE POLICY "user_followers_insert_own_row"
  ON public.user_followers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "user_followers_delete_own_row" ON public.user_followers;
CREATE POLICY "user_followers_delete_own_row"
  ON public.user_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

INSERT INTO public.user_followers (follower_id, following_id)
SELECT f.id, g.id
FROM public.users AS f
CROSS JOIN public.users AS g
WHERE lower(trim(both FROM coalesce(f.display_name::text, ''))) IN (
  'matheus',
  'fabi',
  'barbara'
)
  AND lower(trim(both FROM coalesce(g.display_name::text, ''))) IN (
  'matheus',
  'fabi',
  'barbara'
)
  AND f.id <> g.id
ON CONFLICT DO NOTHING;
