import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261028153000_profile_network_counts.sql",
);

const followersMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20261020180000_popular_readers_follower_counts.sql",
);

describe("profile network count migrations", () => {
  it("counts following outside user_followers row visibility", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.count_following_of(p_user_id uuid)",
    );
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, pg_temp");
    expect(sql).toContain(
      "WHEN auth.uid() IS NULL OR p_user_id IS NULL THEN 0::bigint",
    );
    expect(sql).toContain("WHERE follower_id = p_user_id");
    expect(sql).not.toContain("SELECT follower_id");
    expect(sql).not.toContain("SELECT following_id");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.count_following_of(uuid) FROM anon",
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.count_following_of(uuid) TO authenticated",
    );
  });

  it("keeps follower totals on the existing definer helper", async () => {
    const sql = await readFile(followersMigrationPath, "utf8");

    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.count_followers_of(p_user_id uuid)",
    );
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("WHERE following_id = p_user_id");
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.count_followers_of(uuid) TO authenticated",
    );
  });
});
