import { describe, expect, it, vi } from "vitest";

import { requireAdmin } from "./requireAdmin";

function usersChain(tier: string | null, error: Error | null = null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: tier ? { tier } : null,
          error,
        }),
      })),
    })),
  };
}

describe("requireAdmin", () => {
  it("returns 401 when session is missing", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    };

    const out = await requireAdmin(supabase);

    expect(out.user).toBeNull();
    expect(out.errorResponse?.status).toBe(401);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns 403 when tier is common_user", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u-common" } },
          error: null,
        }),
      },
      from: vi.fn(() => usersChain("common_user")),
    };

    const out = await requireAdmin(supabase);

    expect(out.user).toBeNull();
    expect(out.errorResponse?.status).toBe(403);
    await expect(out.errorResponse?.json()).resolves.toEqual({
      error: "Forbidden",
    });
  });

  it("returns 403 when profile tier is missing", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u-missing" } },
          error: null,
        }),
      },
      from: vi.fn(() => usersChain(null)),
    };

    const out = await requireAdmin(supabase);

    expect(out.user).toBeNull();
    expect(out.errorResponse?.status).toBe(403);
  });

  it("returns user when tier is admin", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u-admin" } },
          error: null,
        }),
      },
      from: vi.fn(() => usersChain("admin")),
    };

    const out = await requireAdmin(supabase);

    expect(out.user).toEqual({ id: "u-admin" });
    expect(out.errorResponse).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("users");
  });
});
