import { describe, expect, it, vi } from "vitest";

import {
  BOOK_IMPORT_STORYGRAPH_MESSAGE,
  BOOK_IMPORT_UNRECOGNIZED_MESSAGE,
} from "@/modules/bookUpsert/services/bookImport";

type ImportRouteMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  rpc: ReturnType<typeof vi.fn>;
};

async function loadRoute(client: ImportRouteMock) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

function requestWithCsv(csv: string) {
  return {
    formData: async () => ({
      get: (name: string) =>
        name === "file"
          ? {
              text: async () => csv,
            }
          : null,
    }),
  } as unknown as Request;
}

function authenticatedClient(rpc = vi.fn()): ImportRouteMock {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    rpc,
  };
}

describe("POST /api/books/import", () => {
  it("responde 401 sem sessão", async () => {
    const route = await loadRoute({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      rpc: vi.fn(),
    });

    const response = await route.POST(requestWithCsv("titulo,autor,paginas,status,data_fim\n"));

    expect(response.status).toBe(401);
  });

  it("não grava a linha de exemplo e envia o restante", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { createdCount: 1, duplicates: [], invalid: [] },
      error: null,
    });
    const route = await loadRoute(authenticatedClient(rpc));

    const response = await route.POST(
      requestWithCsv(
        [
          "titulo,autor,paginas,status,data_fim",
          "Exemplo: não importar,Nosso TBR,1,not_started,",
          "Duna,Frank Herbert,10,not_started,",
        ].join("\n"),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      kind: "report",
      createdCount: 1,
      rejectedCount: 0,
      rejectedRows: [],
    });
    expect(rpc).toHaveBeenCalledWith("import_reader_books", {
      p_rows: [
        {
          title: "Duna",
          author_name: "Frank Herbert",
          pages: 10,
          status: "not_started",
          end_date: null,
        },
      ],
    });
  });

  it("junta duplicata que já está na biblioteca", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        createdCount: 0,
        duplicates: [{ title: "Duna" }],
        invalid: [],
      },
      error: null,
    });
    const route = await loadRoute(authenticatedClient(rpc));

    const response = await route.POST(
      requestWithCsv(
        "titulo,autor,paginas,status,data_fim\nDuna,Frank Herbert,10,not_started,\n",
      ),
    );

    await expect(response.json()).resolves.toEqual({
      kind: "report",
      createdCount: 0,
      rejectedCount: 1,
      rejectedRows: [{ title: "Duna", reason: "duplicate" }],
    });
  });

  it("recusa o StoryGraph sem chamar a gravação", async () => {
    const rpc = vi.fn();
    const route = await loadRoute(authenticatedClient(rpc));

    const response = await route.POST(
      requestWithCsv("Title,Authors,Read Status\nDuna,Frank Herbert,read\n"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      kind: "refused",
      message: BOOK_IMPORT_STORYGRAPH_MESSAGE,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("recusa cabeçalho desconhecido", async () => {
    const rpc = vi.fn();
    const route = await loadRoute(authenticatedClient(rpc));

    const response = await route.POST(requestWithCsv("nome,pagina\nA,1\n"));

    await expect(response.json()).resolves.toEqual({
      kind: "refused",
      message: BOOK_IMPORT_UNRECOGNIZED_MESSAGE,
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
