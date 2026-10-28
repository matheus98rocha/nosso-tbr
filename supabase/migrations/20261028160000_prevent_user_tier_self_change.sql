CREATE OR REPLACE FUNCTION public.prevent_self_service_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.tier IS DISTINCT FROM 'common_user'::public.user_tier THEN
      RAISE EXCEPTION 'Não é permitido definir o tier da conta'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Não é permitido alterar o tier da conta'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_self_service_tier_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_self_service_tier_change() FROM anon;
REVOKE ALL ON FUNCTION public.prevent_self_service_tier_change() FROM authenticated;

DROP TRIGGER IF EXISTS users_prevent_self_service_tier_change ON public.users;

CREATE TRIGGER users_prevent_self_service_tier_change
  BEFORE INSERT OR UPDATE OF tier ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_service_tier_change();
