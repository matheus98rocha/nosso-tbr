import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: row, error: findErr } = await supabase
    .from("book_reviews")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Resenha não encontrada" }, { status: 404 });
  }
  if (row.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from("book_reviews")
    .delete()
    .eq("id", id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
