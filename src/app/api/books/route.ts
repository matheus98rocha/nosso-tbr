import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { BookUpsertMapper } from "@/modules/bookUpsert/services/mappers/bookUpsert.mapper";
import { ensureCreatableStatus } from "@/modules/bookUpsert/services/bookUpsert.validation";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { requireUser } from "@/app/api/_utils/requireUser";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("books").select("*");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

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

  const parsed = bookCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    ensureCreatableStatus(parsed.data.status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid status";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const row = {
    user_id: parsed.data.user_id?.trim() || null,
    chosen_by: parsed.data.chosen_by,
    readers: parsed.data.readers,
  };
  if (!canUserParticipateInBook(auth.user.id, row)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = BookUpsertMapper.toPersistence(parsed.data);

  const { data, error } = await supabase
    .from("books")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.id) {
    return NextResponse.json(
      { error: "Livro criado, mas ID não retornado." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
