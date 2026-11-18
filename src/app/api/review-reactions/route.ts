import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/app/api/_utils/requireUser";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  reviewId: z.string().uuid(),
  reaction: z.enum(["like", "dislike"]).nullable(),
});

async function aggregate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reviewId: string,
  viewerUserId: string,
) {
  const { data: rows, error } = await supabase
    .from("book_review_reactions")
    .select("user_id, reaction")
    .eq("review_id", reviewId);

  if (error) {
    return { error: error.message, payload: null };
  }

  let likeCount = 0;
  let dislikeCount = 0;
  let userReaction: "like" | "dislike" | null = null;

  for (const row of rows ?? []) {
    if (row.reaction === "like") likeCount += 1;
    else if (row.reaction === "dislike") dislikeCount += 1;
    if (row.user_id === viewerUserId) {
      userReaction =
        row.reaction === "like" || row.reaction === "dislike"
          ? row.reaction
          : null;
    }
  }

  return {
    error: null,
    payload: { reviewId, likeCount, dislikeCount, userReaction },
  };
}

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
    .select("id, user_id")
    .eq("id", parsed.data.reviewId)
    .maybeSingle();

  if (reviewErr) {
    return NextResponse.json({ error: reviewErr.message }, { status: 500 });
  }
  if (!review) {
    return NextResponse.json({ error: "Resenha não encontrada" }, { status: 404 });
  }
  if (review.user_id === auth.user.id) {
    return NextResponse.json(
      { error: "Você não reage à própria resenha." },
      { status: 403 },
    );
  }

  if (parsed.data.reaction === null) {
    const { error } = await supabase
      .from("book_review_reactions")
      .delete()
      .eq("review_id", parsed.data.reviewId)
      .eq("user_id", auth.user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("book_review_reactions").upsert(
      {
        review_id: parsed.data.reviewId,
        user_id: auth.user.id,
        reaction: parsed.data.reaction,
      },
      { onConflict: "review_id,user_id" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const aggregated = await aggregate(supabase, parsed.data.reviewId, auth.user.id);
  if (aggregated.error) {
    return NextResponse.json({ error: aggregated.error }, { status: 500 });
  }
  return NextResponse.json(aggregated.payload);
}
