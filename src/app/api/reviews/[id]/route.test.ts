import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440002";
const STRANGER_ID = "770e8400-e29b-41d4-a716-446655440003";

function table(result: { data: unknown; error: { message: string } | null }) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return () => proxy;
      },
    },
  );
  return proxy;
}

async function loadRoute(options: {
  userId?: string | null;
  row?: { id: string; user_id: string } | null;
  findError?: string;
  deleteError?: string;
}) {
  vi.resetModules();
  let reads = 0;
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.userId ? { id: options.userId } : null },
        error: null,
      }),
    },
    from: vi.fn(() => {
      reads += 1;
      if (reads === 1) {
        return table({
          data:
            options.findError || options.row === null
              ? null
              : (options.row ?? { id: REVIEW_ID, user_id: OWNER_ID }),
          error: options.findError ? { message: options.findError } : null,
        });
      }
      return table({
        data: null,
        error: options.deleteError ? { message: options.deleteError } : null,
      });
    }),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return { route: await import("./route"), client };
}

function remove() {
  return [
    new Request("http://localhost", { method: "DELETE" }),
    { params: Promise.resolve({ id: REVIEW_ID }) },
  ] as const;
}

describe("DELETE /api/reviews/[id]", () => {
  it("retorna 401 sem sessão e não consulta a resenha", async () => {
    const { route, client } = await loadRoute({ userId: null });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a resenha não existe e não apaga", async () => {
    const { route, client } = await loadRoute({ userId: OWNER_ID, row: null });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(404);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("retorna 403 para quem não escreveu a resenha", async () => {
    const { route, client } = await loadRoute({ userId: STRANGER_ID });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(403);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("apaga a resenha do autor", async () => {
    const { route, client } = await loadRoute({ userId: OWNER_ID });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(client.from).toHaveBeenCalledTimes(2);
  });

  it("retorna 500 quando a leitura falha e não tenta apagar", async () => {
    const { route, client } = await loadRoute({
      userId: OWNER_ID,
      findError: "select failed",
    });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("retorna 500 quando a exclusão falha", async () => {
    const { route, client } = await loadRoute({
      userId: OWNER_ID,
      deleteError: "delete failed",
    });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "delete failed" });
    expect(client.from).toHaveBeenCalledTimes(2);
  });
});
