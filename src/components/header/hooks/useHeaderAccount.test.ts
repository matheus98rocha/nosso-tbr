import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

const { mockGetUserById } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock() {
    return {
      getUserById: mockGetUserById,
    };
  }),
}));

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(() => true),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: unknown) => unknown) =>
    selector({
      user: {
        id: "user-1",
        email: "matheus.silva@example.com",
      },
      loading: false,
      logout: vi.fn(),
    }),
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import { useHeaderAccount } from "./useHeaderAccount";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });

  return {
    client,
    Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    },
  };
}

describe("useHeaderAccount", () => {
  beforeEach(() => {
    mockGetUserById.mockReset();
    mockGetUserById.mockResolvedValue({
      id: "user-1",
      displayName: "Matheus Silva",
      email: "matheus.silva@example.com",
      joinedAt: null,
      avatarSeed: "StephenKing",
    });
  });

  it("uses social display name and initials when available", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHeaderAccount(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.account?.displayName).toBe("Matheus Silva");
    });

    expect(result.current.account?.avatarInitials).toBe("MS");
    expect(result.current.account?.avatarSeed).toBe("StephenKing");
    expect(result.current.account?.email).toBe("matheus.silva@example.com");
  });

  it("falls back to email local part when social profile has no display name", async () => {
    mockGetUserById.mockResolvedValue({
      id: "user-1",
      displayName: "",
      email: "matheus.silva@example.com",
      joinedAt: null,
      avatarSeed: null,
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useHeaderAccount(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.account?.displayName).toBe("matheus.silva");
    });

    expect(result.current.account?.avatarInitials).toBe("MS");
  });
});
