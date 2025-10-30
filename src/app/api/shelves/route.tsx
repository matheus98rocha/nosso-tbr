import { createClient } from "@/lib/supabase/server";
import { BookshelfMapper } from "@/modules/shelves/services/mapper/bookshelves.mapper";
import { NextResponse } from "next/server";

const SHELFES_TAG = "shelves";

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
    headers: { "x-nextjs-cache-tags": SHELFES_TAG },
  });
}
