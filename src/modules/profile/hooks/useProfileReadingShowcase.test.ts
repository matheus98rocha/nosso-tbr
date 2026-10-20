import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProfileReadingShowcase } from "./useProfileReadingShowcase";

const { getReadingShowcase } = vi.hoisted(() => ({
  getReadingShowcase: vi.fn(),
}));

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("@/modules/profile/services", () => ({
  ProfileReadingService: vi.fn(function (this: Record<string, unknown>) {
    this.getReadingShowcase = getReadingShowcase;
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useProfileReadingShowcase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReadingShowcase.mockResolvedValue({
      readerId: "u1",
      registeredCount: 2,
      finishedCount: 1,
      currentlyReadingTitle: null,
      mostReadGender: null,
      mostRegisteredGender: null,
      mostReadGenderLabel: null,
      mostRegisteredGenderLabel: null,
    });
  });

  it("busca showcase pelo readerId", async () => {
    const { result } = renderHook(() => useProfileReadingShowcase("u1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getReadingShowcase).toHaveBeenCalledWith("u1");
    expect(result.current.data?.registeredCount).toBe(2);
  });
});
