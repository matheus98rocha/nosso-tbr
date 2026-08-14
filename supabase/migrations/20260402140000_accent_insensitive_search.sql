create extension if not exists unaccent with schema public;

alter table public.books add column if not exists title_unaccent text;

alter table public.authors add column if not exists name_unaccent text;

create or replace function public.books_generate_search_vector()
returns trigger
language plpgsql
as $function$
declare
  author_name text;
begin
  new.title_unaccent := lower(unaccent(coalesce(new.title, '')));
  select name into author_name from public.authors where id = new.author_id;
  new.search_vector :=
    to_tsvector('simple', lower(unaccent(coalesce(new.title, '')))) ||
    to_tsvector('simple', lower(unaccent(coalesce(author_name, ''))));
  return new;
end;
$function$;

create or replace function public.authors_sync_name_unaccent()
returns trigger
language plpgsql
as $function$
begin
  new.name_unaccent := lower(unaccent(coalesce(new.name, '')));
  return new;
end;
$function$;

drop trigger if exists tr_authors_sync_name_unaccent on public.authors;
create trigger tr_authors_sync_name_unaccent
before insert or update of name on public.authors
for each row execute procedure public.authors_sync_name_unaccent();

update public.authors set name = name where name is not null;

update public.books set title = title where title is not null;
