BEGIN;

SELECT plan(4);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000011', 'Alice', NULL),
  ('00000000-0000-4000-8000-000000000012', 'Bruno', NULL),
  ('00000000-0000-4000-8000-000000000013', 'Carla', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-000000000111', 'Autor privado');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES (
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000013'
);

INSERT INTO public.books (
  id,
  title,
  author_id,
  chosen_by,
  pages,
  readers,
  status,
  end_date,
  user_id
)
VALUES
  (
    '00000000-0000-4000-8000-000000000211',
    'Diario secreto',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000012',
    320,
    ARRAY[
      '00000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-000000000013'
    ]::uuid[],
    'finished',
    DATE '2026-03-01',
    '00000000-0000-4000-8000-000000000012'
  ),
  (
    '00000000-0000-4000-8000-000000000212',
    'Leitura da Alice',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000011',
    180,
    ARRAY['00000000-0000-4000-8000-000000000011']::uuid[],
    'finished',
    DATE '2026-04-01',
    '00000000-0000-4000-8000-000000000011'
  );

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.get_reading_stats_by_reader('00000000-0000-4000-8000-000000000012')
  ),
  0,
  'another reader id does not expose private yearly stats'
);

SELECT is(
  (
    SELECT longest_book_title
    FROM public.get_reading_stats_by_reader('00000000-0000-4000-8000-000000000011')
  ),
  'Leitura da Alice',
  'the signed-in reader still receives their own stats'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.get_reader_collaboration_stats('00000000-0000-4000-8000-000000000012')
  ),
  0,
  'another reader id does not expose follow-scoped collaboration'
);

SELECT is(
  (
    SELECT reader_name
    FROM public.get_reader_collaboration_stats('Alice')
  ),
  'Alice',
  'the signed-in reader can still resolve their own collaboration by name'
);

SELECT * FROM finish();
ROLLBACK;
