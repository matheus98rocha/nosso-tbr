import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261020180000_popular_readers_follower_counts.sql",
);

describe("popular readers follower count migration", () => {
  it("counts followers in a definer helper and keeps book ranking as invoker", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const helper = sql.slice(
      0,
      sql.indexOf("CREATE OR REPLACE FUNCTION public.get_popular_readers_for_home"),
    );
    const ranking = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.get_popular_readers_for_home"),
    );

    expect(helper).toContain(
      "CREATE OR REPLACE FUNCTION public.count_followers_of(p_user_id uuid)",
    );
    expect(helper).toContain("SECURITY DEFINER");
    expect(helper).toContain("SET search_path = public, pg_temp");
    expect(helper).toContain("WHEN auth.uid() IS NULL OR p_user_id IS NULL THEN 0::bigint");
    expect(helper).toContain("WHERE following_id = p_user_id");
    expect(helper).toContain(
      "REVOKE ALL ON FUNCTION public.count_followers_of(uuid) FROM anon",
    );
    expect(helper).toContain(
      "GRANT EXECUTE ON FUNCTION public.count_followers_of(uuid) TO authenticated",
    );
    expect(helper).not.toContain("SECURITY INVOKER");

    expect(ranking).toContain("SECURITY INVOKER");
    expect(ranking).not.toContain("SECURITY DEFINER");
    expect(ranking).toContain(
      "COALESCE(public.count_followers_of(c.id), 0) AS follower_count",
    );
    expect(ranking).not.toContain("WHERE uf.following_id = c.id");
    expect(ranking).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_popular_readers_for_home(integer) TO authenticated",
    );
  });
});
