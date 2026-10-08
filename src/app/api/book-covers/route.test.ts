import { afterEach, describe, expect, it, vi } from "vitest";

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
};

const ALLOWED = "https://m.media-amazon.com/images/I/81abc.jpg";

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function makeClient(userId: string | null): Client {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
  };
}

function stubUnusedFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("fetch should not be called");
    }),
  );
}

describe("GET /api/book-covers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna 401 sem sessão", async () => {
    stubUnusedFetch();
    const route = await loadRoute(makeClient(null));
    const res = await route.GET(
      new Request(`http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`),
    );
    expect(res.status).toBe(401);
  });

  it("retorna 400 para host não permitido", async () => {
    stubUnusedFetch();
    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        "http://localhost/api/book-covers?url=" +
          encodeURIComponent("https://example.com/x.jpg"),
      ),
    );
    expect(res.status).toBe(400);
  });

  it("retorna 400 sem url", async () => {
    stubUnusedFetch();
    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(new Request("http://localhost/api/book-covers"));
    expect(res.status).toBe(400);
  });

  it("segue redirect só quando o destino também é host permitido", async () => {
    const body = new Uint8Array([9, 8, 7]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            Location: "https://images-na.ssl-images-amazon.com/images/I/81abc.jpg",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(body, {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(body);
  });

  it("rejeita redirect para host não permitido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "https://evil.example/phish.jpg" },
        }),
      ),
    );

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(502);
  });

  it("retorna 502 quando o fetch falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(502);
  });

  it("retorna 400 quando o content-type não é imagem", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html></html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(400);
  });

  it("retorna 413 quando a capa passa do limite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1]), {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Content-Length": String(6 * 1024 * 1024),
          },
        }),
      ),
    );

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(413);
  });

  it("repassa a imagem quando o host é permitido", async () => {
    const body = new Uint8Array([1, 2, 3]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      ),
    );

    const route = await loadRoute(makeClient("user-1"));
    const res = await route.GET(
      new Request(
        `http://localhost/api/book-covers?url=${encodeURIComponent(ALLOWED)}`,
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(body);
  });
});
