import { createClient } from "@/lib/supabase/server";
import { BookshelfMapper } from "@/modules/shelves/services/mapper/bookshelves.mapper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";

const SHELFES_TAG = "shelves";

const postBody = z.object({
  name: z.string().min(1),
  user_id: z.string().uuid(),
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

  if (parsed.data.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("custom_shelves").insert({
    name: parsed.data.name,
    user_id: parsed.data.user_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const }, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("custom_shelves")
    .select(
      `*,custom_shelf_books (
          book:books (
            id,
            image_url
          )
        )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shelves = data.map(BookshelfMapper.toDomain);

  return NextResponse.json(shelves, {
    headers: {
      "x-nextjs-cache-tags": SHELFES_TAG,
      "Cache-Control": "no-store",
    },
  });
}
