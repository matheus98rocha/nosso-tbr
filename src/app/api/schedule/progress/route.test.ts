import { describe, expect, it, vi } from "vitest";

const OWNER_ID = "660e8400-e29b-41d4-a716-446655440002";
const BOOK_A = "550e8400-e29b-41d4-a716-446655440001";
const BOOK_B = "550e8400-e29b-41d4-a716-446655440002";

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  rpc: ReturnType<typeof vi.fn>;
};

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function makeClient(rpcResult: {
  data?: unknown;
  error?: { message: string } | null;
}, userId: string | null = OWNER_ID): Client {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

describe("GET /api/schedule/progress", () => {
  it("retorna 401 sem sessão (RN20)", async () => {
    const client = makeClient({ data: [], error: null }, null);
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(`http://localhost/api/schedule/progress?bookIds=${BOOK_A}`),
    );
    expect(res.status).toBe(401);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando bookIds está ausente", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request("http://localhost/api/schedule/progress"),
    );
    expect(res.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando bookIds está vazio após split", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request("http://localhost/api/schedule/progress?bookIds=,,,"),
    );
    expect(res.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando algum bookId não é UUID válido", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(
        `http://localhost/api/schedule/progress?bookIds=${BOOK_A},nao-uuid`,
      ),
    );
    expect(res.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando excede o limite de bookIds", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const tooMany = Array.from({ length: 101 }, () => BOOK_A).join(",");
    const res = await route.GET(
      new Request(`http://localhost/api/schedule/progress?bookIds=${tooMany}`),
    );
    expect(res.status).toBe(400);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 200 com array vazio quando RPC não retorna nenhuma linha", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(`http://localhost/api/schedule/progress?bookIds=${BOOK_A}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual([]);
  });

  it("retorna 200 e propaga o payload da RPC", async () => {
    const payload = [
      { book_id: BOOK_A, total: 10, completed: 4 },
      { book_id: BOOK_B, total: 5, completed: 5 },
    ];
    const client = makeClient({ data: payload, error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(
        `http://localhost/api/schedule/progress?bookIds=${BOOK_A},${BOOK_B}`,
      ),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(payload);
    expect(client.rpc).toHaveBeenCalledWith("get_schedule_progress_for_books", {
      book_ids: [BOOK_A, BOOK_B],
    });
  });

  it("retorna 200 com colunas de prazo da RPC sem alterar o contrato HTTP", async () => {
    const payload = [
      {
        book_id: BOOK_A,
        total: 10,
        completed: 6,
        overdue: 0,
        ahead: 1,
        last_date: "2026-08-10",
      },
    ];
    const client = makeClient({ data: payload, error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(`http://localhost/api/schedule/progress?bookIds=${BOOK_A}`),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(payload);
  });

  it("trim e dedup vazios mas preserva UUIDs com espaços externos", async () => {
    const client = makeClient({ data: [], error: null });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(
        `http://localhost/api/schedule/progress?bookIds=${encodeURIComponent(
          ` ${BOOK_A} , ${BOOK_B} `,
        )}`,
      ),
    );
    expect(res.status).toBe(200);
    expect(client.rpc).toHaveBeenCalledWith("get_schedule_progress_for_books", {
      book_ids: [BOOK_A, BOOK_B],
    });
  });

  it("retorna 500 quando a RPC falha", async () => {
    const client = makeClient({
      data: null,
      error: { message: "rpc error" },
    });
    const route = await loadRoute(client);
    const res = await route.GET(
      new Request(`http://localhost/api/schedule/progress?bookIds=${BOOK_A}`),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "rpc error" });
  });
});
