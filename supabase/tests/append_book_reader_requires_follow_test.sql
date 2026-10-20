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
  ARRAY['00000000-0000-4000-8000-000000000011']::uuid[],
  'reading',
  '00000000-0000-4000-8000-000000000011'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000011',
  true
);

SELECT is(
  public.append_book_reader(
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000013'
  ),
  false,
  'a participant cannot add a reader they do not follow'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY['00000000-0000-4000-8000-000000000011']::uuid[],
  'a refused append leaves the solo readers array unchanged'
);

SELECT is(
  public.append_book_reader(
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000011'
  ),
  false,
  'a participant cannot add themselves through this function'
);

SELECT is(
  public.append_book_reader(
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000012'
  ),
  true,
  'a participant can add a reader they follow'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012'
  ]::uuid[],
  'the followed reader is appended after the current readers'
);

SELECT is(
  public.append_book_reader(
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000012'
  ),
  true,
  'adding a reader who is already on the book is a no-op success'
);

SELECT is(
  (
    SELECT readers
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-000000000211'
  ),
  ARRAY[
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000012'
  ]::uuid[],
  'a repeated append does not duplicate readers'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000014',
  true
);

SELECT is(
  public.append_book_reader(
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000013'
  ),
  false,
  'someone who does not participate cannot append a reader'
);

SELECT * FROM finish();
ROLLBACK;
