import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import {
  SHELF_BOOK_CANNOT_ADD_MESSAGE,
  SHELF_BOOK_DUPLICATE_CODE,
  SHELF_BOOK_FORBIDDEN_NOT_PARTICIPANT_MESSAGE,
  SHELF_BOOK_NOT_FOUND_MESSAGE,
  SHELF_FORBIDDEN_NOT_OWNER_MESSAGE,
  SHELF_NOT_FOUND_MESSAGE,
} from "@/constants/shelfBook";

type Ctx = {
  params: Promise<{ id: string; bookId: string }>;
};

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id: shelfId, bookId } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: shelf, error: se } = await supabase
    .from("custom_shelves")
    .select("id, user_id")
    .eq("id", shelfId)
    .maybeSingle();

  if (se) {
    return NextResponse.json({ error: se.message }, { status: 500 });
  }
  if (!shelf) {
    return NextResponse.json({ error: SHELF_NOT_FOUND_MESSAGE }, { status: 404 });
  }
  if (shelf.user_id !== auth.user.id) {
    return NextResponse.json(
      { error: SHELF_FORBIDDEN_NOT_OWNER_MESSAGE },
      { status: 403 },
    );
  }

  const { data: book, error: be } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", bookId)
    .maybeSingle();

  if (be) {
    return NextResponse.json({ error: be.message }, { status: 500 });
  }
  if (!book) {
    return NextResponse.json(
      { error: SHELF_BOOK_NOT_FOUND_MESSAGE },
      { status: 404 },
    );
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers: book.readers as string[] | null,
    })
  ) {
    return NextResponse.json(
      { error: SHELF_BOOK_FORBIDDEN_NOT_PARTICIPANT_MESSAGE },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("custom_shelf_books")
    .delete()
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}

export async function POST(_request: Request, ctx: Ctx) {
  const { id: shelfId, bookId } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: shelf, error: se } = await supabase
    .from("custom_shelves")
    .select("id, user_id")
    .eq("id", shelfId)
    .maybeSingle();

  if (se) {
    return NextResponse.json({ error: se.message }, { status: 500 });
  }
  if (!shelf) {
    return NextResponse.json({ error: SHELF_BOOK_CANNOT_ADD_MESSAGE }, { status: 404 });
  }
  if (shelf.user_id !== auth.user.id) {
    return NextResponse.json(
      { error: SHELF_BOOK_CANNOT_ADD_MESSAGE },
      { status: 403 },
    );
  }

  const { data: existingRow, error: existingErr } = await supabase
    .from("custom_shelf_books")
    .select("id")
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (existingErr) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (existingRow) {
    return NextResponse.json(
      {
        error: SHELF_BOOK_CANNOT_ADD_MESSAGE,
        code: SHELF_BOOK_DUPLICATE_CODE,
      },
      { status: 409 },
    );
  }

  const { data: book, error: be } = await supabase
    .from("books")
    .select("user_id,chosen_by,readers")
    .eq("id", bookId)
    .maybeSingle();

  if (be) {
    return NextResponse.json({ error: be.message }, { status: 500 });
  }
  if (!book) {
    return NextResponse.json(
      { error: SHELF_BOOK_CANNOT_ADD_MESSAGE },
      { status: 404 },
    );
  }

  if (
    !canUserParticipateInBook(auth.user.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers: book.readers as string[] | null,
    })
  ) {
    return NextResponse.json(
      { error: SHELF_BOOK_CANNOT_ADD_MESSAGE },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("custom_shelf_books").insert({
    shelf_id: shelfId,
    book_id: bookId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: SHELF_BOOK_CANNOT_ADD_MESSAGE,
          code: SHELF_BOOK_DUPLICATE_CODE,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const }, { status: 201 });
}
