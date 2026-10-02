CREATE OR REPLACE FUNCTION public.notify_book_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_actor_id uuid := auth.uid();
BEGIN
  IF activity_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF current_setting('nosso.skip_book_notification', true) = 'true' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    notification_type,
    book_count,
    created_at,
    updated_at
  )
  SELECT
    uf.follower_id,
    activity_actor_id,
    'new_books',
    1,
    now(),
    now()
  FROM public.user_followers uf
  LEFT JOIN public.user_notification_preferences unp
    ON unp.follower_id = uf.follower_id
   AND unp.following_id = activity_actor_id
  WHERE uf.following_id = activity_actor_id
    AND uf.follower_id <> activity_actor_id
    AND COALESCE(unp.book_notifications_enabled, true)
    AND public.is_book_visible_to_user(
      NEW.readers,
      NEW.chosen_by,
      uf.follower_id
    )
  ON CONFLICT (recipient_id, actor_id, notification_type)
    WHERE read_at IS NULL
  DO UPDATE
    SET book_count = public.notifications.book_count + EXCLUDED.book_count,
        updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_reader_books(p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  reader_id uuid := auth.uid();
  row_item jsonb;
  v_title text;
  v_author_name text;
  v_pages integer;
  v_status public.book_status;
  v_end_date date;
  v_author_id uuid;
  v_title_key text;
  v_author_key text;
  v_pair text;
  v_created integer := 0;
  v_duplicates jsonb := '[]'::jsonb;
  v_invalid jsonb := '[]'::jsonb;
  v_seen text[] := ARRAY[]::text[];
BEGIN
  IF reader_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid rows';
  END IF;

  PERFORM set_config('nosso.skip_book_notification', 'true', true);

  FOR row_item IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_title := NULL;
    BEGIN
      v_title := btrim(coalesce(row_item->>'title', ''));
      v_author_name := btrim(coalesce(row_item->>'author_name', ''));
      v_pages := (row_item->>'pages')::integer;
      v_status := (row_item->>'status')::public.book_status;
      v_end_date := NULLIF(btrim(coalesce(row_item->>'end_date', '')), '')::date;
      v_title_key := lower(unaccent(v_title));
      v_author_key := lower(unaccent(v_author_name));
      v_pair := v_title_key || E'\t' || v_author_key;

      IF v_title = ''
        OR v_author_name = ''
        OR v_pages IS NULL
        OR v_pages < 1
        OR v_status NOT IN ('not_started'::public.book_status, 'reading'::public.book_status, 'finished'::public.book_status)
        OR (v_status = 'finished'::public.book_status AND v_end_date IS NULL)
      THEN
        v_invalid := v_invalid || jsonb_build_array(jsonb_build_object('title', v_title));
      ELSE
        IF v_status <> 'finished'::public.book_status THEN
          v_end_date := NULL;
        END IF;

        SELECT id
          INTO v_author_id
        FROM public.authors
        WHERE lower(unaccent(btrim(name))) = v_author_key
        ORDER BY id
        LIMIT 1;

        IF v_author_id IS NOT NULL AND (
          v_pair = ANY (v_seen)
          OR EXISTS (
            SELECT 1
            FROM public.books b
            WHERE b.author_id = v_author_id
              AND lower(unaccent(btrim(b.title))) = v_title_key
              AND (
                b.chosen_by = reader_id
                OR reader_id = ANY (COALESCE(b.readers, ARRAY[]::uuid[]))
              )
          )
        ) THEN
          v_duplicates := v_duplicates || jsonb_build_array(jsonb_build_object('title', v_title));
        ELSE
          IF v_author_id IS NULL THEN
            INSERT INTO public.authors (name)
            VALUES (v_author_name)
            RETURNING id INTO v_author_id;
          END IF;

          INSERT INTO public.books (
            title,
            author_id,
            chosen_by,
            readers,
            user_id,
            pages,
            status,
            start_date,
            end_date,
            planned_start_date,
            gender,
            image_url,
            is_reread
          ) VALUES (
            v_title,
            v_author_id,
            reader_id,
            ARRAY[reader_id],
            reader_id,
            v_pages,
            v_status,
            NULL,
            v_end_date,
            NULL,
            NULL,
            '/book-cover-placeholder.svg',
            false
          );

          v_seen := array_append(v_seen, v_pair);
          v_created := v_created + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_invalid := v_invalid || jsonb_build_array(
        jsonb_build_object('title', coalesce(v_title, ''))
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'createdCount', v_created,
    'duplicates', v_duplicates,
    'invalid', v_invalid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_reader_books(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_reader_books(jsonb) TO authenticated;
