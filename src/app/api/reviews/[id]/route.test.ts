import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_ID = "770e8400-e29b-41d4-a716-446655440003";

type QueryCall = {
  op: string;
  filters: Array<[string, unknown]>;
};

function table(
  calls: QueryCall[],
  resultFor: (op: string) => { data: unknown; error: { message: string } | null },
) {
  let op = "select";
  const filters: Array<[string, unknown]> = [];
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => {
            calls.push({ op, filters: [...filters] });
            return Promise.resolve(resultFor(op)).then(onFulfilled, onRejected);
          };
        }
        return (...args: unknown[]) => {
          if (prop === "delete" || prop === "select") op = String(prop);
          if (prop === "eq") filters.push([String(args[0]), args[1]]);
          if (prop === "maybeSingle") {
            calls.push({ op, filters: [...filters] });
            return Promise.resolve(resultFor(op));
          }
          return proxy;
        };
      },
    },
  );
  return proxy;
}

function clientFor(options: {
  userId?: string | null;
  row?: { id: string; user_id: string } | null;
  findError?: string | null;
  deleteError?: string | null;
}) {
  const userId = options.userId === undefined ? USER_ID : options.userId;
  const row =
    options.row === undefined ? { id: REVIEW_ID, user_id: USER_ID } : options.row;
  const calls: QueryCall[] = [];
  return {
    calls,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn(() =>
      table(calls, (op) => {
        if (op === "delete") {
          return {
            data: null,
            error: options.deleteError ? { message: options.deleteError } : null,
          };
        }
        if (options.findError) return { data: null, error: { message: options.findError } };
        return { data: row, error: null };
      }),
    ),
  };
}

async function loadRoute(client: ReturnType<typeof clientFor>) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function remove(id = REVIEW_ID) {
  return [
    new Request("http://localhost/api/reviews/" + id, { method: "DELETE" }),
    { params: Promise.resolve({ id }) },
  ] as const;
}

function deleted(calls: QueryCall[]) {
  return calls.filter((call) => call.op === "delete");
}

describe("DELETE /api/reviews/[id]", () => {
  it("retorna 401 sem sessão e não consulta a resenha", async () => {
    const client = clientFor({ userId: null });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a resenha não existe e não apaga nada", async () => {
    const client = clientFor({ row: null });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("retorna 403 para outra pessoa e não apaga a resenha", async () => {
    const client = clientFor({ userId: OTHER_ID });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("apaga só a resenha pedida quando quem chama é a autora", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(deleted(client.calls)).toEqual([
      { op: "delete", filters: [["id", REVIEW_ID]] },
    ]);
  });

  it("retorna 500 na leitura e não chega no delete", async () => {
    const client = clientFor({ findError: "find down" });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "find down" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("retorna 500 quando o delete da autora falha", async () => {
    const client = clientFor({ deleteError: "delete down" });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "delete down" });
    expect(deleted(client.calls)).toEqual([
      { op: "delete", filters: [["id", REVIEW_ID]] },
    ]);
  });
});
