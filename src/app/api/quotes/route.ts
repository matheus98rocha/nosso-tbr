import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { QuoteMapper } from "@/modules/quotes/services/mappers/quotes.mappers";

const bodySchema = z.object({
  bookId: z.string().uuid(),
  content: z.string().min(1),
  page: z.number().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers: book.readers as string[] | null,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = QuoteMapper.toPersistence({
    bookId: parsed.data.bookId,
    content: parsed.data.content,
    page: parsed.data.page ?? undefined,
  });

  const { data, error } = await supabase
    .from("quotes")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
