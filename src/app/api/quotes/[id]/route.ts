import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { QuoteMapper } from "@/modules/quotes/services/mappers/quotes.mappers";

const patchBody = z.object({
  content: z.string().min(1),
  page: z.number().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

type BookParticipation = {
  user_id: string | null;
  chosen_by: string | null;
  readers: unknown;
};

async function loadQuoteBookAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
): Promise<
  | { error: string; quoteFound: false; parentBook: null }
  | { error: null; quoteFound: false; parentBook: null }
  | { error: null; quoteFound: true; parentBook: BookParticipation | null }
> {
  const { data: quote, error: qe } = await supabase
    .from("quotes")
    .select("id, book_id")
    .eq("id", quoteId)
    .maybeSingle();

  if (qe) return { error: qe.message, quoteFound: false, parentBook: null };
  if (!quote) return { error: null, quoteFound: false, parentBook: null };

  const { data: parentBook, error: be } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", quote.book_id)
    .maybeSingle();

  if (be) return { error: be.message, quoteFound: false, parentBook: null };
  if (!parentBook) {
    return { error: null, quoteFound: true, parentBook: null };
  }
  return {
    error: null,
    quoteFound: true,
    parentBook: parentBook as BookParticipation,
  };
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const loaded = await loadQuoteBookAccess(supabase, id);
  if (loaded.error) {
    return NextResponse.json({ error: loaded.error }, { status: 500 });
  }
  if (!loaded.quoteFound) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!loaded.parentBook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: loaded.parentBook.user_id,
      chosen_by: loaded.parentBook.chosen_by,
      readers: loaded.parentBook.readers as string[] | null,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = QuoteMapper.toPersistence({
    content: parsed.data.content,
    page: parsed.data.page,
  });

  const { data, error } = await supabase
    .from("quotes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const loadedDel = await loadQuoteBookAccess(supabase, id);
  if (loadedDel.error) {
    return NextResponse.json({ error: loadedDel.error }, { status: 500 });
  }
  if (!loadedDel.quoteFound) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!loadedDel.parentBook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: loadedDel.parentBook.user_id,
      chosen_by: loadedDel.parentBook.chosen_by,
      readers: loadedDel.parentBook.readers as string[] | null,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
