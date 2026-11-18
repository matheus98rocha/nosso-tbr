BEGIN;

SELECT plan(15);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000081', 'Alice', NULL),
  ('00000000-0000-4000-8000-000000000082', 'Bruno', NULL),
  ('00000000-0000-4000-8000-000000000083', 'Carla', NULL);

INSERT INTO public.authors (id, name)
VALUES ('00000000-0000-4000-8000-000000000181', 'Autor');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES (
  '00000000-0000-4000-8000-000000000082',
  '00000000-0000-4000-8000-000000000081'
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
    '00000000-0000-4000-8000-000000000281',
    'Diario solo',
    '00000000-0000-4000-8000-000000000181',
    '00000000-0000-4000-8000-000000000081',
    120,
    ARRAY['00000000-0000-4000-8000-000000000081']::uuid[],
    'reading',
    '00000000-0000-4000-8000-000000000081'
  ),
  (
    '00000000-0000-4000-8000-000000000282',
    'Sala coletiva',
    '00000000-0000-4000-8000-000000000181',
    '00000000-0000-4000-8000-000000000081',
    200,
    ARRAY[
      '00000000-0000-4000-8000-000000000081',
      '00000000-0000-4000-8000-000000000082'
    ]::uuid[],
    'finished',
    '00000000-0000-4000-8000-000000000081'
  );

CREATE OR REPLACE FUNCTION pg_temp.review_as(
  p_user uuid,
  p_sql text
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_user::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user)::text,
    true
  );
  EXECUTE 'SET LOCAL ROLE authenticated';
  EXECUTE p_sql;
  RETURN 'ok';
EXCEPTION
  WHEN OTHERS THEN
    RETURN SQLSTATE;
END;
$$;

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000081',
    $sql$
      INSERT INTO public.book_reviews (user_id, book_id, stars, content)
      VALUES (
        '00000000-0000-4000-8000-000000000081',
        '00000000-0000-4000-8000-000000000281',
        5,
        '  Gostei do meio  '
      )
    $sql$
  ),
  'ok',
  'a participant can publish a review in any status'
);

RESET ROLE;

SELECT is(
  (
    SELECT reading_status::text
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000281'
  ),
  'reading',
  'the stored status is the book status at write time'
);

SELECT is(
  (
    SELECT content
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000281'
  ),
  'Gostei do meio',
  'the review text is stored trimmed'
);

UPDATE public.books
SET status = 'paused'
WHERE id = '00000000-0000-4000-8000-000000000281';

SELECT is(
  (
    SELECT reading_status::text
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000281'
  ),
  'reading',
  'a later book status change does not rewrite the review'
);

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000083',
    $sql$
      INSERT INTO public.book_reviews (user_id, book_id, stars, content)
      VALUES (
        '00000000-0000-4000-8000-000000000083',
        '00000000-0000-4000-8000-000000000281',
        3,
        'Não participo'
      )
    $sql$
  ),
  '42501',
  'someone who does not participate cannot publish'
);

RESET ROLE;

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000081',
    $sql$
      INSERT INTO public.book_reviews (user_id, book_id, stars, content)
      VALUES (
        '00000000-0000-4000-8000-000000000081',
        '00000000-0000-4000-8000-000000000282',
        4,
        'Leitura em grupo'
      )
    $sql$
  ),
  'ok',
  'a participant can publish on a collective book'
);

RESET ROLE;

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000083',
    $sql$
      INSERT INTO public.book_review_comments (review_id, user_id, content)
      SELECT id, '00000000-0000-4000-8000-000000000083', 'Vi a sala'
      FROM public.book_reviews
      WHERE book_id = '00000000-0000-4000-8000-000000000282'
    $sql$
  ),
  'ok',
  'a collective review is visible to someone who does not follow the author'
);

RESET ROLE;

SELECT pg_temp.review_as(
  '00000000-0000-4000-8000-000000000083',
  $sql$
    INSERT INTO public.book_review_comments (review_id, user_id, content)
    SELECT id, '00000000-0000-4000-8000-000000000083', 'Não deveria ver'
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000281'
  $sql$
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.book_review_comments AS c
    JOIN public.book_reviews AS r ON r.id = c.review_id
    WHERE r.book_id = '00000000-0000-4000-8000-000000000281'
      AND c.user_id = '00000000-0000-4000-8000-000000000083'
  ),
  0,
  'a solo review stays hidden from someone who does not follow the author'
);

RESET ROLE;

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000082',
    $sql$
      INSERT INTO public.book_review_reactions (review_id, user_id, reaction)
      SELECT id, '00000000-0000-4000-8000-000000000082', 'like'
      FROM public.book_reviews
      WHERE book_id = '00000000-0000-4000-8000-000000000281'
    $sql$
  ),
  'ok',
  'a follower can react to a solo review'
);

RESET ROLE;

SELECT is(
  pg_temp.review_as(
    '00000000-0000-4000-8000-000000000081',
    $sql$
      INSERT INTO public.book_review_reactions (review_id, user_id, reaction)
      SELECT id, '00000000-0000-4000-8000-000000000081', 'like'
      FROM public.book_reviews
      WHERE book_id = '00000000-0000-4000-8000-000000000281'
    $sql$
  ) <> 'ok',
  true,
  'the author cannot react to their own review'
);

RESET ROLE;

INSERT INTO public.book_reading_ratings (user_id, book_id, stars)
VALUES (
  '00000000-0000-4000-8000-000000000081',
  '00000000-0000-4000-8000-000000000282',
  2
);

SELECT is(
  (
    SELECT stars
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000282'
  ),
  2::smallint,
  'saving the private rating updates the review stars'
);

UPDATE public.books
SET status = 'paused'
WHERE id = '00000000-0000-4000-8000-000000000282';

UPDATE public.book_reading_ratings
SET stars = 1
WHERE user_id = '00000000-0000-4000-8000-000000000081'
  AND book_id = '00000000-0000-4000-8000-000000000282';

SELECT is(
  (
    SELECT reading_status::text || ':' || stars::text
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000282'
  ),
  'finished:1',
  'a stars-only rating keeps the review status snapshot'
);

SELECT is(
  (
    SELECT like_count::text
      || ':' || dislike_count::text
      || ':' || comment_count::text
      || ':' || book_is_solo::text
    FROM public.get_review_feed('all', 30, NULL, NULL)
    WHERE book_id = '00000000-0000-4000-8000-000000000281'
  ),
  '1:0:0:true',
  'the feed keeps reaction counts apart from the solo flag'
);

SELECT is(
  (
    SELECT like_count::text
      || ':' || comment_count::text
      || ':' || book_is_solo::text
    FROM public.get_review_feed('all', 30, NULL, NULL)
    WHERE book_id = '00000000-0000-4000-8000-000000000282'
  ),
  '0:1:false',
  'a collective review is not marked solo in the feed'
);

DO $$
DECLARE
  v_rejected boolean := false;
BEGIN
  BEGIN
  WITH root AS (
    INSERT INTO public.book_review_comments (review_id, user_id, content)
    SELECT id, '00000000-0000-4000-8000-000000000082', 'Comentário'
    FROM public.book_reviews
    WHERE book_id = '00000000-0000-4000-8000-000000000282'
    RETURNING id, review_id
  ),
  reply AS (
    INSERT INTO public.book_review_comments (review_id, user_id, parent_id, content)
    SELECT review_id, '00000000-0000-4000-8000-000000000082', id, 'Resposta'
    FROM root
    RETURNING id, review_id
  )
  INSERT INTO public.book_review_comments (review_id, user_id, parent_id, content)
  SELECT review_id, '00000000-0000-4000-8000-000000000082', id, 'Resposta da resposta'
  FROM reply;
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      v_rejected := true;
  END;

  IF NOT v_rejected THEN
    RAISE EXCEPTION 'nested reply was accepted' USING ERRCODE = 'P0002';
  END IF;
END $$;

SELECT pass('a reply to a reply is rejected');

ROLLBACK;
