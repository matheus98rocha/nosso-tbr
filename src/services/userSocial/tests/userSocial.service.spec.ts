import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserSocialService } from "../userSocial.service";

const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

describe("UserSocialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserById retorna null quando não existe", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const svc = new UserSocialService();
    await expect(
      svc.getUserById("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeNull();
  });

  it("getUserById mapeia linha para DirectoryUser", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        display_name: "Ana",
        email: "ana@mail.com",
      },
      error: null,
    });
    const svc = new UserSocialService();
    const out = await svc.getUserById("11111111-1111-4111-8111-111111111111");
    expect(out).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      displayName: "Ana",
      email: "ana@mail.com",
      joinedAt: null,
    });
  });
});
