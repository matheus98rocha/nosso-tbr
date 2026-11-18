import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: comment, error: findErr } = await supabase
    .from("book_review_comments")
    .select("id, user_id, review_id")
    .eq("id", id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!comment) {
    return NextResponse.json({ error: "Comentário não encontrado" }, { status: 404 });
  }

  const { data: review, error: reviewErr } = await supabase
    .from("book_reviews")
    .select("user_id")
    .eq("id", comment.review_id)
    .maybeSingle();

  if (reviewErr) {
    return NextResponse.json({ error: reviewErr.message }, { status: 500 });
  }

  const canDelete =
    comment.user_id === auth.user.id || review?.user_id === auth.user.id;
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from("book_review_comments")
    .delete()
    .eq("id", id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
