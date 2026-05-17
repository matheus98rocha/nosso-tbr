import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";

const MAX_BOOK_IDS = 100;

const querySchema = z.object({
  bookIds: z
    .string()
    .min(1, "bookIds required")
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().uuid({ message: "Invalid bookId UUID" }))
        .min(1, "bookIds required")
        .max(MAX_BOOK_IDS, `Too many bookIds (max ${MAX_BOOK_IDS})`),
    ),
});

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const url = new URL(request.url);
  const raw = url.searchParams.get("bookIds") ?? "";

  const parsed = querySchema.safeParse({ bookIds: raw });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bookIds", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc(
    "get_schedule_progress_for_books",
    { book_ids: parsed.data.bookIds },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}
