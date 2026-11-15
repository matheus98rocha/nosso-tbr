BEGIN;

SELECT plan(5);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'Alice', NULL),
  ('00000000-0000-4000-8000-0000000000e2', 'Bruno', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-0000000000e3', 'Autor');

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
  '00000000-0000-4000-8000-0000000000e4',
  'Com nulo',
  '00000000-0000-4000-8000-0000000000e3',
  '00000000-0000-4000-8000-0000000000e2',
  180,
  ARRAY[
    NULL,
    '00000000-0000-4000-8000-0000000000e1'
  ]::uuid[],
  'reading',
  '00000000-0000-4000-8000-0000000000e1'
);

SELECT is(
  public.reader_book_survivor_ids(
    ARRAY[
      NULL,
      '00000000-0000-4000-8000-0000000000e1'
    ]::uuid[],
    '00000000-0000-4000-8000-0000000000e2',
    '00000000-0000-4000-8000-0000000000e1',
    '00000000-0000-4000-8000-0000000000e1'
  )::text,
  ARRAY['00000000-0000-4000-8000-0000000000e2']::uuid[]::text,
  'a null reader does not hide a living chosen_by'
);

SELECT lives_ok(
  $$
    SELECT public.delete_reader_cascade(
      '00000000-0000-4000-8000-0000000000e1'
    )
  $$,
  'cascade runs when readers contain null and a living chosen_by'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-0000000000e4'
  ),
  1,
  'a readers array with null plus a living chosen_by does not delete the book'
);

SELECT is(
  (
    SELECT chosen_by::text
    FROM public.books
    WHERE id = '00000000-0000-4000-8000-0000000000e4'
  ),
  '00000000-0000-4000-8000-0000000000e2',
  'the living chosen_by stays responsible for the book'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.users
    WHERE id = '00000000-0000-4000-8000-0000000000e1'
  ),
  0,
  'the departing reader is removed while the book stays'
);

SELECT * FROM finish();
ROLLBACK;
