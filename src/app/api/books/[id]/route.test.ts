import { describe, expect, it, vi } from "vitest";

type SupabaseByIdMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

const PATCH_BOOK_SELECT_COLUMNS =
  "id,status,start_date,end_date,user_id,chosen_by,readers";
const DELETE_BOOK_SELECT_COLUMNS = "user_id,chosen_by,readers";

const validPatchPayload = {
  title: "Livro Seguro",
  author_id: "author-1",
  chosen_by: "owner-user",
  pages: 123,
  readers: ["owner-user"],
  status: "reading" as const,
};

function authedGetUser(userId: string) {
  return vi.fn().mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

function buildBookSelectSingle(row: unknown, loadError: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: row, error: loadError });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, single };
}

function buildBookSelectMaybeSingle(
  row: unknown,
  loadError: unknown = null,
) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: row, error: loadError });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, maybeSingle };
}

function buildTwoTableCalls(first: object, second: object) {
  return vi
    .fn()
    .mockImplementationOnce(() => first)
    .mockImplementationOnce(() => second);
}

async function loadRouteWithClient(client: SupabaseByIdMock) {
  vi.resetModules();

  vi.doMock(
    "@/modules/bookUpsert/services/bookUpsert.validation",
    async (importOriginal) =>
      importOriginal<
        typeof import("@/modules/bookUpsert/services/bookUpsert.validation")
      >(),
  );

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

async function loadRouteWithClientAndValidationThrow(
  client: SupabaseByIdMock,
  thrown: unknown,
) {
  vi.resetModules();

  vi.doMock("@/modules/bookUpsert/services/bookUpsert.validation", () => ({
    validateTransition: vi.fn(() => {
      throw thrown;
    }),
  }));

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

describe("PATCH /api/books/[id]", () => {
  describe("RN20 / RN48 — sessão obrigatória em mutação", () => {
    it("retorna 401 e não consulta books quando não há usuário autenticado", async () => {
      const client: SupabaseByIdMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
      expect(Object.keys(body)).toEqual(["error"]);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe("RN42 / RN48 — participação antes de persistir", () => {
    it("retorna 403 e não chama update quando o usuário não está em user_id, chosen_by nem readers", async () => {
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };

      const readBuilder = buildBookSelectSingle(currentBook);
      const update = vi.fn();
      const client: SupabaseByIdMock = {
        auth: {
          getUser: authedGetUser("intruder-user"),
        },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: "Forbidden" });
      expect(Object.keys(body)).toEqual(["error"]);
      expect(client.from).toHaveBeenCalledWith("books");
      expect(readBuilder.select).toHaveBeenCalledWith(PATCH_BOOK_SELECT_COLUMNS);
      expect(readBuilder.eq).toHaveBeenCalledWith("id", "book-1");
      expect(update).not.toHaveBeenCalled();
    });

    it("permite PATCH quando o usuário participa apenas como co-leitor em readers", async () => {
      const coReaderId = "co-reader-user";
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "shelf-owner",
        chosen_by: "shelf-owner",
        readers: ["shelf-owner", coReaderId],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const eqUpdate = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUpdate }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser(coReaderId) },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...validPatchPayload,
            chosen_by: "shelf-owner",
            readers: ["shelf-owner", coReaderId],
          }),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validPatchPayload.title,
          author_id: validPatchPayload.author_id,
          readers: ["shelf-owner", coReaderId],
          status: "reading",
        }),
      );
      expect(eqUpdate).toHaveBeenCalledWith("id", "book-1");
    });

    it("permite PATCH quando o usuário é chosen_by ainda que não esteja em readers", async () => {
      const chooserId = "who-picked";
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "other-shelf",
        chosen_by: chooserId,
        readers: ["other-shelf"],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const eqUpdate = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUpdate }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser(chooserId) },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...validPatchPayload,
            chosen_by: chooserId,
            readers: ["other-shelf"],
          }),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalled();
    });
  });

  describe("contrato HTTP e validação de entrada", () => {
    it("retorna 400 quando o corpo não é JSON válido", async () => {
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: vi.fn(),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: "Invalid JSON" });
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 400 com error e details quando o payload falha no bookCreateSchema", async () => {
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: vi.fn(),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...validPatchPayload, title: "" }),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid payload");
      expect(body.details).toBeDefined();
      expect(Object.keys(body).sort()).toEqual(["details", "error"]);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe("domínio de transição de status (bookUpsert.validation)", () => {
    it("retorna 400 com mensagem de negócio ao pausar livro que não está em leitura", async () => {
      const currentBook = {
        id: "book-1",
        status: "not_started",
        start_date: null,
        end_date: null,
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const update = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...validPatchPayload, status: "paused" }),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error:
          "Status pausado e abandonado só podem ser aplicados a livros em andamento.",
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('retorna 400 com "Invalid transition" quando validateTransition lança valor que não é Error', async () => {
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const update = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClientAndValidationThrow(
        client,
        "not-an-error-instance",
      );
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid transition",
      });
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("carregamento e persistência em books", () => {
    it("retorna 404 quando single() indica livro inexistente ou sem dados", async () => {
      const readBuilder = buildBookSelectSingle(null, {
        message: "not found",
        code: "PGRST116",
      });
      const update = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Book not found" });
      expect(update).not.toHaveBeenCalled();
    });

    it("retorna 200 e corpo { ok: true } quando update conclui sem erro", async () => {
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const eqUpdate = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUpdate }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ ok: true });
      expect(Object.keys(body)).toEqual(["ok"]);
      expect(client.from).toHaveBeenCalledTimes(2);
      expect(client.from).toHaveBeenNthCalledWith(1, "books");
      expect(client.from).toHaveBeenNthCalledWith(2, "books");
      expect(readBuilder.select).toHaveBeenCalledWith(PATCH_BOOK_SELECT_COLUMNS);
      expect(update).toHaveBeenCalled();
      expect(eqUpdate).toHaveBeenCalledWith("id", "book-1");
    });

    it("retorna 500 apenas com error string quando PostgREST devolve erro no update", async () => {
      const currentBook = {
        id: "book-1",
        status: "reading",
        start_date: null,
        end_date: null,
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectSingle(currentBook);
      const eqUpdate = vi
        .fn()
        .mockResolvedValue({ error: { message: "constraint violation" } });
      const update = vi.fn(() => ({ eq: eqUpdate }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { update },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.PATCH(
        new Request("http://localhost/api/books/book-1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validPatchPayload),
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "constraint violation" });
      expect(Object.keys(body)).toEqual(["error"]);
    });
  });
});

describe("DELETE /api/books/[id]", () => {
  describe("RN20 / RN48 — sessão obrigatória em mutação", () => {
    it("retorna 401 e não consulta books quando não há usuário autenticado", async () => {
      const client: SupabaseByIdMock = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Unauthorized" });
      expect(Object.keys(body)).toEqual(["error"]);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe("RN42 / RN48 — participação antes de excluir", () => {
    it("retorna 403 e não chama delete quando o usuário não participa do livro", async () => {
      const row = {
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };

      const readBuilder = buildBookSelectMaybeSingle(row);
      const deleteFn = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("intruder-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
      expect(client.from).toHaveBeenCalledWith("books");
      expect(readBuilder.select).toHaveBeenCalledWith(DELETE_BOOK_SELECT_COLUMNS);
      expect(readBuilder.eq).toHaveBeenCalledWith("id", "book-1");
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it("permite DELETE quando o usuário participa apenas como co-leitor em readers", async () => {
      const coReaderId = "co-reader-user";
      const row = {
        user_id: "shelf-owner",
        chosen_by: "shelf-owner",
        readers: ["shelf-owner", coReaderId],
      };
      const readBuilder = buildBookSelectMaybeSingle(row);
      const eqDelete = vi.fn().mockResolvedValue({ error: null });
      const deleteFn = vi.fn(() => ({ eq: eqDelete }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser(coReaderId) },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ok: true });
      expect(deleteFn).toHaveBeenCalled();
      expect(eqDelete).toHaveBeenCalledWith("id", "book-1");
    });
  });

  describe("carregamento e exclusão em books", () => {
    it("retorna 500 apenas com error string quando maybeSingle() retorna erro", async () => {
      const readBuilder = buildBookSelectMaybeSingle(null, {
        message: "database down",
      });
      const deleteFn = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "database down" });
      expect(Object.keys(body)).toEqual(["error"]);
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it("retorna 404 quando não há linha (maybeSingle vazio sem erro)", async () => {
      const readBuilder = buildBookSelectMaybeSingle(null, null);
      const deleteFn = vi.fn();
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: "Book not found" });
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it("retorna 200 e { ok: true } quando delete conclui sem erro", async () => {
      const row = {
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectMaybeSingle(row);
      const eqDelete = vi.fn().mockResolvedValue({ error: null });
      const deleteFn = vi.fn(() => ({ eq: eqDelete }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ ok: true });
      expect(Object.keys(body)).toEqual(["ok"]);
      expect(client.from).toHaveBeenCalledTimes(2);
      expect(client.from).toHaveBeenNthCalledWith(1, "books");
      expect(client.from).toHaveBeenNthCalledWith(2, "books");
      expect(readBuilder.select).toHaveBeenCalledWith(DELETE_BOOK_SELECT_COLUMNS);
      expect(deleteFn).toHaveBeenCalled();
      expect(eqDelete).toHaveBeenCalledWith("id", "book-1");
    });

    it("retorna 500 apenas com error string quando delete falha", async () => {
      const row = {
        user_id: "owner-user",
        chosen_by: "owner-user",
        readers: ["owner-user"],
      };
      const readBuilder = buildBookSelectMaybeSingle(row);
      const eqDelete = vi
        .fn()
        .mockResolvedValue({ error: { message: "fk violation" } });
      const deleteFn = vi.fn(() => ({ eq: eqDelete }));
      const client: SupabaseByIdMock = {
        auth: { getUser: authedGetUser("owner-user") },
        from: buildTwoTableCalls(
          { select: readBuilder.select },
          { delete: deleteFn },
        ),
      };

      const route = await loadRouteWithClient(client);
      const response = await route.DELETE(
        new Request("http://localhost/api/books/book-1", {
          method: "DELETE",
        }),
        { params: Promise.resolve({ id: "book-1" }) },
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "fk violation" });
      expect(Object.keys(body)).toEqual(["error"]);
    });
  });
});
