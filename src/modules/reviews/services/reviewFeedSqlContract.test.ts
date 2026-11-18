import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../supabase/migrations/20261118120000_book_reviews.sql",
  ),
  "utf8",
);

function extractFunction(name: string) {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}(`;
  const start = sql.indexOf(marker);
  const end = sql.indexOf("$$;", start);
  return sql.slice(start, end);
}

function extractParen(source: string, openIndex: number) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1;
    if (source[index] === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  throw new Error("parênteses sem fechar");
}

function splitTopLevel(source: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of source) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

describe("contrato da resenha no banco", () => {
  it("devolve a flag de livro solo por último, depois das reações", () => {
    const body = extractFunction("get_review_feed");
    const returnsAt = body.indexOf("RETURNS TABLE (");
    const columns = splitTopLevel(
      extractParen(body, body.indexOf("(", returnsAt)),
    ).map((column) => column.split(/\s+/)[0]);
    const queryAt = body.indexOf("RETURN QUERY");
    const selectAt = body.indexOf("SELECT", queryAt);
    const fromAt = body.indexOf("FROM public.book_reviews", selectAt);
    const selected = splitTopLevel(body.slice(selectAt + "SELECT".length, fromAt));

    const likeAt = columns.indexOf("like_count");
    const dislikeAt = columns.indexOf("dislike_count");
    const commentAt = columns.indexOf("comment_count");
    const reactionAt = columns.indexOf("user_reaction");
    const soloAt = columns.indexOf("book_is_solo");

    expect(selected).toHaveLength(columns.length);
    expect(columns.at(-1)).toBe("book_is_solo");
    expect([likeAt, dislikeAt, commentAt, reactionAt, soloAt]).toEqual([
      soloAt - 4,
      soloAt - 3,
      soloAt - 2,
      soloAt - 1,
      columns.length - 1,
    ]);
    expect(selected[likeAt]).toContain("reaction = 'like'");
    expect(selected[likeAt]).not.toContain("array_length");
    expect(selected[dislikeAt]).toContain("reaction = 'dislike'");
    expect(selected[dislikeAt]).not.toContain("array_length");
    expect(selected[commentAt]).toContain("book_review_comments");
    expect(selected[commentAt]).not.toContain("array_length");
    expect(selected[reactionAt]).toContain("auth.uid()");
    expect(selected[reactionAt]).not.toContain("array_length");
    expect(selected[soloAt]).toContain("array_length");
    expect(selected[soloAt]).toContain("chosen_by");
  });

  it("não regrava o status da resenha quando só as estrelas mudam", () => {
    const write = extractFunction("book_reviews_before_write");
    const unchanged = write.indexOf(
      "NEW.content IS NOT DISTINCT FROM OLD.content",
    );
    const snapshot = write.indexOf("NEW.reading_status := v_status");

    expect(unchanged).toBeGreaterThan(-1);
    expect(snapshot).toBeGreaterThan(unchanged);
    expect(write.slice(unchanged, snapshot)).toContain("RETURN NEW");

    const sync = extractFunction("book_reading_ratings_sync_review_stars");
    expect(sync).toContain("SET stars = NEW.stars");
    expect(sync).not.toContain("reading_status");
    expect(sync).not.toContain("content");
    expect(sql).toContain(
      "AFTER INSERT OR UPDATE OF stars ON public.book_reading_ratings",
    );
  });

  it("recusa o livro ausente antes de mexer no texto", () => {
    const write = extractFunction("book_reviews_before_write");
    const missing = write.indexOf("IF v_status IS NULL THEN");
    const trim = write.indexOf("NEW.content := btrim(NEW.content)");

    expect(missing).toBeGreaterThan(-1);
    expect(trim).toBeGreaterThan(missing);
    expect(write.slice(missing, trim)).toContain("P0002");
  });

  it("só mostra a resenha para quem pode ver o livro", () => {
    for (const table of ["book_reviews", "book_review_reactions", "book_review_comments"]) {
      expect(sql).toContain(`ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY;`);
    }

    const visible = extractPolicy("book_reviews_select_visible");
    expect(visible).toContain("user_id = auth.uid()");
    expect(visible).toContain(
      "public.is_book_visible_to_current_user(b.readers, b.chosen_by)",
    );
    expect(visible).toContain("TO authenticated");

    const remove = extractPolicy("book_reviews_delete_own");
    expect(remove).toContain("USING (user_id = auth.uid())");
    expect(remove).not.toContain("is_book_visible_to_current_user");
    expect(remove).not.toContain("chosen_by");

    const reactionInsert = extractPolicy("book_review_reactions_insert_visible");
    expect(reactionInsert).toContain("NOT EXISTS");
    expect(reactionInsert).toContain("r.user_id = auth.uid()");
    const reactionUpdate = extractPolicy("book_review_reactions_update_own");
    expect(reactionUpdate).toContain("NOT EXISTS");
    expect(reactionUpdate).toContain("r.user_id = auth.uid()");

    const commentInsert = extractPolicy("book_review_comments_insert_visible");
    expect(commentInsert).toContain("user_id = auth.uid()");
    const commentDelete = extractPolicy("book_review_comments_delete_author_or_review_author");
    expect(commentDelete).toContain("user_id = auth.uid()");
    expect(commentDelete).toContain("r.user_id = auth.uid()");
    expect(commentDelete).toContain("FOR DELETE");
    expect(commentDelete).not.toContain("FOR UPDATE");

    const commentGrant = sql
      .split("\n")
      .find((line) => line.includes("book_review_comments TO authenticated"));
    expect(commentGrant).toBe(
      "GRANT SELECT, INSERT, DELETE ON public.book_review_comments TO authenticated;",
    );
    expect(sql).not.toContain("TO anon");
    expect(sql).not.toContain("SECURITY DEFINER");
  });

  it("mantém a página pela criação e a resposta no comentário principal", () => {
    const feed = extractFunction("get_review_feed");
    const invalid = feed.indexOf("Escopo de resenhas inválido.");
    const query = feed.indexOf("RETURN QUERY");

    expect(invalid).toBeGreaterThan(-1);
    expect(invalid).toBeLessThan(query);
    expect(feed).toContain("LEAST(GREATEST(COALESCE(p_limit, 10), 1), 30)");
    expect(feed).toContain("p_scope = 'mine' AND r.user_id = auth.uid()");
    expect(feed).toContain("uf.follower_id = auth.uid()");
    expect(feed).toContain("uf.following_id = r.user_id");
    expect(feed).toContain("(r.created_at, r.id) < (p_before_created_at, p_before_id)");
    expect(feed).toContain("ORDER BY r.created_at DESC, r.id DESC");
    expect(feed.slice(feed.lastIndexOf("ORDER BY"))).not.toContain("updated_at");
    expect(feed).toContain("SECURITY INVOKER");
    expect(sql).toContain(
      "CREATE INDEX book_reviews_feed_idx\n  ON public.book_reviews (created_at DESC, id DESC);",
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) FROM PUBLIC;",
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) TO authenticated;",
    );

    const parent = extractFunction("book_review_comments_validate_parent");
    const early = parent.indexOf("IF NEW.parent_id IS NULL THEN");
    const returned = parent.indexOf("RETURN NEW", early);
    const missing = parent.indexOf("IF v_parent_review IS NULL THEN");
    const nested = parent.indexOf("IF v_parent_parent IS NOT NULL THEN");
    const other = parent.indexOf("v_parent_review IS DISTINCT FROM NEW.review_id");

    expect(early).toBeGreaterThan(-1);
    expect(returned).toBeGreaterThan(early);
    expect(missing).toBeGreaterThan(returned);
    expect(nested).toBeGreaterThan(missing);
    expect(other).toBeGreaterThan(nested);
    expect(parent).toContain("Respostas só podem ser feitas ao comentário principal.");
    expect(parent).toContain("A resposta precisa ser da mesma resenha.");
  });
});

function extractPolicy(name: string) {
  const marker = `CREATE POLICY ${name}`;
  const start = sql.indexOf(marker);
  if (start < 0) throw new Error(name);
  const nextPolicy = sql.indexOf("CREATE POLICY", start + marker.length);
  const nextFunction = sql.indexOf("CREATE OR REPLACE FUNCTION", start + marker.length);
  const ends = [nextPolicy, nextFunction].filter((index) => index > start);
  const end = ends.length ? Math.min(...ends) : sql.length;
  return sql.slice(start, end);
}
