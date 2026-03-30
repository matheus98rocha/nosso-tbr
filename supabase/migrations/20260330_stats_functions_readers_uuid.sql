-- Stats RPCs: books.readers is uuid[]; resolve reader_input (display name or uuid text) via public.users.

CREATE OR REPLACE FUNCTION public.get_reading_stats_by_reader(reader_input text)
RETURNS TABLE (
  year integer,
  total_books bigint,
  most_read_author text,
  most_read_genre text,
  total_pages bigint,
  most_productive_month text,
  longest_book_title text,
  longest_book_pages integer,
  avg_pages_per_book numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH resolved AS (
    SELECT u.id AS reader_id
    FROM public.users u
    WHERE u.id::text = trim(reader_input)
      OR lower(trim(coalesce(u.display_name::text, ''))) = lower(trim(reader_input))
    ORDER BY CASE WHEN u.id::text = trim(reader_input) THEN 0 ELSE 1 END
    LIMIT 1
  ),
  filtered_books AS (
    SELECT b.*
    FROM public.books b
    CROSS JOIN resolved r
    WHERE r.reader_id = ANY (b.readers)
      AND b.end_date IS NOT NULL
  ),
  yearly_stats AS (
    SELECT
      EXTRACT(YEAR FROM end_date)::integer AS year,
      COUNT(*)::bigint AS total_books,
      SUM(pages)::bigint AS total_pages,
      ROUND(AVG(pages), 1)::numeric AS avg_pages_per_book
    FROM filtered_books
    GROUP BY EXTRACT(YEAR FROM end_date)
  ),
  overall_author AS (
    SELECT a.name
    FROM book_authors ba
    JOIN authors a ON ba.author_id = a.id
    JOIN filtered_books fb ON ba.book_id = fb.id
    GROUP BY a.name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  genre_stats AS (
    SELECT
      EXTRACT(YEAR FROM end_date)::integer AS year,
      gender,
      COUNT(*)::bigint AS genre_count,
      ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM end_date)::integer ORDER BY COUNT(*) DESC) AS rn
    FROM filtered_books
    GROUP BY EXTRACT(YEAR FROM end_date), gender
  ),
  month_stats AS (
    SELECT
      EXTRACT(YEAR FROM end_date)::integer AS year,
      TO_CHAR(end_date, 'TMMonth') AS month,
      COUNT(*)::bigint AS month_count,
      ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM end_date)::integer ORDER BY COUNT(*) DESC) AS rn
    FROM filtered_books
    GROUP BY EXTRACT(YEAR FROM end_date), TO_CHAR(end_date, 'TMMonth')
  ),
  longest_book_stats AS (
    SELECT
      book_year AS year,
      book_title_from_query,
      book_pages_from_query
    FROM (
      SELECT
        EXTRACT(YEAR FROM end_date)::integer AS book_year,
        title AS book_title_from_query,
        pages::integer AS book_pages_from_query,
        ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM end_date)::integer ORDER BY pages DESC) AS rn
      FROM filtered_books
    ) ranked_books
    WHERE rn = 1
  )
  SELECT
    y.year,
    y.total_books,
    COALESCE((SELECT name FROM overall_author), 'N/A') AS most_read_author,
    COALESCE(g.gender, 'N/A') AS most_read_genre,
    y.total_pages,
    COALESCE(m.month, 'N/A') AS most_productive_month,
    COALESCE(l.book_title_from_query, 'N/A') AS longest_book_title,
    COALESCE(l.book_pages_from_query, 0) AS longest_book_pages,
    y.avg_pages_per_book
  FROM yearly_stats y
  LEFT JOIN genre_stats g ON g.year = y.year AND g.rn = 1
  LEFT JOIN month_stats m ON m.year = y.year AND m.rn = 1
  LEFT JOIN longest_book_stats l ON l.year = y.year
  ORDER BY y.year DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reader_collaboration_stats(reader_input text)
RETURNS TABLE (
  reader_name text,
  books_read bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH resolved AS (
    SELECT u.id AS reader_id
    FROM public.users u
    WHERE u.id::text = trim(reader_input)
      OR lower(trim(coalesce(u.display_name::text, ''))) = lower(trim(reader_input))
    ORDER BY CASE WHEN u.id::text = trim(reader_input) THEN 0 ELSE 1 END
    LIMIT 1
  ),
  filtered_books AS (
    SELECT b.readers
    FROM public.books b
    CROSS JOIN resolved r
    WHERE r.reader_id = ANY (b.readers)
      AND b.end_date IS NOT NULL
  ),
  per_reader AS (
    SELECT
      ur AS reader_uuid,
      COUNT(*)::bigint AS cnt
    FROM filtered_books fb
    CROSS JOIN unnest(fb.readers) AS ur
    GROUP BY ur
  )
  SELECT
    COALESCE(u.display_name, pr.reader_uuid::text) AS reader_name,
    pr.cnt AS books_read
  FROM per_reader pr
  LEFT JOIN public.users u ON u.id = pr.reader_uuid
  CROSS JOIN resolved r
  ORDER BY
    CASE WHEN pr.reader_uuid = r.reader_id THEN 0 ELSE 1 END,
    pr.cnt DESC;
END;
$$;
