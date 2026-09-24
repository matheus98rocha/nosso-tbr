CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  book_notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_notification_preferences_pkey
    PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_notification_preferences_no_self
    CHECK (follower_id <> following_id),
  CONSTRAINT user_notification_preferences_follower_fk
    FOREIGN KEY (follower_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT user_notification_preferences_following_fk
    FOREIGN KEY (following_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_following_id
  ON public.user_notification_preferences (following_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  notification_type text NOT NULL DEFAULT 'new_books',
  book_count integer NOT NULL CHECK (book_count > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT notifications_recipient_fk
    FOREIGN KEY (recipient_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT notifications_actor_fk
    FOREIGN KEY (actor_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT notifications_type_check
    CHECK (notification_type = 'new_books')
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_recent
  ON public.notifications (recipient_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON public.notifications (recipient_id, updated_at DESC)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_unread_actor_unique
  ON public.notifications (recipient_id, actor_id, notification_type)
  WHERE read_at IS NULL;

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_preferences_select_own
  ON public.user_notification_preferences;
CREATE POLICY notification_preferences_select_own
  ON public.user_notification_preferences
  FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own
  ON public.user_notification_preferences;
CREATE POLICY notification_preferences_insert_own
  ON public.user_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_followers uf
      WHERE uf.follower_id = auth.uid()
        AND uf.following_id = user_notification_preferences.following_id
    )
  );

DROP POLICY IF EXISTS notification_preferences_update_own
  ON public.user_notification_preferences;
CREATE POLICY notification_preferences_update_own
  ON public.user_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (
    follower_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_followers uf
      WHERE uf.follower_id = auth.uid()
        AND uf.following_id = user_notification_preferences.following_id
    )
  )
  WITH CHECK (
    follower_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_followers uf
      WHERE uf.follower_id = auth.uid()
        AND uf.following_id = user_notification_preferences.following_id
    )
  );

DROP POLICY IF EXISTS notification_preferences_delete_own
  ON public.user_notification_preferences;
CREATE POLICY notification_preferences_delete_own
  ON public.user_notification_preferences
  FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = COALESCE(read_at, now()),
      updated_at = now()
  WHERE id = p_notification_id
    AND recipient_id = auth.uid();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_book_visible_to_user(
  p_readers uuid[],
  p_chosen_by uuid,
  p_viewer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    NOT (
      array_length(COALESCE(p_readers, ARRAY[]::uuid[]), 1) = 1
      AND (COALESCE(p_readers, ARRAY[]::uuid[]))[1] = p_chosen_by
    )
    OR p_chosen_by = p_viewer_id
    OR (
      p_viewer_id IS NOT NULL
      AND p_chosen_by IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.user_followers uf
        WHERE uf.follower_id = p_viewer_id
          AND uf.following_id = p_chosen_by
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_book_visible_to_current_user(
  p_readers uuid[],
  p_chosen_by uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_book_visible_to_user(p_readers, p_chosen_by, auth.uid());
$$;

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

DROP TRIGGER IF EXISTS books_notify_followers_after_insert ON public.books;
CREATE TRIGGER books_notify_followers_after_insert
  AFTER INSERT ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_book_followers();
