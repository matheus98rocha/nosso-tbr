BEGIN;

SELECT plan(7);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'Alice', NULL),
  ('00000000-0000-4000-8000-0000000000a2', 'Bruno', NULL),
  ('00000000-0000-4000-8000-0000000000a3', 'Carol', NULL);

UPDATE public.users
SET tier = 'admin'
WHERE id = '00000000-0000-4000-8000-0000000000a1';

SELECT is(
  (
    SELECT tier::text
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a1'
  ),
  'admin',
  'a request without auth.uid() can change tier'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-0000000000a2',
  true
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}',
  true
);

DO $$
BEGIN
  UPDATE public.users
  SET tier = 'admin'
  WHERE id = '00000000-0000-4000-8000-0000000000a2';

  RAISE EXCEPTION 'expected self-service promotion to be rejected';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

SELECT is(
  (
    SELECT tier::text
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a2'
  ),
  'common_user',
  'an authenticated user cannot promote their own tier'
);

DO $$
BEGIN
  UPDATE public.users
  SET tier = 'admin'
  WHERE id = '00000000-0000-4000-8000-0000000000a3';

  RAISE EXCEPTION 'expected promotion of another account to be rejected';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

SELECT is(
  (
    SELECT tier::text
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a3'
  ),
  'common_user',
  'an authenticated user cannot promote another account'
);

DO $$
BEGIN
  INSERT INTO public.users (id, display_name, email, tier)
  VALUES (
    '00000000-0000-4000-8000-0000000000a4',
    'Dave',
    NULL,
    'admin'
  );

  RAISE EXCEPTION 'expected privileged insert to be rejected';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a4'
  ),
  0,
  'an authenticated insert cannot choose the admin tier'
);

INSERT INTO public.users (id, display_name, email, tier)
VALUES (
  '00000000-0000-4000-8000-0000000000a5',
  'Eve',
  NULL,
  'common_user'
);

SELECT is(
  (
    SELECT tier::text
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a5'
  ),
  'common_user',
  'an authenticated insert can keep the common tier'
);

UPDATE public.users
SET display_name = 'Bruno revisado'
WHERE id = '00000000-0000-4000-8000-0000000000a2';

SELECT is(
  (
    SELECT display_name
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a2'
  ),
  'Bruno revisado',
  'an authenticated profile edit that does not touch tier still saves'
);

UPDATE public.users
SET tier = 'common_user',
    display_name = 'Bruno confirmado'
WHERE id = '00000000-0000-4000-8000-0000000000a2';

SELECT is(
  (
    SELECT display_name || ':' || tier::text
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000a2'
  ),
  'Bruno confirmado:common_user',
  'rewriting the same tier does not raise'
);

SELECT * FROM finish();
ROLLBACK;
