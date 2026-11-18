import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440002";
const STRANGER_ID = "770e8400-e29b-41d4-a716-446655440003";

function chain(result: { data: unknown; error: unknown }, log: string[]) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return (...args: unknown[]) => {
          log.push(`${String(prop)}:${args.map(String).join(",")}`);
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
  const log: string[] = [];
  const userId = options.userId === undefined ? OWNER_ID : options.userId;
  const results = [
    {
      data: options.findError ? null : options.row === undefined
        ? { id: REVIEW_ID, user_id: OWNER_ID }
        : options.row,
      error: options.findError ? { message: options.findError } : null,
    },
    {
      data: null,
      error: options.deleteError ? { message: options.deleteError } : null,
    },
  ];
  let call = 0;

  return {
    log,
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: userId ? { id: userId } : null },
          error: null,
        }),
      },
      from: vi.fn((name: string) => {
        log.push(`from:${name}`);
        const result = results[call] ?? results[results.length - 1];
        call += 1;
        return chain(result, log);
      }),
    },
  };
}

async function loadRoute(client: ReturnType<typeof clientFor>["client"]) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function remove() {
  return [
    new Request("http://localhost/api/reviews/" + REVIEW_ID, { method: "DELETE" }),
    { params: Promise.resolve({ id: REVIEW_ID }) },
  ] as const;
}

describe("DELETE /api/reviews/[id]", () => {
  it("retorna 401 sem sessão e não consulta a resenha", async () => {
    const { client, log } = clientFor({ userId: null });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(401);
    expect(log).not.toContain("from:book_reviews");
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 404 e não apaga quando a resenha não existe", async () => {
    const { client, log } = clientFor({ row: null });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(log).toContain("from:book_reviews");
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 403 e não apaga a resenha de outra pessoa", async () => {
    const { client, log } = clientFor({ userId: STRANGER_ID });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("apaga só a resenha de quem está na sessão", async () => {
    const { client, log } = clientFor({});
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(log).toContain(`eq:id,${REVIEW_ID}`);
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(true);
    expect(log.filter((entry) => entry === "from:book_reviews")).toHaveLength(2);
  });

  it("retorna 500 na leitura e não tenta apagar", async () => {
    const { client, log } = clientFor({ findError: "falha ao ler" });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao ler" });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 500 quando o delete falha depois de achar a resenha", async () => {
    const { client, log } = clientFor({ deleteError: "falha ao apagar" });
    const route = await loadRoute(client);
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao apagar" });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(true);
    expect(log).toContain(`eq:id,${REVIEW_ID}`);
  });
});
