import { NextRequest, NextResponse } from "next/server";

import type { RecommendationResponse } from "@/modules/aiRecommendation/types/recommendation.types";

export const dynamic = "force-dynamic";

const DEFAULT_DEV_BOOK_PROVIDER =
  "https://matheus98rocha-tbr-book-provider.hf.space";

function resolveBookProviderBaseUrl(): string | undefined {
  const raw = process.env.TBR_BOOK_PROVIDER_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return DEFAULT_DEV_BOOK_PROVIDER;
  return undefined;
}

export async function POST(request: NextRequest) {
  let body: { user_id?: string; type?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const userId = body?.user_id?.trim();
  const type = body?.type?.trim();

  if (!userId || !type) {
    return NextResponse.json(
      { error: "user_id e type são obrigatórios." },
      { status: 400 },
    );
  }

  const baseUrl = resolveBookProviderBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Serviço de recomendação indisponível." },
      { status: 503 },
    );
  }

  try {
    const upstreamRes = await fetch(`${baseUrl}/ai/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, type }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });

    if (!upstreamRes.ok) {
      const detail = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Não foi possível gerar a recomendação no momento.",
          upstreamStatus: upstreamRes.status,
          detail: detail.slice(0, 300),
        },
        {
          status:
            upstreamRes.status >= 400 && upstreamRes.status < 600
              ? upstreamRes.status
              : 502,
        },
      );
    }

    const data: RecommendationResponse = await upstreamRes.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("ai-recommend upstream fetch failed", { err: e });
    return NextResponse.json(
      { error: "Erro inesperado ao contatar o serviço de recomendação." },
      { status: 500 },
    );
  }
}
