-- Remove 100% dos rastros das usuárias Fabi e Barbara do Nosso TBR.
-- Matheus (dono/leitor substituto): bd12cc9a-51ec-452d-8722-a97547b6e0c0
-- Fabi: be1cb368-a253-489b-8615-c88d06616777
-- Barbara: 377b489e-2a7b-4320-a627-c4db58cfcee7
--
-- Ordem de execução:
-- 1. books (EXECUTADO em 2026-06-13)
-- 2. schedule
-- 3. custom_shelves (cascade em custom_shelf_books)
-- 4. user_followers
-- 5. user_book_favorites / book_reading_ratings / collective_reading_* (se houver)
-- 6. public.users + auth.users

BEGIN;

DO $$
DECLARE
  v_fabi uuid := 'be1cb368-a253-489b-8615-c88d06616777';
  v_barbara uuid := '377b489e-2a7b-4320-a627-c4db58cfcee7';
  v_matheus uuid := 'bd12cc9a-51ec-452d-8722-a97547b6e0c0';
  v_targets uuid[] := ARRAY[v_fabi, v_barbara];
  v_deleted integer;
  v_updated integer;
BEGIN
  CREATE TEMP TABLE tmp_books_cleanup ON COMMIT DROP AS
  SELECT
    b.id,
    (
      SELECT COALESCE(array_agg(r ORDER BY r), ARRAY[]::uuid[])
      FROM unnest(b.readers) AS r
      WHERE r <> ALL (v_targets)
    ) AS readers_clean
  FROM public.books b
  WHERE b.user_id = ANY (v_targets)
     OR b.chosen_by = ANY (v_targets)
     OR b.readers && v_targets;

  DELETE FROM public.books b
  USING tmp_books_cleanup t
  WHERE b.id = t.id
    AND cardinality(t.readers_clean) = 0;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.books b
  SET
    readers = t.readers_clean,
    user_id = CASE
      WHEN b.user_id = ANY (v_targets) THEN v_matheus
      ELSE b.user_id
    END,
    chosen_by = CASE
      WHEN b.chosen_by = ANY (v_targets) THEN v_matheus
      ELSE b.chosen_by
    END
  FROM tmp_books_cleanup t
  WHERE b.id = t.id
    AND cardinality(t.readers_clean) > 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE 'books: % deletados, % atualizados', v_deleted, v_updated;
END $$;

UPDATE public.schedule
SET owner = 'bd12cc9a-51ec-452d-8722-a97547b6e0c0'::uuid
WHERE owner IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.custom_shelves
WHERE user_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.user_followers
WHERE follower_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
)
OR following_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.user_book_favorites
WHERE user_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.book_reading_ratings
WHERE user_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.collective_reading_comment_reactions
WHERE user_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.collective_reading_comments
WHERE user_id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM public.users
WHERE id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

DELETE FROM auth.users
WHERE id IN (
  'be1cb368-a253-489b-8615-c88d06616777'::uuid,
  '377b489e-2a7b-4320-a627-c4db58cfcee7'::uuid
);

COMMIT;
