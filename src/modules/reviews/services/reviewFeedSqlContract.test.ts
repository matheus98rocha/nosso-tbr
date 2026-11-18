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

function functionHeader(signature: string) {
  const start = sql.indexOf(signature);
  if (start < 0) throw new Error(`missing ${signature}`);
  const end = sql.indexOf("AS $$", start);
  if (end < 0) throw new Error(`missing header of ${signature}`);
  return sql.slice(start, end);
}

function policySql(name: string) {
  const marker = `CREATE POLICY ${name}`;
  const start = sql.indexOf(marker);
  if (start < 0) throw new Error(`missing ${name}`);
  const nextPolicy = sql.indexOf("CREATE POLICY ", start + marker.length);
  const nextFunction = sql.indexOf("CREATE OR REPLACE FUNCTION", start + marker.length);
  const ends = [nextPolicy, nextFunction].filter((index) => index > start);
  return sql.slice(start, Math.min(...ends));
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

  it("restringe o feed a tudo, às próprias ou a quem a sessão segue, e limita a página", () => {
    const body = functionBody("FUNCTION public.get_review_feed(");
    const guard = body.indexOf("p_scope NOT IN ('all', 'following', 'mine')");
    const raised = body.indexOf("RAISE EXCEPTION", guard);
    const query = body.indexOf("RETURN QUERY", raised);
    const where = body.slice(body.indexOf("WHERE ("));
    const following = where.slice(where.indexOf("p_scope = 'following'"));

    expect(guard).toBeGreaterThan(-1);
    expect(raised).toBeGreaterThan(guard);
    expect(query).toBeGreaterThan(raised);
    expect(body).toContain("LEAST(GREATEST(COALESCE(p_limit, 10), 1), 30)");
    expect(where).toContain("p_scope = 'all'");
    expect(where).toContain("p_scope = 'mine' AND r.user_id = auth.uid()");
    expect(following).toContain("FROM public.user_followers AS uf");
    expect(following).toContain("uf.follower_id = auth.uid()");
    expect(following).toContain("uf.following_id = r.user_id");
    expect(following.indexOf("uf.follower_id = auth.uid()")).toBeLessThan(
      following.indexOf("ORDER BY"),
    );
  });

  it("espelha a nota privada só na resenha da mesma pessoa e do mesmo livro", () => {
    const body = functionBody("FUNCTION public.book_reading_ratings_sync_review_stars()");

    expect(body).toContain("UPDATE public.book_reviews");
    expect(body).toContain("SET stars = NEW.stars");
    expect(body).toContain("user_id = NEW.user_id");
    expect(body).toContain("book_id = NEW.book_id");
    expect(body).toContain("stars IS DISTINCT FROM NEW.stars");
    expect(body).not.toContain("content");
    expect(body).not.toContain("reading_status");
  });

  it("recusa resposta a uma resposta e resposta de outra resenha", () => {
    const body = functionBody("FUNCTION public.book_review_comments_validate_parent()");
    const early = body.indexOf("IF NEW.parent_id IS NULL");
    const earlyReturn = body.indexOf("RETURN NEW", early);
    const lookup = body.indexOf("FROM public.book_review_comments", earlyReturn);

    expect(early).toBeGreaterThan(-1);
    expect(earlyReturn).toBeGreaterThan(early);
    expect(lookup).toBeGreaterThan(earlyReturn);
    expect(body).toContain("IF v_parent_parent IS NOT NULL");
    expect(body).toContain("Respostas só podem ser feitas ao comentário principal.");
    expect(body).toContain("v_parent_review IS DISTINCT FROM NEW.review_id");
    expect(body).toContain("A resposta precisa ser da mesma resenha.");
  });

  it("impede reação na própria resenha e só deixa apagar comentário do autor ou de quem publicou", () => {
    const insert = sql.slice(
      sql.indexOf("CREATE POLICY book_review_reactions_insert_visible"),
      sql.indexOf("CREATE POLICY book_review_reactions_update_own"),
    );
    const commentDelete = sql.slice(
      sql.indexOf("CREATE POLICY book_review_comments_delete_author_or_review_author"),
      sql.indexOf("CREATE OR REPLACE FUNCTION public.get_review_feed("),
    );
    const commentGrant = sql.slice(
      sql.indexOf("GRANT SELECT, INSERT, DELETE ON public.book_review_comments"),
    );

    expect(insert).toContain("user_id = auth.uid()");
    expect(insert).toContain("NOT EXISTS");
    expect(insert).toContain("r.user_id = auth.uid()");
    expect(commentDelete).toContain("user_id = auth.uid()");
    expect(commentDelete).toContain("r.user_id = auth.uid()");
    expect(commentDelete).not.toContain("FOR UPDATE");
    expect(commentGrant.startsWith(
      "GRANT SELECT, INSERT, DELETE ON public.book_review_comments TO authenticated;",
    )).toBe(true);
    expect(sql).not.toContain("GRANT UPDATE ON public.book_review_comments");
  });

  it("só mostra a resenha para a autora ou para quem já vê o livro, e só ela escreve a própria", () => {
    const select = policySql("book_reviews_select_visible");
    const insert = policySql("book_reviews_insert_participant");
    const update = policySql("book_reviews_update_own");
    const remove = policySql("book_reviews_delete_own");
    const reactionUpdate = policySql("book_review_reactions_update_own");
    const commentInsert = policySql("book_review_comments_insert_visible");
    const feedHeader = functionHeader("FUNCTION public.get_review_feed(");

    expect(sql).toContain("ALTER TABLE public.book_reviews FORCE ROW LEVEL SECURITY;");
    expect(sql).toContain(
      "ALTER TABLE public.book_review_reactions FORCE ROW LEVEL SECURITY;",
    );
    expect(sql).toContain(
      "ALTER TABLE public.book_review_comments FORCE ROW LEVEL SECURITY;",
    );
    expect(select).toContain("user_id = auth.uid()");
    expect(select).toContain(
      "public.is_book_visible_to_current_user(b.readers, b.chosen_by)",
    );
    expect(select).not.toContain("USING (true)");
    expect(insert).toContain("user_id = auth.uid()");
    expect(insert).toContain("b.user_id IS NOT DISTINCT FROM auth.uid()");
    expect(insert).toContain("b.chosen_by = auth.uid()");
    expect(insert).toContain("auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))");
    expect(update).toContain("USING (user_id = auth.uid())");
    expect(update).toContain("b.chosen_by = auth.uid()");
    expect(update).toContain("auth.uid() = ANY (COALESCE(b.readers, '{}'::uuid[]))");
    expect(remove).toContain("USING (user_id = auth.uid())");
    expect(remove).not.toContain("is_book_visible_to_current_user");
    expect(remove).not.toContain("chosen_by");
    expect(reactionUpdate).toContain("USING (user_id = auth.uid())");
    expect(reactionUpdate).toContain("NOT EXISTS");
    expect(reactionUpdate).toContain("r.user_id = auth.uid()");
    expect(commentInsert).toContain("user_id = auth.uid()");
    expect(commentInsert).toContain("r.id = book_review_comments.review_id");
    expect(feedHeader).toContain("SECURITY INVOKER");
    expect(feedHeader).not.toContain("SECURITY DEFINER");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) FROM PUBLIC;",
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_review_feed(text, integer, timestamptz, uuid) TO authenticated;",
    );
    expect(sql).not.toContain("TO anon");
  });

  it("recusa livro ausente, corta o texto e só atualiza a data quando o texto muda", () => {
    const body = functionBody("FUNCTION public.book_reviews_before_write()");
    const missing = body.indexOf("IF v_status IS NULL");
    const raised = body.indexOf("Livro não encontrado para a resenha.", missing);
    const trim = body.indexOf("NEW.content := btrim(NEW.content)");
    const unchanged = body.indexOf("NEW.content IS NOT DISTINCT FROM OLD.content");
    const earlyReturn = body.indexOf("RETURN NEW", unchanged);
    const statusAssign = body.indexOf("NEW.reading_status := v_status");
    const updateGuard = body.indexOf("IF TG_OP = 'UPDATE'", statusAssign);
    const touch = body.indexOf("NEW.updated_at := now()", updateGuard);
    const trigger = sql.slice(
      sql.indexOf("CREATE TRIGGER book_reviews_before_write"),
      sql.indexOf("CREATE OR REPLACE FUNCTION public.book_reading_ratings_sync_review_stars()"),
    );

    expect(missing).toBeGreaterThan(-1);
    expect(raised).toBeGreaterThan(missing);
    expect(body).toContain("ERRCODE = 'P0002'");
    expect(trim).toBeGreaterThan(raised);
    expect(unchanged).toBeGreaterThan(trim);
    expect(statusAssign).toBeGreaterThan(earlyReturn);
    expect(updateGuard).toBeGreaterThan(statusAssign);
    expect(touch).toBeGreaterThan(updateGuard);
    expect(trigger).toContain(
      "BEFORE INSERT OR UPDATE ON public.book_reviews",
    );
    expect(sql).toContain(
      "AFTER INSERT OR UPDATE OF stars ON public.book_reading_ratings",
    );
  });

  it("pede a página anterior pela criação e pelo id, sem reordenar por edição", () => {
    const body = functionBody("FUNCTION public.get_review_feed(");
    const where = body.indexOf("p_before_created_at IS NULL");
    const cursor = body.indexOf(
      "(r.created_at, r.id) < (p_before_created_at, p_before_id)",
    );
    const order = body.slice(body.indexOf("ORDER BY", cursor));

    expect(where).toBeGreaterThan(-1);
    expect(cursor).toBeGreaterThan(where);
    expect(order.startsWith("ORDER BY r.created_at DESC, r.id DESC")).toBe(true);
    expect(order).not.toContain("updated_at");
  });
});
