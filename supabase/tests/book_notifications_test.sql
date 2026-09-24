BEGIN;

SELECT plan(9);

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001',
  true
);

INSERT INTO public.users (id, display_name, email)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Matheus', NULL),
  ('00000000-0000-4000-8000-000000000002', 'Fabi', NULL),
  ('00000000-0000-4000-8000-000000000003', 'Barbara', NULL),
  ('00000000-0000-4000-8000-000000000004', 'Carlos', NULL),
  ('00000000-0000-4000-8000-000000000005', 'Diana', NULL);

INSERT INTO public.authors (id, name)
VALUES
  ('00000000-0000-4000-8000-000000000101', 'Autor de teste');

INSERT INTO public.user_followers (follower_id, following_id)
VALUES
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001');

INSERT INTO public.user_notification_preferences (
  follower_id,
  following_id,
  book_notifications_enabled
)
VALUES (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  false
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
  '00000000-0000-4000-8000-000000000201',
  'Livro visível um',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  100,
  ARRAY['00000000-0000-4000-8000-000000000001']::uuid[],
  'not_started',
  '00000000-0000-4000-8000-000000000001'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
  ),
  1,
  'follower with default preference receives the notification'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000003'
  ),
  0,
  'follower with disabled preference does not receive the notification'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000001'
  ),
  0,
  'the actor does not receive a notification'
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
  '00000000-0000-4000-8000-000000000202',
  'Livro visível dois',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  100,
  ARRAY['00000000-0000-4000-8000-000000000001']::uuid[],
  'finished',
  '00000000-0000-4000-8000-000000000001'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NULL
  ),
  1,
  'new books from the same actor share one unread notification'
);

SELECT is(
  (
    SELECT book_count
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NULL
  ),
  2,
  'the unread notification increments its book count'
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
  '00000000-0000-4000-8000-000000000203',
  'Livro privado de Carlos',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000004',
  100,
  ARRAY['00000000-0000-4000-8000-000000000004']::uuid[],
  'reading',
  '00000000-0000-4000-8000-000000000004'
);

SELECT is(
  (
    SELECT book_count
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NULL
  ),
  2,
  'a book invisible to the recipient does not change its notification'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000004'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
  ),
  0,
  'a follower without access to a private book receives no notification'
);

SELECT public.mark_notification_read(
  (
    SELECT id
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NULL
  )
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NOT NULL
  ),
  1,
  'marking a notification as read preserves its history'
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
  '00000000-0000-4000-8000-000000000204',
  'Livro visível três',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  100,
  ARRAY['00000000-0000-4000-8000-000000000001']::uuid[],
  'planned',
  '00000000-0000-4000-8000-000000000001'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.notifications
    WHERE recipient_id = '00000000-0000-4000-8000-000000000002'
      AND actor_id = '00000000-0000-4000-8000-000000000001'
      AND read_at IS NULL
  ),
  1,
  'a new book after reading starts a new unread notification'
);

SELECT * FROM finish();
ROLLBACK;
