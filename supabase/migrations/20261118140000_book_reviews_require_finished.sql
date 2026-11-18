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

  IF v_status IS DISTINCT FROM 'finished' THEN
    RAISE EXCEPTION 'As estrelas ficam disponíveis quando a leitura está finalizada.'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.content := btrim(NEW.content);

  IF TG_OP = 'UPDATE' AND NEW.content IS NOT DISTINCT FROM OLD.content THEN
    RETURN NEW;
  END IF;

  NEW.reading_status := v_status;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;
