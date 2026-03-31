-- RLS aligned with BUSINESS_RULES.md §7 (RN41–RN47).
-- Replaces permissive grants for anon writes; secures books, quotes, schedule, shelves, users, authors, book_authors.

-- ---------------------------------------------------------------------------
-- books: drop legacy policies (RLS was off; policies were inactive)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Apenas donos editam" ON public.books;
DROP POLICY IF EXISTS "Apenas donos inserem" ON public.books;
DROP POLICY IF EXISTS "Leitura pública de livros" ON public.books;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books FORCE ROW LEVEL SECURITY;

-- Participation: creator, chosen_by, or member of readers (RN42)
CREATE POLICY books_select_all
  ON public.books
  FOR SELECT
  USING (true);

CREATE POLICY books_insert_authenticated
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR auth.uid() = chosen_by
      OR auth.uid() = ANY (COALESCE(readers, ARRAY[]::uuid[]))
    )
  );

CREATE POLICY books_update_authenticated
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR auth.uid() = chosen_by
    OR auth.uid() = ANY (COALESCE(readers, ARRAY[]::uuid[]))
  )
  WITH CHECK (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR auth.uid() = chosen_by
    OR auth.uid() = ANY (COALESCE(readers, ARRAY[]::uuid[]))
  );

CREATE POLICY books_delete_authenticated
  ON public.books
  FOR DELETE
  TO authenticated
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR auth.uid() = chosen_by
    OR auth.uid() = ANY (COALESCE(readers, ARRAY[]::uuid[]))
  );

-- ---------------------------------------------------------------------------
-- quotes (RN43)
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes FORCE ROW LEVEL SECURITY;

CREATE POLICY quotes_select_all
  ON public.quotes
  FOR SELECT
  USING (true);

CREATE POLICY quotes_insert_authenticated
  ON public.quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

CREATE POLICY quotes_update_authenticated
  ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

CREATE POLICY quotes_delete_authenticated
  ON public.quotes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- schedule (RN44)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow all insert" ON public.schedule;
DROP POLICY IF EXISTS "allow all select" ON public.schedule;
DROP POLICY IF EXISTS "allow all update" ON public.schedule;
DROP POLICY IF EXISTS "delete own schedule" ON public.schedule;

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule FORCE ROW LEVEL SECURITY;

CREATE POLICY schedule_select_own
  ON public.schedule
  FOR SELECT
  TO authenticated
  USING (owner = auth.uid());

CREATE POLICY schedule_anon_select
  ON public.schedule
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY schedule_insert_own
  ON public.schedule
  FOR INSERT
  TO authenticated
  WITH CHECK (owner = auth.uid());

CREATE POLICY schedule_update_own
  ON public.schedule
  FOR UPDATE
  TO authenticated
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

CREATE POLICY schedule_delete_own
  ON public.schedule
  FOR DELETE
  TO authenticated
  USING (owner = auth.uid());

-- ---------------------------------------------------------------------------
-- custom_shelves & custom_shelf_books (RN45)
-- ---------------------------------------------------------------------------
ALTER TABLE public.custom_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_shelves FORCE ROW LEVEL SECURITY;

CREATE POLICY custom_shelves_select_own
  ON public.custom_shelves
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY custom_shelves_select_anon
  ON public.custom_shelves
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY custom_shelves_insert_own
  ON public.custom_shelves
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY custom_shelves_update_own
  ON public.custom_shelves
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY custom_shelves_delete_own
  ON public.custom_shelves
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.custom_shelf_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_shelf_books FORCE ROW LEVEL SECURITY;

CREATE POLICY custom_shelf_books_select_shelf_owner
  ON public.custom_shelf_books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.custom_shelves s
      WHERE s.id = shelf_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY custom_shelf_books_select_anon
  ON public.custom_shelf_books
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY custom_shelf_books_insert_shelf_owner
  ON public.custom_shelf_books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_shelves s
      WHERE s.id = shelf_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY custom_shelf_books_update_shelf_owner
  ON public.custom_shelf_books
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.custom_shelves s
      WHERE s.id = shelf_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_shelves s
      WHERE s.id = shelf_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY custom_shelf_books_delete_shelf_owner
  ON public.custom_shelf_books
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.custom_shelves s
      WHERE s.id = shelf_id
        AND s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- public.users (RN46)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_select_authenticated
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY users_select_anon
  ON public.users
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY users_insert_own
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_delete_own
  ON public.users
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- authors (RN47)
-- ---------------------------------------------------------------------------
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors FORCE ROW LEVEL SECURITY;

CREATE POLICY authors_select_all
  ON public.authors
  FOR SELECT
  USING (true);

CREATE POLICY authors_insert_authenticated
  ON public.authors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY authors_update_authenticated
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY authors_delete_unused
  ON public.authors
  FOR DELETE
  TO authenticated
  USING (
    NOT EXISTS (SELECT 1 FROM public.books b WHERE b.author_id = authors.id)
    AND NOT EXISTS (
      SELECT 1 FROM public.book_authors ba WHERE ba.author_id = authors.id
    )
  );

-- ---------------------------------------------------------------------------
-- book_authors (junction; same book mutation rule as quotes)
-- ---------------------------------------------------------------------------
ALTER TABLE public.book_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_authors FORCE ROW LEVEL SECURITY;

CREATE POLICY book_authors_select_all
  ON public.book_authors
  FOR SELECT
  USING (true);

CREATE POLICY book_authors_insert_authenticated
  ON public.book_authors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

CREATE POLICY book_authors_update_authenticated
  ON public.book_authors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

CREATE POLICY book_authors_delete_authenticated
  ON public.book_authors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.books b
      WHERE b.id = book_id
        AND (
          (b.user_id IS NOT NULL AND auth.uid() = b.user_id)
          OR auth.uid() = b.chosen_by
          OR auth.uid() = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Revoke destructive privileges from anon (RN41)
-- ---------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.books FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.authors FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.quotes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.schedule FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.custom_shelves FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.custom_shelf_books FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.users FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.book_authors FROM anon;
