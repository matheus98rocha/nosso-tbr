import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/app/api/_utils/requireUser";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  reviewId: z.string().uuid(),
  content: z.string().trim().min(1).max(500),
  parentId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
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

  const { data: review, error: reviewErr } = await supabase
    .from("book_reviews")
    .select("id")
    .eq("id", parsed.data.reviewId)
    .maybeSingle();

  if (reviewErr) {
    return NextResponse.json({ error: reviewErr.message }, { status: 500 });
  }
  if (!review) {
    return NextResponse.json({ error: "Resenha não encontrada" }, { status: 404 });
  }

  let parentId = parsed.data.parentId ?? null;
  if (parentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("book_review_comments")
      .select("id, review_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentErr) {
      return NextResponse.json({ error: parentErr.message }, { status: 500 });
    }
    if (!parent || parent.review_id !== parsed.data.reviewId) {
      return NextResponse.json(
        { error: "Comentário pai não encontrado" },
        { status: 400 },
      );
    }
    if (parent.parent_id) {
      parentId = parent.parent_id as string;
    }
  }

  const { data, error } = await supabase
    .from("book_review_comments")
    .insert({
      review_id: parsed.data.reviewId,
      user_id: auth.user.id,
      parent_id: parentId,
      content: parsed.data.content.trim(),
    })
    .select("id, review_id, user_id, parent_id, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
