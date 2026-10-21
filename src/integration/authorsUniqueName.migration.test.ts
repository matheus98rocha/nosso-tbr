import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261021014852_authors_unique_name.sql",
);

describe("authors unique name migration", () => {
  it("keeps the lowest id and moves credits before deleting duplicate authors", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const nameKey = "lower(public.immutable_unaccent(btrim(name)))";
    const insertCredits = sql.indexOf("insert into public.book_authors");
    const deleteCredits = sql.indexOf("delete from public.book_authors");
    const updateBooks = sql.indexOf("update public.books");
    const deleteAuthors = sql.indexOf("delete from public.authors");
    const uniqueIndex = sql.indexOf(
      "create unique index authors_name_key_uidx",
    );

    expect(sql).toContain(
      "create or replace function public.immutable_unaccent(input text)",
    );
    expect(sql).toContain("language sql");
    expect(sql).toContain("\nimmutable\n");
    expect(sql).toContain("new.name := btrim(new.name);");
    expect(sql.split(nameKey).length - 1).toBe(3);
    expect(sql).toContain("order by id");
    expect(sql).toContain("keeper.rn = 1");
    expect(sql).toContain("duplicate.rn > 1");
    expect(sql).toContain("on conflict (book_id, author_id) do nothing");
    expect(insertCredits).toBeGreaterThan(-1);
    expect(deleteCredits).toBeGreaterThan(insertCredits);
    expect(updateBooks).toBeGreaterThan(deleteCredits);
    expect(deleteAuthors).toBeGreaterThan(updateBooks);
    expect(uniqueIndex).toBeGreaterThan(deleteAuthors);
    expect(sql.slice(uniqueIndex)).toContain(nameKey);
  });
});
