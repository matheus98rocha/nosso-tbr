import { afterEach, describe, expect, it, vi } from "vitest";

type Client = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    admin?: { deleteUser: ReturnType<typeof vi.fn> };
  };
  from: ReturnType<typeof vi.fn>;
};

function authLogged(userId: string): Client["auth"] {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    }),
  };
}

function usersTier(tier: "admin" | "common_user") {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tier },
          error: null,
        }),
      })),
    })),
  };
}

const { createServiceRoleClientMock } = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
}));

async function loadRoute(sessionClient: Client, serviceClient?: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(sessionClient),
  }));
  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));
  if (serviceClient) {
    createServiceRoleClientMock.mockReturnValue(serviceClient);
  } else {
    createServiceRoleClientMock.mockImplementation(() => {
      throw new Error("missing key");
    });
  }
  return import("./route");
}

describe("/api/admin/users/[id]", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  describe("PATCH — promover a admin", () => {
    it("retorna 401 sem sessão", async () => {
      const session: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };
      const route = await loadRoute(session);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(401);
    });

    it("retorna 403 para common_user", async () => {
      const session: Client = {
        auth: authLogged("u-common"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("common_user");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(403);
    });

    it("retorna 400 com body inválido", async () => {
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, {
        auth: authLogged("service"),
        from: vi.fn(),
      });
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "common_user" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(400);
    });

    it("retorna 503 sem service role", async () => {
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(503);
    });

    it("retorna 404 quando usuário alvo não existe", async () => {
      const service: Client = {
        auth: authLogged("service"),
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          };
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "missing" }) },
      );
      expect(res.status).toBe(404);
    });

    it("retorna 200 sem update se alvo já é admin", async () => {
      const update = vi.fn();
      const service: Client = {
        auth: authLogged("service"),
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "target", tier: "admin" },
                  error: null,
                }),
              })),
            })),
            update,
          };
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true, tier: "admin" });
      expect(update).not.toHaveBeenCalled();
    });

    it("promove common_user a admin", async () => {
      const updateEq = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: updateEq }));
      let usersCalls = 0;
      const service: Client = {
        auth: authLogged("service"),
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          usersCalls += 1;
          if (usersCalls === 1) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "target", tier: "common_user" },
                    error: null,
                  }),
                })),
              })),
            };
          }
          return { update };
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ tier: "admin" }),
        }),
        { params: Promise.resolve({ id: "target" }) },
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true, tier: "admin" });
      expect(update).toHaveBeenCalledWith({ tier: "admin" });
      expect(updateEq).toHaveBeenCalledWith("id", "target");
    });
  });

  describe("DELETE — excluir usuário", () => {
    it("retorna 401 sem sessão", async () => {
      const session: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };
      const route = await loadRoute(session);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "target" }),
      });
      expect(res.status).toBe(401);
    });

    it("retorna 403 para common_user", async () => {
      const session: Client = {
        auth: authLogged("u-common"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("common_user");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "target" }),
      });
      expect(res.status).toBe(403);
    });

    it("retorna 400 ao tentar excluir a si mesmo", async () => {
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser: vi.fn() } },
        from: vi.fn(),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "u-admin" }),
      });
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining("si mesmo"),
      });
    });

    it("retorna 503 sem service role", async () => {
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "target" }),
      });
      expect(res.status).toBe(503);
    });

    it("retorna 404 quando usuário alvo não existe", async () => {
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser: vi.fn() } },
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          };
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
    });

    it("retorna 409 ao excluir o último admin", async () => {
      const deleteUser = vi.fn();
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser } },
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          return {
            select: vi.fn((cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.head) {
                return {
                  eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
                };
              }
              return {
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "other-admin", tier: "admin" },
                    error: null,
                  }),
                })),
              };
            }),
          };
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "other-admin" }),
      });
      expect(res.status).toBe(409);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining("último admin"),
      });
      expect(deleteUser).not.toHaveBeenCalled();
    });

    it("retorna 409 quando usuário é chosen_by de livro", async () => {
      const deleteUser = vi.fn();
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser } },
        from: vi.fn((table: string) => {
          if (table === "users") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "target", tier: "common_user" },
                    error: null,
                  }),
                })),
              })),
              delete: vi.fn(),
            };
          }
          if (table === "books") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "book-1" },
                      error: null,
                    }),
                  })),
                })),
              })),
            };
          }
          throw new Error(table);
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "target" }),
      });
      expect(res.status).toBe(409);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining("chosen_by"),
      });
      expect(deleteUser).not.toHaveBeenCalled();
    });

    it("exclui admin quando há mais de um admin", async () => {
      const deleteUser = vi.fn().mockResolvedValue({ error: null });
      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser } },
        from: vi.fn((table: string) => {
          if (table === "users") {
            return {
              select: vi.fn((cols: string, opts?: { count?: string; head?: boolean }) => {
                if (opts?.head) {
                  return {
                    eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
                  };
                }
                return {
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "other-admin", tier: "admin" },
                      error: null,
                    }),
                  })),
                };
              }),
              delete: vi.fn(() => ({ eq: deleteEq })),
            };
          }
          if (table === "books") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              })),
            };
          }
          throw new Error(table);
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "other-admin" }),
      });
      expect(res.status).toBe(200);
      expect(deleteEq).toHaveBeenCalledWith("id", "other-admin");
      expect(deleteUser).toHaveBeenCalledWith("other-admin");
    });

    it("exclui perfil e auth user", async () => {
      const deleteUser = vi.fn().mockResolvedValue({ error: null });
      const deleteEq = vi.fn().mockResolvedValue({ error: null });
      const service: Client = {
        auth: { getUser: vi.fn(), admin: { deleteUser } },
        from: vi.fn((table: string) => {
          if (table === "users") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "target", tier: "common_user" },
                    error: null,
                  }),
                })),
              })),
              delete: vi.fn(() => ({ eq: deleteEq })),
            };
          }
          if (table === "books") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              })),
            };
          }
          throw new Error(table);
        }),
      };
      const session: Client = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("admin");
          throw new Error(table);
        }),
      };
      const route = await loadRoute(session, service);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "target" }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(deleteEq).toHaveBeenCalledWith("id", "target");
      expect(deleteUser).toHaveBeenCalledWith("target");
    });
  });
});
