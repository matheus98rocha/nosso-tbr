import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/requireUser";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: RouteParams) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: book, error: loadError } = await supabase
    .from("books")
    .select("id,readers")
    .eq("id", id)
    .single();

  if (loadError || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const nextReaders = Array.isArray(book.readers)
    ? [...new Set([...book.readers, auth.user.id])]
    : [auth.user.id];

  const { error: updateError } = await supabase
    .from("books")
    .update({ readers: nextReaders })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
