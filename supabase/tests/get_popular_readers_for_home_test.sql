BEGIN;

SELECT plan(4);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000071', 'Alice', NULL),
  ('00000000-0000-4000-8000-000000000072', 'Bruno', NULL),
  ('00000000-0000-4000-8000-000000000073', 'Carla', NULL),
  ('00000000-0000-4000-8000-000000000074', 'Dana', NULL),
  ('00000000-0000-4000-8000-000000000075', 'Elena', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-000000000171', 'Autor');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES
  (
    '00000000-0000-4000-8000-000000000073',
    '00000000-0000-4000-8000-000000000072'
  ),
  (
    '00000000-0000-4000-8000-000000000074',
    '00000000-0000-4000-8000-000000000072'
  );

INSERT INTO public.books (
  id,
  title,
  author_id,
  chosen_by,
  pages,
  readers,
  gender,
  status,
  user_id
)
VALUES
  (
    '00000000-0000-4000-8000-000000000271',
    'Fantasia da Alice',
    '00000000-0000-4000-8000-000000000171',
    '00000000-0000-4000-8000-000000000071',
    180,
    ARRAY['00000000-0000-4000-8000-000000000071']::uuid[],
    'Fantasia',
    'finished',
    '00000000-0000-4000-8000-000000000071'
  ),
  (
    '00000000-0000-4000-8000-000000000272',
    'Fantasia publica',
    '00000000-0000-4000-8000-000000000171',
    '00000000-0000-4000-8000-000000000072',
    220,
    ARRAY[
      '00000000-0000-4000-8000-000000000072',
      '00000000-0000-4000-8000-000000000073'
    ]::uuid[],
    'Fantasia',
    'finished',
    '00000000-0000-4000-8000-000000000072'
  ),
  (
    '00000000-0000-4000-8000-000000000273',
    'Diario secreto',
    '00000000-0000-4000-8000-000000000171',
    '00000000-0000-4000-8000-000000000075',
    90,
    ARRAY['00000000-0000-4000-8000-000000000075']::uuid[],
    'Fantasia',
    'finished',
    '00000000-0000-4000-8000-000000000075'
  );

CREATE OR REPLACE FUNCTION pg_temp.popular_readers_as_alice()
RETURNS TABLE (
  reader_id uuid,
  follower_count bigint,
  shared_gender_count bigint,
  score numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claim.sub',
    '00000000-0000-4000-8000-000000000071',
    true
  );
  EXECUTE 'SET LOCAL ROLE authenticated';
  RETURN QUERY
  SELECT
    ranked.reader_id,
    ranked.follower_count,
    ranked.shared_gender_count,
    ranked.score
  FROM public.get_popular_readers_for_home(24) AS ranked;
END;
$$;

SELECT is(
  (
    SELECT follower_count::integer
    FROM pg_temp.popular_readers_as_alice()
    WHERE reader_id = '00000000-0000-4000-8000-000000000072'
  ),
  2,
  'follower count includes follows the viewer is not part of'
);

SELECT is(
  (
    SELECT shared_gender_count::integer
    FROM pg_temp.popular_readers_as_alice()
    WHERE reader_id = '00000000-0000-4000-8000-000000000075'
  ),
  0,
  'a private solo book does not count toward genre overlap'
);

SELECT ok(
  (
    SELECT bruno.score > elena.score
    FROM pg_temp.popular_readers_as_alice() AS bruno
    JOIN pg_temp.popular_readers_as_alice() AS elena
      ON elena.reader_id = '00000000-0000-4000-8000-000000000075'
    WHERE bruno.reader_id = '00000000-0000-4000-8000-000000000072'
  ),
  'real follower counts outrank a reader whose overlap is only private'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM pg_temp.popular_readers_as_alice()
    WHERE reader_id = '00000000-0000-4000-8000-000000000071'
  ),
  0,
  'the signed-in reader is excluded'
);

SELECT * FROM finish();
ROLLBACK;
