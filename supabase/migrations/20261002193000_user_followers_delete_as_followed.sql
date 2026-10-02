-- Quem é seguido pode apagar a linha em que é o alvo.
-- A política existente continua permitindo que o seguidor deixe de seguir.
-- Políticas permissivas de DELETE se combinam com OR.

DROP POLICY IF EXISTS user_followers_delete_as_followed ON public.user_followers;

CREATE POLICY user_followers_delete_as_followed
  ON public.user_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = following_id);
