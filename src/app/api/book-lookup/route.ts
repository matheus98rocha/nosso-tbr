import { NextRequest, NextResponse } from "next/server";
import { BookSearchResponse } from "@/modules/bookUpsert/types/bookCandidate.types";

export const dynamic = "force-dynamic";

const CACHE_TTL = 60 * 60;

const DEFAULT_DEV_BOOK_PROVIDER =
  "https://matheus98rocha-tbr-book-provider.hf.space";

function resolveBookProviderBaseUrl(): string | undefined {
  const raw = process.env.TBR_BOOK_PROVIDER_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return DEFAULT_DEV_BOOK_PROVIDER;
  return undefined;
}

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

  const baseUrl = resolveBookProviderBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      {
        error:
          "Serviço de busca indisponível. Defina TBR_BOOK_PROVIDER_URL no ambiente.",
      },
      { status: 503 },
    );
  }

  const url = new URL(`${baseUrl}/books/search`);
  url.searchParams.set("q", q.trim());
  url.searchParams.set("limit", limit);

  const fetchOptions =
    process.env.NODE_ENV === "development"
      ? ({ cache: "no-store" as const } satisfies RequestInit)
      : ({ next: { revalidate: CACHE_TTL } } satisfies RequestInit);

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Falha ao buscar livros.",
          upstreamStatus: response.status,
          detail: bodyText.slice(0, 300),
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
      );
    }

    const data: BookSearchResponse = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("book-lookup upstream fetch failed", { url: url.toString(), err: e });
    return NextResponse.json(
      {
        error:
          "Erro inesperado ao contatar o serviço de busca. Verifique TBR_BOOK_PROVIDER_URL e se o tbr-book-provider está rodando.",
      },
      { status: 500 },
    );
  }
}
