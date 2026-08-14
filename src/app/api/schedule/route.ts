import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { ScheduleUpsertMapper } from "@/modules/schedule/services/mappers/schedule.mapper";
import type { ScheduleCreateValidator } from "@/modules/schedule/types/schedule.types";

const scheduleItem = z.object({
  book_id: z.string().uuid(),
  owner: z.string().uuid(),
  date: z.union([z.string(), z.coerce.date()]),
  chapters: z.union([z.string(), z.array(z.string())]),
  completed: z.boolean().optional(),
});

const postBody = z.object({
  schedules: z.array(scheduleItem).min(1),
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

  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  for (const row of parsed.data.schedules) {
    if (row.owner !== auth.user.id) {
      return NextResponse.json(
        { error: "owner must match authenticated user" },
        { status: 403 },
      );
    }

    const { data: book, error: be } = await supabase
      .from("books")
      .select("user_id,chosen_by,readers")
      .eq("id", row.book_id)
      .maybeSingle();

    if (be) {
      return NextResponse.json({ error: be.message }, { status: 500 });
    }
    if (!book) {
      return NextResponse.json(
        { error: `Book not found: ${row.book_id}` },
        { status: 400 },
      );
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
  }

  const payload = parsed.data.schedules.map((row) => {
    const chapters =
      typeof row.chapters === "string" ? row.chapters : row.chapters.join(", ");

    const domain: ScheduleCreateValidator = {
      book_id: row.book_id,
      owner: row.owner,
      date: row.date instanceof Date ? row.date : new Date(row.date),
      chapters,
      completed: row.completed,
    };
    return ScheduleUpsertMapper.toPersistence(domain);
  });

  const { error } = await supabase.from("schedule").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const url = new URL(request.url);
  const bookId = url.searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("schedule")
    .delete()
    .eq("book_id", bookId)
    .eq("owner", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
