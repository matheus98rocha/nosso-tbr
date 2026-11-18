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
});
