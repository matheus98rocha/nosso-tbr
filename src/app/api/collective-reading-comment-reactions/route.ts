import { createClient } from "@/lib/supabase/server";
import {
  canUserParticipateInBook,
  isCollectiveReadingBook,
} from "@/lib/security/bookParticipation";
import { requireUser } from "@/app/api/_utils/requireUser";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  commentId: z.string().uuid(),
  reaction: z.enum(["like", "dislike"]).nullable(),
});

async function aggregateCommentReactionCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  commentId: string,
  viewerUserId: string,
) {
  const { data: rows, error } = await supabase
    .from("collective_reading_comment_reactions")
    .select("user_id, reaction")
    .eq("comment_id", commentId);

  if (error) {
    return { error: error.message as string, payload: null as null };
  }

  let likeCount = 0;
  let dislikeCount = 0;
  let userReaction: "like" | "dislike" | null = null;

  for (const r of rows ?? []) {
    if (r.reaction === "like") likeCount += 1;
    else if (r.reaction === "dislike") dislikeCount += 1;
    if (r.user_id === viewerUserId) {
      userReaction =
        r.reaction === "like" || r.reaction === "dislike"
          ? r.reaction
          : null;
    }
  }

  return {
    error: null as null,
    payload: {
      commentId,
      likeCount,
      dislikeCount,
      userReaction,
    },
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { commentId, reaction } = parsed.data;

  const { data: comment, error: commentErr } = await supabase
    .from("collective_reading_comments")
    .select("id, book_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentErr) {
    return NextResponse.json({ error: commentErr.message }, { status: 500 });
  }
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", comment.book_id)
    .maybeSingle();

  if (bookErr) {
    return NextResponse.json({ error: bookErr.message }, { status: 500 });
  }
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const readers = book.readers as string[] | null;
  if (!isCollectiveReadingBook(readers)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (reaction === null) {
    const { error: delErr } = await supabase
      .from("collective_reading_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", auth.user.id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  } else {
    const { error: upsertErr } = await supabase
      .from("collective_reading_comment_reactions")
      .upsert(
        {
          comment_id: commentId,
          book_id: comment.book_id,
          user_id: auth.user.id,
          reaction,
        },
        { onConflict: "comment_id,user_id" },
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }
  }

  const aggregated = await aggregateCommentReactionCounts(
    supabase,
    commentId,
    auth.user.id,
  );
  if (aggregated.error) {
    return NextResponse.json({ error: aggregated.error }, { status: 500 });
  }
  return NextResponse.json(aggregated.payload, { status: 200 });
}
