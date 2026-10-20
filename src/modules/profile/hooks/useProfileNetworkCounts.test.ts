import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProfileNetworkCounts } from "./useProfileNetworkCounts";

const { getNetworkCounts } = vi.hoisted(() => ({
  getNetworkCounts: vi.fn(),
}));

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function (this: Record<string, unknown>) {
    this.getNetworkCounts = getNetworkCounts;
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useProfileNetworkCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNetworkCounts.mockResolvedValue({
      followingCount: 2,
      followerCount: 5,
    });
  });

  it("busca totais de rede pelo userId", async () => {
    const { result } = renderHook(() => useProfileNetworkCounts("peer"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getNetworkCounts).toHaveBeenCalledWith("peer");
    expect(result.current.data).toEqual({
      followingCount: 2,
      followerCount: 5,
    });
  });
});
