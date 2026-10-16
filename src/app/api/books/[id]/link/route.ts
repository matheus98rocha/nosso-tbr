import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/requireUser";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: book, error: loadError } = await supabase
    .from("books")
    .select("id")
    .eq("id", id)
    .single();

  if (loadError || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: linked, error: linkError } = await supabase.rpc(
    "link_current_reader_to_book",
    { p_book_id: id },
  );

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  if (linked !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true as const });
}
