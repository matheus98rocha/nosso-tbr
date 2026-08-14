import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { BookUpsertMapper } from "@/modules/bookUpsert/services/mappers/bookUpsert.mapper";
import { normalizeDatesForTransition } from "@/modules/bookUpsert/services/bookStatusTransition";
import {
  validateTransition,
} from "@/modules/bookUpsert/services/bookUpsert.validation";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { requireUser } from "@/app/api/_utils/requireUser";
import type { Status } from "@/types/books.types";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
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

  const parsed = bookCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: currentBook, error: loadError } = await supabase
    .from("books")
    .select("id,status,start_date,end_date,user_id,chosen_by,readers")
    .eq("id", id)
    .single();

  if (loadError || !currentBook) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const participation = {
    user_id: currentBook.user_id,
    chosen_by: currentBook.chosen_by,
    readers: currentBook.readers as string[] | null,
  };
  if (!canUserParticipateInBook(auth.user.id, participation)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    validateTransition(
      currentBook as { status?: Status; start_date?: string | null },
      parsed.data.status,
      parsed.data.start_date,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid transition";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const payload = BookUpsertMapper.toPersistence(parsed.data);
  const normalizedDates = normalizeDatesForTransition({
    currentStatus: currentBook?.status as Status | undefined,
    currentStartDate: currentBook?.start_date,
    currentEndDate: currentBook?.end_date,
    nextStatus: parsed.data.status,
    nextStartDate: parsed.data.start_date,
    nextEndDate: parsed.data.end_date,
  });
  payload.start_date = normalizedDates.start_date;
  payload.end_date = normalizedDates.end_date;

  const { error } = await supabase.from("books").update(payload).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(_request: Request, ctx: RouteParams) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: row, error: loadError } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: row.user_id,
      chosen_by: row.chosen_by,
      readers: row.readers as string[] | null,
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
