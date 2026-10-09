import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_utils/requireUser";
import {
  isAllowedBookCoverRedirectUrl,
  isAllowedBookCoverUrl,
} from "@/constants/bookCover";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;

function isImageContentType(value: string | null): boolean {
  if (!value) return false;
  const contentType = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return contentType.startsWith("image/");
}

function isProxyableCoverUrl(url: string): boolean {
  return Boolean(url) && !url.startsWith("/") && isAllowedBookCoverUrl(url);
}

async function fetchAllowedCover(url: string): Promise<Response | null> {
  let current = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const allowed =
      hop === 0
        ? isProxyableCoverUrl(current)
        : isAllowedBookCoverRedirectUrl(current);
    if (!allowed) return null;

    const upstream = await fetch(current, {
      redirect: "manual",
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (upstream.status >= 200 && upstream.status < 300) {
      return upstream;
    }

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) return null;
      current = new URL(location, current).toString();
      continue;
    }

    return null;
  }

  return null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const url = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  if (!isProxyableCoverUrl(url)) {
    return NextResponse.json({ error: "Invalid cover url" }, { status: 400 });
  }

  let upstream: Response | null;
  try {
    upstream = await fetchAllowedCover(url);
  } catch {
    return NextResponse.json({ error: "Cover fetch failed" }, { status: 502 });
  }

  if (!upstream) {
    return NextResponse.json({ error: "Cover fetch failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type");
  if (!isImageContentType(contentType)) {
    return NextResponse.json({ error: "Invalid cover url" }, { status: 400 });
  }

  const contentLength = Number(upstream.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
    return NextResponse.json({ error: "Cover too large" }, { status: 413 });
  }

  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Cover too large" }, { status: 413 });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
