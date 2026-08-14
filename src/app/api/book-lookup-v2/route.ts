import { NextRequest, NextResponse } from "next/server";

import { BookLookupResponse } from "@/modules/bookUpsert/types/bookLookup.types";

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
  const title = searchParams.get("title");
  const isbn = searchParams.get("isbn");
  const lang = searchParams.get("lang") ?? "por";

  if ((!title && !isbn) || (title && isbn)) {
    return NextResponse.json(
      { error: "Informe title OU isbn (não ambos, não nenhum)." },
      { status: 422 },
    );
  }

  const baseUrl = resolveBookProviderBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Serviço de busca indisponível." },
      { status: 503 },
    );
  }

  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (isbn) params.set("isbn", isbn);
  params.set("lang", lang);

  const fetchOptions =
    process.env.NODE_ENV === "development"
      ? ({ cache: "no-store" as const } satisfies RequestInit)
      : ({ next: { revalidate: CACHE_TTL } } satisfies RequestInit);

  try {
    const upstreamRes = await fetch(
      `${baseUrl}/books/lookup?${params.toString()}`,
      { ...fetchOptions, signal: AbortSignal.timeout(25_000) },
    );

    if (!upstreamRes.ok) {
      const bodyText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Falha ao buscar livro.",
          upstreamStatus: upstreamRes.status,
          detail: bodyText.slice(0, 300),
        },
        {
          status:
            upstreamRes.status >= 400 && upstreamRes.status < 600
              ? upstreamRes.status
              : 502,
        },
      );
    }

    const data: BookLookupResponse = await upstreamRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("book-lookup-v2 upstream fetch failed", {
      params: params.toString(),
      err: e,
    });
    return NextResponse.json(
      { error: "Erro inesperado ao contatar o serviço de busca." },
      { status: 500 },
    );
  }
}
