BEGIN;

SELECT plan(8);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000011', 'Alice', NULL),
  ('00000000-0000-4000-8000-000000000012', 'Bruno', NULL),
  ('00000000-0000-4000-8000-000000000013', 'Carla', NULL),
  ('00000000-0000-4000-8000-000000000014', 'Dana', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-000000000111', 'Autor');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES
  (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000011'
  );

INSERT INTO public.books (
  id,
  title,
  author_id,
  chosen_by,
  pages,
  readers,
  status,
  user_id
)
VALUES
  (
    '00000000-0000-4000-8000-000000000211',
    'Ainda não começamos',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000012',
    200,
    ARRAY['00000000-0000-4000-8000-000000000012']::uuid[],
    'not_started',
    '00000000-0000-4000-8000-000000000012'
  ),
  (
    '00000000-0000-4000-8000-000000000212',
    'Já em leitura',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000012',
    180,
    ARRAY['00000000-0000-4000-8000-000000000012']::uuid[],
    'reading',
    '00000000-0000-4000-8000-000000000012'
  ),
  (
    '00000000-0000-4000-8000-000000000213',
    'Sem mútuo seguir',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000013',
    140,
    ARRAY['00000000-0000-4000-8000-000000000013']::uuid[],
    'not_started',
    '00000000-0000-4000-8000-000000000013'
  ),
  (
    '00000000-0000-4000-8000-000000000214',
    'Alice já lê',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000012',
    90,
    ARRAY[
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-000000000014'
    ]::uuid[],
    'finished',
    '00000000-0000-4000-8000-000000000012'
  );

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);

SELECT is(
  public.link_current_reader_to_book('00000000-0000-4000-8000-000000000211'),
  true,
  'a mutual follower joins a not-started book'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000011'
  ]::uuid[],
  'join appends the caller and keeps the readers already on the book'
);

SELECT is(
  public.link_current_reader_to_book('00000000-0000-4000-8000-000000000212'),
  false,
  'a book that already started cannot be joined'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000212'
  ),
  ARRAY['00000000-0000-4000-8000-000000000012']::uuid[],
  'a refused join does not rewrite readers'
);

SELECT is(
  public.link_current_reader_to_book('00000000-0000-4000-8000-000000000213'),
  false,
  'join requires a mutual follow with the counterpart reader'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000213'
  ),
  ARRAY['00000000-0000-4000-8000-000000000013']::uuid[],
  'a reader without a mutual follow is not added'
);

SELECT is(
  public.link_current_reader_to_book('00000000-0000-4000-8000-000000000214'),
  true,
  'a reader who is already on the book is a no-op success'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000214'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000014'
  ]::uuid[],
  'an existing reader does not replace the current readers array'
);

SELECT * FROM finish();
ROLLBACK;
