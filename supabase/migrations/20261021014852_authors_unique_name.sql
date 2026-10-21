-- Author identity matches book import: lower(unaccent(btrim(name))).
-- Existing rows that only differ by case, accents, or surrounding spaces are
-- the same person. Keep the lowest id (import uses ORDER BY id LIMIT 1),
-- move book credits onto that row, then enforce the key.

create extension if not exists unaccent with schema public;

create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.unaccent('public.unaccent'::regdictionary, input);
$$;

create or replace function public.authors_sync_name_unaccent()
returns trigger
language plpgsql
as $function$
begin
  new.name := btrim(new.name);
  new.name_unaccent := lower(public.unaccent(coalesce(new.name, '')));
  return new;
end;
$function$;

update public.authors
set name = name
where name is not null;

drop table if exists author_name_dupes;

create temp table author_name_dupes as
with ranked as (
  select
    id,
    lower(public.immutable_unaccent(btrim(name))) as name_key,
    row_number() over (
      partition by lower(public.immutable_unaccent(btrim(name)))
      order by id
    ) as rn
  from public.authors
)
select duplicate.id as drop_id, keeper.id as keep_id
from ranked duplicate
join ranked keeper
  on keeper.name_key = duplicate.name_key
 and keeper.rn = 1
where duplicate.rn > 1;

insert into public.book_authors (book_id, author_id)
select ba.book_id, d.keep_id
from public.book_authors ba
join author_name_dupes d on d.drop_id = ba.author_id
on conflict (book_id, author_id) do nothing;

delete from public.book_authors ba
using author_name_dupes d
where ba.author_id = d.drop_id;

update public.books b
set author_id = d.keep_id
from author_name_dupes d
where b.author_id = d.drop_id;

delete from public.authors a
using author_name_dupes d
where a.id = d.drop_id;

drop table author_name_dupes;

create unique index authors_name_key_uidx
  on public.authors (lower(public.immutable_unaccent(btrim(name))));
