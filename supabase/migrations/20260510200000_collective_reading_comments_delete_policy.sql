CREATE POLICY collective_reading_comments_delete_own
  ON public.collective_reading_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
