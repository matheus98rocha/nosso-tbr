import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/app/api/_utils/requireUser";

const patchBody = z.object({
  name: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
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

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: shelf, error: se } = await supabase
    .from("custom_shelves")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (se) {
    return NextResponse.json({ error: se.message }, { status: 500 });
  }
  if (!shelf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (shelf.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("custom_shelves")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data: shelf, error: se } = await supabase
    .from("custom_shelves")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (se) {
    return NextResponse.json({ error: se.message }, { status: 500 });
  }
  if (!shelf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (shelf.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("custom_shelves").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
