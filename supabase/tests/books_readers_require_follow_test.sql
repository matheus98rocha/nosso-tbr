BEGIN;

SELECT plan(5);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000011', 'Alice', NULL),
  ('00000000-0000-4000-8000-000000000012', 'Bruno', NULL),
  ('00000000-0000-4000-8000-000000000013', 'Carla', NULL),
  ('00000000-0000-4000-8000-000000000014', 'Dana', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-000000000111', 'Autor');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES (
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012'
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
VALUES (
  '00000000-0000-4000-8000-000000000211',
  'Diario solo',
  '00000000-0000-4000-8000-000000000111',
  '00000000-0000-4000-8000-000000000011',
  220,
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000013'
  ]::uuid[],
  'reading',
  '00000000-0000-4000-8000-000000000011'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);

DO $$
BEGIN
  UPDATE public.books
  SET readers = ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000014'
  ]::uuid[]
  WHERE id = '00000000-0000-4000-8000-000000000211';

  RAISE EXCEPTION 'expected follow check to reject the update';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000013'
  ]::uuid[],
  'a direct update cannot add a reader the actor does not follow'
);

UPDATE public.books
SET title = 'Diario solo revisado',
    readers = ARRAY[
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000013'
    ]::uuid[]
WHERE id = '00000000-0000-4000-8000-000000000211';

SELECT is(
  (
    SELECT title
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  'Diario solo revisado',
  'keeping a reader the actor does not follow still saves the book'
);

UPDATE public.books
SET readers = ARRAY[
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000013',
  '00000000-0000-4000-8000-000000000012'
]::uuid[]
WHERE id = '00000000-0000-4000-8000-000000000211';

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000012'
  ]::uuid[],
  'a direct update can add a reader the actor follows'
);

DO $$
BEGIN
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
  VALUES (
    '00000000-0000-4000-8000-000000000212',
    'Livro com estranho',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000011',
    100,
    ARRAY[
      '00000000-0000-4000-8000-000000000011',
      '00000000-0000-4000-8000-000000000014'
    ]::uuid[],
    'not_started',
    '00000000-0000-4000-8000-000000000011'
  );

  RAISE EXCEPTION 'expected follow check to reject the insert';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END $$;

SELECT is(
  (
    SELECT count(*)
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000212'
  ),
  0::bigint,
  'creating a book cannot include a reader the actor does not follow'
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
VALUES (
  '00000000-0000-4000-8000-000000000213',
  'Livro com seguido',
  '00000000-0000-4000-8000-000000000111',
  '00000000-0000-4000-8000-000000000011',
  140,
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012'
  ]::uuid[],
  'not_started',
  '00000000-0000-4000-8000-000000000011'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000213'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012'
  ]::uuid[],
  'creating a book can include a reader the actor follows'
);

SELECT * FROM finish();
ROLLBACK;
