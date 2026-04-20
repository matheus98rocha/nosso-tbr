import { NextRequest, NextResponse } from "next/server";
import { BookSearchResponse } from "@/modules/bookUpsert/types/bookCandidate.types";

const HF_BASE_URL = process.env.TBR_BOOK_PROVIDER_URL;
const CACHE_TTL = 60 * 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const limit = searchParams.get("limit") ?? "5";

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      { error: "Parâmetro 'q' deve ter ao menos 2 caracteres." },
      { status: 400 },
    );
  }

  if (!HF_BASE_URL) {
    return NextResponse.json(
      { error: "Serviço de busca indisponível." },
      { status: 503 },
    );
  }

  const url = new URL(`${HF_BASE_URL}/books/search`);
  url.searchParams.set("q", q.trim());
  url.searchParams.set("limit", limit);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: CACHE_TTL },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao buscar livros." },
        { status: response.status },
      );
    }

    const data: BookSearchResponse = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado ao contatar o serviço de busca." },
      { status: 500 },
    );
  }
}
