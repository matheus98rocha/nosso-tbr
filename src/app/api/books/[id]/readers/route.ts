import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const userId =
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    typeof payload.userId === "string"
      ? payload.userId.trim()
      : "";

  if (!USER_ID_PATTERN.test(userId)) {
    return NextResponse.json(
      { error: "Escolha uma pessoa para adicionar" },
      { status: 400 },
    );
  }

  if (userId === auth.user.id) {
    return NextResponse.json(
      { error: "Escolha outra pessoa para entrar nesta leitura" },
      { status: 400 },
    );
  }

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id,user_id,chosen_by,readers")
    .eq("id", id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
  }

  if (!canUserParticipateInBook(auth.user.id, book)) {
    return NextResponse.json(
      { error: "Você não participa desta leitura" },
      { status: 403 },
    );
  }

  const currentReaders = Array.isArray(book.readers) ? book.readers : [];

  if (currentReaders.includes(userId)) {
    return NextResponse.json({ ok: true as const });
  }

  const { data: follow, error: followError } = await supabase
    .from("user_followers")
    .select("following_id")
    .eq("follower_id", auth.user.id)
    .eq("following_id", userId)
    .maybeSingle();

  if (followError) {
    return NextResponse.json(
      { error: "Não foi possível confirmar quem você segue" },
      { status: 500 },
    );
  }

  if (!follow) {
    return NextResponse.json(
      { error: "Você só pode adicionar pessoas que segue" },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabase
    .from("books")
    .update({ readers: [...new Set([...currentReaders, userId])] })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Não foi possível adicionar o leitor" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true as const });
}
