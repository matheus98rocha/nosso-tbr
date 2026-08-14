import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAvatarSelection } from "./useAvatarSelection";
import { useUserStore } from "@/stores/userStore";

const { mockGetUserById, mockUpdateAvatarSeed, mockToast } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(),
  mockUpdateAvatarSeed: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

vi.mock("sonner", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: class {
    getUserById = mockGetUserById;
    updateAvatarSeed = mockUpdateAvatarSeed;
  },
}));

type UserStoreState = {
  user: { id: string; email: string } | null;
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useAvatarSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockResolvedValue({
      id: "user-1",
      displayName: "Leitor",
      email: "leitor@tbr.com",
      joinedAt: null,
      avatarSeed: "StephenKing",
    });
    mockUpdateAvatarSeed.mockResolvedValue(undefined);

    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: UserStoreState) => unknown) =>
        selector({
          user: { id: "user-1", email: "leitor@tbr.com" },
        }),
    );
  });

  it("monta 20 opções de avatar e inicializa a seleção salva", async () => {
    const { result } = renderHook(() => useAvatarSelection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.avatarOptions).toHaveLength(24);
    expect(result.current.selectedSeed).toBe("StephenKing");
    expect(result.current.savedSeed).toBe("StephenKing");
    expect(result.current.isDirty).toBe(false);
  });

  it("marca estado sujo ao trocar seleção e salva avatar", async () => {
    const { result } = renderHook(() => useAvatarSelection(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.selectedSeed).toBe("StephenKing");
    });

    act(() => {
      result.current.onSelectAvatar("Capitu");
    });

    expect(result.current.selectedSeed).toBe("Capitu");
    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      result.current.onSaveAvatar();
    });

    await waitFor(() => {
      expect(mockUpdateAvatarSeed).toHaveBeenCalledWith("Capitu");
    });

    expect(mockToast).toHaveBeenCalledWith("Avatar atualizado com sucesso!");
  });
});
