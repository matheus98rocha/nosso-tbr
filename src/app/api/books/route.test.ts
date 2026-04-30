import { describe, expect, it, vi } from "vitest";

type SupabaseBooksRouteMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

const validPayload = {
  title: "Livro Seguro",
  author_id: "author-1",
  chosen_by: "user-owner",
  pages: 123,
  readers: ["user-owner"],
  status: "reading" as const,
};

function buildInsertSelectSingle(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

function clientWithParticipantAndInsert(
  chain: ReturnType<typeof buildInsertSelectSingle>,
): SupabaseBooksRouteMock {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-owner" } },
        error: null,
      }),
    },
    from: vi.fn(() => ({ insert: chain.insert })),
  };
}

async function loadRouteWithClient(client: SupabaseBooksRouteMock) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

async function loadRouteWithValidationStub(
  client: SupabaseBooksRouteMock,
  ensureCreatableStatusImpl: () => void,
) {
  vi.resetModules();
  vi.doMock("@/modules/bookUpsert/services/bookUpsert.validation", () => ({
    ensureCreatableStatus: vi.fn(ensureCreatableStatusImpl),
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

describe("GET /api/books", () => {
  it("returns book rows when select succeeds without consulting auth session", async () => {
    const getUser = vi.fn();
    const rows = [{ id: "b1", title: "A" }];
    const client: SupabaseBooksRouteMock = {
      auth: { getUser },
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
      })),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(rows);
    expect(client.from).toHaveBeenCalledWith("books");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns 500 when select fails", async () => {
    const getUser = vi.fn();
    const client: SupabaseBooksRouteMock = {
      auth: { getUser },
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "database error" },
        }),
      })),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "database error",
    });
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe("POST /api/books", () => {
  it("returns 401 when user is not authenticated", async () => {
    const client: SupabaseBooksRouteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns 400 when body is not valid JSON", async () => {
    const client: SupabaseBooksRouteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-owner" } },
          error: null,
        }),
      },
      from: vi.fn(),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
  });

  it("returns 400 with details when payload fails validation", async () => {
    const client: SupabaseBooksRouteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-owner" } },
          error: null,
        }),
      },
      from: vi.fn(),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validPayload, title: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid payload");
    expect(body.details).toBeDefined();
  });

  it("returns 400 when status is not creatable", async () => {
    const chain = buildInsertSelectSingle({
      data: null,
      error: null,
    });
    const client: SupabaseBooksRouteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-owner" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ insert: chain.insert })),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validPayload, status: "paused" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "Livros não podem ser criados com status pausado ou abandonado.",
    });
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it("returns 403 and does not insert when authenticated user is not a participant", async () => {
    const insert = vi.fn();
    const client: SupabaseBooksRouteMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "intruder-user" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ insert })),
    };

    const route = await loadRouteWithClient(client);

    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("returns 201 with id when insert succeeds", async () => {
    const chain = buildInsertSelectSingle({
      data: { id: "new-book-id" },
      error: null,
    });
    const client = clientWithParticipantAndInsert(chain);

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "new-book-id" });
    expect(chain.insert).toHaveBeenCalled();
    expect(chain.select).toHaveBeenCalledWith("id");
    expect(chain.single).toHaveBeenCalled();
  });

  it("returns 500 when insert returns error", async () => {
    const chain = buildInsertSelectSingle({
      data: null,
      error: { message: "unique violation" },
    });
    const client = clientWithParticipantAndInsert(chain);

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "unique violation",
    });
  });

  it("returns 500 when insert succeeds but id is missing", async () => {
    const chain = buildInsertSelectSingle({
      data: {},
      error: null,
    });
    const client = clientWithParticipantAndInsert(chain);

    const route = await loadRouteWithClient(client);
    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Livro criado, mas ID não retornado.",
    });
  });

  it("returns 400 with fallback message when ensureCreatableStatus throws non-Error", async () => {
    const chain = buildInsertSelectSingle({
      data: null,
      error: null,
    });
    const client = clientWithParticipantAndInsert(chain);

    const route = await loadRouteWithValidationStub(client, () => {
      throw "not-an-error";
    });

    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid status",
    });
  });
});
