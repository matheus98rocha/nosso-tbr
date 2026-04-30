import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

describe("GET /api/book-lookup", () => {
  const originalFetch = globalThis.fetch;
  let prevUrl: string | undefined;
  let prevNodeEnv: string | undefined;

  beforeEach(() => {
    prevUrl = process.env.TBR_BOOK_PROVIDER_URL;
    prevNodeEnv = process.env.NODE_ENV;
    delete process.env.TBR_BOOK_PROVIDER_URL;
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (prevUrl === undefined) delete process.env.TBR_BOOK_PROVIDER_URL;
    else process.env.TBR_BOOK_PROVIDER_URL = prevUrl;
    if (prevNodeEnv !== undefined) process.env.NODE_ENV = prevNodeEnv;
  });

  describe("RN integração book provider — proxy seguro sem rede nos defaults", () => {
    it("retorna 400 quando q ausente ou curto demais", async () => {
      const { GET } = await import("./route");
      const short = new NextRequest(
        "http://localhost/api/book-lookup?q=a",
      );
      expect((await GET(short)).status).toBe(400);

      const empty = new NextRequest("http://localhost/api/book-lookup?q=");
      expect((await GET(empty)).status).toBe(400);
    });

    it("retorna 503 em produção sem TBR_BOOK_PROVIDER_URL", async () => {
      process.env.NODE_ENV = "production";
      vi.resetModules();
      const { GET } = await import("./route");
      const req = new NextRequest("http://localhost/api/book-lookup?q=ab");
      const res = await GET(req);
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toContain("TBR_BOOK_PROVIDER_URL");
    });

    it("retorna dados quando upstream responde 200", async () => {
      process.env.TBR_BOOK_PROVIDER_URL = "http://provider.test";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          candidates: [],
          query: "ab",
          total: 0,
        }),
        text: vi.fn(),
      });

      vi.resetModules();
      const { GET } = await import("./route");
      const req = new NextRequest(
        "http://localhost/api/book-lookup?q=ab&limit=2",
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        candidates: [],
        query: "ab",
        total: 0,
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("http://provider.test/books/search"),
        expect.any(Object),
      );
    });

    it("propaga faixa 4xx/5xx do upstream quando response não ok", async () => {
      process.env.TBR_BOOK_PROVIDER_URL = "http://provider.test";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 418,
        text: vi.fn().mockResolvedValue("teapot"),
        json: vi.fn(),
      });

      vi.resetModules();
      const { GET } = await import("./route");
      const req = new NextRequest("http://localhost/api/book-lookup?q=abc");
      const res = await GET(req);
      expect(res.status).toBe(418);
      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.upstreamStatus).toBe(418);
    });
  });
});
