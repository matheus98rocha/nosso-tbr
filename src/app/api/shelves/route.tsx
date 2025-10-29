import { createClient } from "@/lib/supabase/server";
import { BookshelfMapper } from "@/modules/shelves/services/mapper/bookshelves.mapper";
import { NextResponse } from "next/server";

const SHELFES_TAG = "shelves";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_shelves")
    .select(
      `*,custom_shelf_books (
          book:books 
          (
            id,
            image_url
          )
        )`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shelfes = data.map(BookshelfMapper.toDomain);

  return NextResponse.json(shelfes, {
    headers: { "x-nextjs-cache-tags": SHELFES_TAG },
  });
}
