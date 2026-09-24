import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260923010000_book_notifications.sql",
);

describe("book notifications migration contract", () => {
  it("defines isolated preference and notification tables", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.user_notification_preferences");
    expect(sql).toContain("PRIMARY KEY (follower_id, following_id)");
    expect(sql).toContain("book_notifications_enabled boolean NOT NULL DEFAULT true");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.notifications");
    expect(sql).toContain("recipient_id uuid NOT NULL");
    expect(sql).toContain("actor_id uuid NOT NULL");
    expect(sql).toContain("book_count integer NOT NULL CHECK (book_count > 0)");
  });

  it("keeps unread batches unique and protects recipient data", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS notifications_unread_actor_unique",
    );
    expect(sql).toContain("WHERE read_at IS NULL");
    expect(sql).toContain("notifications_select_own");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.mark_notification_read");
    expect(sql).toContain("AND recipient_id = auth.uid()");
    expect(sql).toContain("notification_preferences_select_own");
    expect(sql).toContain("notification_preferences_update_own");
    expect(sql).toContain("FROM public.user_followers uf");
  });

  it("captures the authenticated actor and installs atomic book notification generation", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("auth.uid()");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.notify_book_followers()");
    expect(sql).toContain("CREATE TRIGGER books_notify_followers_after_insert");
    expect(sql).toContain("ON CONFLICT (recipient_id, actor_id, notification_type)");
    expect(sql).toContain("public.is_book_visible_to_user");
    expect(sql).toContain("SECURITY DEFINER");
  });
});
