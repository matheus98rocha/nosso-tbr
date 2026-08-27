import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/requireUser";
import { z } from "zod";
import { validateShelfReorderPayload } from "@/modules/bookshelves/utils/shelfBookOrder";

const bodySchema = z.object({
  bookIds: z.array(z.string().uuid()),
});

type Ctx = {
  params: { id: string };
};

export async function POST(request: Request, ctx: Ctx) {
  const { id: shelfId } = ctx.params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { bookIds } = parsed.data;

  const { data: rows, error: fetchError } = await supabase
    .from("custom_shelf_books")
    .select("book_id")
    .eq("shelf_id", shelfId)
    .order("sort_order", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const currentIds = (rows ?? [])
    .map((r) => r.book_id)
    .filter((id): id is string => id !== null);

  try {
    validateShelfReorderPayload(currentIds, bookIds);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid order";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc("reorder_custom_shelf_books", {
    p_shelf_id: shelfId,
    p_book_ids: bookIds,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "Failed to reorder";
    const status =
      msg.includes("Forbidden") || msg.includes("not found") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true as const });
}
