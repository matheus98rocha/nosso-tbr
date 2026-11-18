import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  bookId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  content: z.string().max(500).optional().default(""),
});

export async function PUT(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const content = parsed.data.content.trim();
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("status,user_id,chosen_by,readers")
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  const readers = book.readers as string[] | null;
  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!content && book.status !== "finished") {
    return NextResponse.json(
      { error: "Escreva sua resenha para publicar." },
      { status: 400 },
    );
  }

  let reviewId: string | null = null;

  if (content) {
    const { data: review, error: reviewErr } = await supabase
      .from("book_reviews")
      .upsert(
        {
          user_id: auth.user.id,
          book_id: parsed.data.bookId,
          stars: parsed.data.stars,
          content,
        },
        { onConflict: "user_id,book_id" },
      )
      .select("id")
      .single();

    if (reviewErr) {
      return NextResponse.json({ error: reviewErr.message }, { status: 500 });
    }
    reviewId = review.id as string;
  }

  if (book.status === "finished") {
    const { error: ratingErr } = await supabase
      .from("book_reading_ratings")
      .upsert(
        {
          user_id: auth.user.id,
          book_id: parsed.data.bookId,
          stars: parsed.data.stars,
        },
        { onConflict: "user_id,book_id" },
      );

    if (ratingErr) {
      return NextResponse.json({ error: ratingErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    published: Boolean(content),
    reviewId,
    stars: parsed.data.stars,
  });
}
