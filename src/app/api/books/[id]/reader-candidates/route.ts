import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import {
  canSearchReaderCandidates,
  excludeCurrentReaders,
  READER_CANDIDATE_LIMIT,
  toReaderCandidateOrFilter,
  toReaderCandidates,
  toReaderSearchPattern,
} from "@/lib/books/readerCandidates";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await requireUser(supabase);

  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const term = new URL(request.url).searchParams.get("q") ?? "";

  if (!canSearchReaderCandidates(term)) {
    return NextResponse.json({ candidates: [] });
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

  const { data: followingRows, error: followingError } = await supabase
    .from("user_followers")
    .select("following_id")
    .eq("follower_id", auth.user.id);

  if (followingError) {
    return NextResponse.json(
      { error: "Não foi possível carregar quem você segue" },
      { status: 500 },
    );
  }

  const readerIds = Array.isArray(book.readers) ? book.readers : [];
  const allowedIds = excludeCurrentReaders(
    (followingRows ?? []).map((row) => row.following_id as string),
    readerIds,
    auth.user.id,
  );

  if (allowedIds.length === 0) {
    return NextResponse.json({ candidates: [] });
  }

  const pattern = toReaderSearchPattern(term);

  if (!pattern) {
    return NextResponse.json({ candidates: [] });
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, email")
    .in("id", allowedIds)
    .or(toReaderCandidateOrFilter(pattern))
    .order("display_name", { ascending: true })
    .limit(READER_CANDIDATE_LIMIT);

  if (usersError) {
    return NextResponse.json(
      { error: "Não foi possível buscar leitores" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    candidates: toReaderCandidates(
      users ?? [],
      new Set(allowedIds),
      new Set(readerIds),
      term,
    ),
  });
}
