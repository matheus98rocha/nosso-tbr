-- Resenhas: uma por leitor e livro, visíveis para quem já pode ver o livro.
-- O status da leitura é gravado pelo banco. As estrelas acompanham book_reading_ratings.

CREATE TABLE public.book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books (id) ON DELETE CASCADE,
  stars smallint NOT NULL,
  content text NOT NULL,
  reading_status public.book_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_reviews_user_book_key UNIQUE (user_id, book_id),
  CONSTRAINT book_reviews_stars_check CHECK (stars >= 1 AND stars <= 5),
  CONSTRAINT book_reviews_content_check CHECK (
    char_length(content) BETWEEN 1 AND 500
    AND content = btrim(content)
  )
);

CREATE INDEX book_reviews_feed_idx
  ON public.book_reviews (created_at DESC, id DESC);

CREATE INDEX book_reviews_user_created_idx
  ON public.book_reviews (user_id, created_at DESC);

CREATE TABLE public.book_review_reactions (
  review_id uuid NOT NULL REFERENCES public.book_reviews (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_review_reactions_pkey PRIMARY KEY (review_id, user_id),
  CONSTRAINT book_review_reactions_kind_check CHECK (reaction IN ('like', 'dislike'))
);

CREATE INDEX book_review_reactions_user_idx
  ON public.book_review_reactions (user_id);

CREATE TABLE public.book_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.book_reviews (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.book_review_comments (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT book_review_comments_content_check CHECK (
    char_length(content) BETWEEN 1 AND 500
    AND content = btrim(content)
  )
);

CREATE INDEX book_review_comments_review_created_idx
  ON public.book_review_comments (review_id, created_at, id);

CREATE OR REPLACE FUNCTION public.book_reviews_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status public.book_status;
BEGIN
  SELECT b.status
  INTO v_status
  FROM public.books AS b
  WHERE b.id = NEW.book_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Livro não encontrado para a resenha.'
      USING ERRCODE = 'P0002';
  END IF;

  NEW.content := btrim(NEW.content);

  IF TG_OP = 'INSERT' THEN
    NEW.reading_status := v_status;
  ELSE
    NEW.reading_status := OLD.reading_status;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS book_reviews_before_write ON public.book_reviews;

CREATE TRIGGER book_reviews_before_write
  BEFORE INSERT OR UPDATE ON public.book_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.book_reviews_before_write();

CREATE OR REPLACE FUNCTION public.book_reading_ratings_sync_review_stars()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.book_reviews
  SET stars = NEW.stars
  WHERE user_id = NEW.user_id
    AND book_id = NEW.book_id
    AND stars IS DISTINCT FROM NEW.stars;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS book_reading_ratings_sync_review_stars
  ON public.book_reading_ratings;

CREATE TRIGGER book_reading_ratings_sync_review_stars
  AFTER INSERT OR UPDATE OF stars ON public.book_reading_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.book_reading_ratings_sync_review_stars();

CREATE OR REPLACE FUNCTION public.book_review_comments_validate_parent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_parent_review uuid;
  v_parent_parent uuid;
BEGIN
  NEW.content := btrim(NEW.content);

  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT review_id, parent_id
  INTO v_parent_review, v_parent_parent
  FROM public.book_review_comments
  WHERE id = NEW.parent_id;

  IF v_parent_review IS NULL THEN
    RAISE EXCEPTION 'Comentário pai não encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_parent_parent IS NOT NULL THEN
    RAISE EXCEPTION 'Respostas só podem ser feitas ao comentário principal.'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_parent_review IS DISTINCT FROM NEW.review_id THEN
    RAISE EXCEPTION 'A resposta precisa ser da mesma resenha.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS book_review_comments_validate_parent
  ON public.book_review_comments;

CREATE TRIGGER book_review_comments_validate_parent
  BEFORE INSERT OR UPDATE ON public.book_review_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.book_review_comments_validate_parent();

ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.book_review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_review_reactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.book_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_review_comments FORCE ROW LEVEL SECURITY;

CREATE POLICY book_reviews_select_visible
  ON public.book_reviews
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.books AS b
      WHERE b.id = book_reviews.book_id
        AND public.is_book_visible_to_current_user(b.readers, b.chosen_by)
    )
  );

CREATE POLICY book_reviews_insert_participant
  ON public.book_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.books AS b
      WHERE b.id = book_reviews.book_id
        AND (
          b.user_id IS NOT DISTINCT FROM auth.uid()
          OR b.chosen_by = auth.uid()
          OR auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))
        )
    )
  );

CREATE POLICY book_reviews_update_own
  ON public.book_reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.books AS b
      WHERE b.id = book_reviews.book_id
        AND (
          b.user_id IS NOT DISTINCT FROM auth.uid()
          OR b.chosen_by = auth.uid()
          OR auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))
        )
    )
  );

CREATE POLICY book_reviews_delete_own
  ON public.book_reviews
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY book_review_reactions_select_visible
  ON public.book_review_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_reactions.review_id
    )
  );

CREATE POLICY book_review_reactions_insert_visible
  ON public.book_review_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_reactions.review_id
        AND r.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_reactions.review_id
    )
  );

CREATE POLICY book_review_reactions_update_own
  ON public.book_review_reactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_reactions.review_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY book_review_reactions_delete_own
  ON public.book_review_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY book_review_comments_select_visible
  ON public.book_review_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_comments.review_id
    )
  );

CREATE POLICY book_review_comments_insert_visible
  ON public.book_review_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_comments.review_id
    )
  );

CREATE POLICY book_review_comments_delete_author_or_review_author
  ON public.book_review_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.book_reviews AS r
      WHERE r.id = book_review_comments.review_id
        AND r.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_review_feed(
  p_scope text,
  p_limit integer DEFAULT 10,
  p_before_created_at timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  author_display_name text,
  author_avatar_seed text,
  book_id uuid,
  book_title text,
  book_image_url text,
  book_authors text,
  stars smallint,
  content text,
  reading_status public.book_status,
  created_at timestamptz,
  updated_at timestamptz,
  like_count bigint,
  dislike_count bigint,
  comment_count bigint,
  user_reaction text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
BEGIN
  IF p_scope NOT IN ('all', 'following', 'mine') THEN
    RAISE EXCEPTION 'Escopo de resenhas inválido.'
      USING ERRCODE = '22023';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 30);

  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    u.display_name,
    u.avatar_seed,
    r.book_id,
    b.title,
    b.image_url,
    COALESCE(
      (
        SELECT string_agg(a.name, ', ' ORDER BY a.name)
        FROM public.book_authors AS ba
        JOIN public.authors AS a ON a.id = ba.author_id
        WHERE ba.book_id = b.id
      ),
      (
        SELECT a.name
        FROM public.authors AS a
        WHERE a.id = b.author_id
      ),
      ''
    ),
    r.stars,
    r.content,
    r.reading_status,
    r.created_at,
    r.updated_at,
    (
      SELECT count(*)
      FROM public.book_review_reactions AS rr
      WHERE rr.review_id = r.id
        AND rr.reaction = 'like'
    ),
    (
      SELECT count(*)
      FROM public.book_review_reactions AS rr
      WHERE rr.review_id = r.id
        AND rr.reaction = 'dislike'
    ),
    (
      SELECT count(*)
      FROM public.book_review_comments AS c
      WHERE c.review_id = r.id
    ),
    (
      SELECT rr.reaction
      FROM public.book_review_reactions AS rr
      WHERE rr.review_id = r.id
        AND rr.user_id = auth.uid()
      LIMIT 1
    )
  FROM public.book_reviews AS r
  JOIN public.users AS u ON u.id = r.user_id
  JOIN public.books AS b ON b.id = r.book_id
  WHERE (
      p_scope = 'all'
      OR (p_scope = 'mine' AND r.user_id = auth.uid())
      OR (
        p_scope = 'following'
        AND EXISTS (
          SELECT 1
          FROM public.user_followers AS uf
          WHERE uf.follower_id = auth.uid()
            AND uf.following_id = r.user_id
        )
      )
    )
    AND (
      p_before_created_at IS NULL
      OR (r.created_at, r.id) < (p_before_created_at, p_before_id)
    )
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON public.book_reviews FROM PUBLIC;
REVOKE ALL ON public.book_review_reactions FROM PUBLIC;
REVOKE ALL ON public.book_review_comments FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_review_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.book_review_comments TO authenticated;

REVOKE ALL ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) TO authenticated;
