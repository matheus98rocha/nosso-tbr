import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../supabase/migrations/20261118120000_book_reviews.sql",
);

const sql = readFileSync(migrationPath, "utf8");

function functionBody(signature: string) {
  const start = sql.indexOf(signature);
  if (start < 0) throw new Error(`missing ${signature}`);
  const end = sql.indexOf("\n$$;", start);
  if (end < 0) throw new Error(`missing end of ${signature}`);
  return sql.slice(start, end);
}

function splitTopLevel(input: string) {
  const items: string[] = [];
  let depth = 0;
  let quote = false;
  let current = "";

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === "'") {
      if (quote && input[index + 1] === "'") {
        current += "''";
        index += 1;
        continue;
      }
      quote = !quote;
      current += char;
      continue;
    }
    if (!quote && char === "(") depth += 1;
    if (!quote && char === ")") depth -= 1;
    if (!quote && char === "," && depth === 0) {
      items.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) items.push(current.trim());
  return items;
}

function balanced(source: string, openIndex: number) {
  let depth = 0;
  let quote = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "'") {
      if (quote && source[index + 1] === "'") {
        index += 1;
        continue;
      }
      quote = !quote;
      continue;
    }
    if (quote) continue;
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  throw new Error("unbalanced paren");
}

function selectList(body: string) {
  const queryAt = body.indexOf("RETURN QUERY");
  const selectAt = body.indexOf("SELECT", queryAt);
  const start = selectAt + "SELECT".length;
  let depth = 0;
  let quote = false;

  for (let index = start; index < body.length; index += 1) {
    const char = body[index];
    if (char === "'") {
      if (quote && body[index + 1] === "'") {
        index += 1;
        continue;
      }
      quote = !quote;
      continue;
    }
    if (quote) continue;
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (depth === 0 && body.slice(index, index + 5).toLowerCase() === "from ") {
      const previous = body[index - 1];
      if (previous === undefined || /\s/.test(previous)) return body.slice(start, index);
    }
  }

  throw new Error("select list not found");
}

describe("contrato posicional de resenhas", () => {
  it("devolve a flag de livro privado depois das contagens e da reação", () => {
    const body = functionBody("FUNCTION public.get_review_feed(");
    const returnsAt = body.indexOf("RETURNS TABLE");
    const returnsOpen = body.indexOf("(", returnsAt);
    const columnNames = splitTopLevel(balanced(body, returnsOpen)).map(
      (column) => column.split(/\s+/)[0],
    );
    const selected = splitTopLevel(selectList(body));

    expect(columnNames.slice(-5)).toEqual([
      "like_count",
      "dislike_count",
      "comment_count",
      "user_reaction",
      "book_is_solo",
    ]);
    expect(selected).toHaveLength(columnNames.length);
    expect(selected.at(-5)).toContain("reaction = 'like'");
    expect(selected.at(-5)).toContain("count(*)");
    expect(selected.at(-4)).toContain("reaction = 'dislike'");
    expect(selected.at(-3)).toContain("book_review_comments");
    expect(selected.at(-3)).toContain("count(*)");
    expect(selected.at(-2)).toContain("auth.uid()");
    expect(selected.at(-2)).not.toContain("count(*)");
    expect(selected.at(-1)).toContain("array_length");
    expect(selected.at(-1)).toContain("chosen_by");
    expect(selected.slice(0, -1).join("\n")).not.toContain("array_length");
  });

  it("não regrava o status da resenha quando o texto não muda", () => {
    const body = functionBody("FUNCTION public.book_reviews_before_write()");
    const guard = body.indexOf("NEW.content IS NOT DISTINCT FROM OLD.content");
    const earlyReturn = body.indexOf("RETURN NEW", guard);
    const statusAssign = body.indexOf("NEW.reading_status := v_status");

    expect(guard).toBeGreaterThan(-1);
    expect(earlyReturn).toBeGreaterThan(guard);
    expect(statusAssign).toBeGreaterThan(earlyReturn);
  });
});
