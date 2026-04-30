import { describe, expect, it, vi } from "vitest";

import { requireUser } from "./requireUser";

describe("requireUser", () => {
  it("returns 401 when session error is returned", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
          error: new Error("auth failed"),
        }),
      },
    };

    const out = await requireUser(supabase);

    expect(out.user).toBeNull();
    expect(out.errorResponse).not.toBeNull();
    expect(out.errorResponse?.status).toBe(401);
    await expect(out.errorResponse?.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("returns 401 when user is missing", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    const out = await requireUser(supabase);

    expect(out.user).toBeNull();
    expect(out.errorResponse?.status).toBe(401);
    await expect(out.errorResponse?.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("returns user when session is valid", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "abc" } },
          error: null,
        }),
      },
    };

    const out = await requireUser(supabase);

    expect(out.user).toEqual({ id: "abc" });
    expect(out.errorResponse).toBeNull();
  });
});
