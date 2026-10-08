import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCommunityReaderSuggestions } from "./useCommunityReaderSuggestions";

const { searchSuggestions } = vi.hoisted(() => ({
  searchSuggestions: vi.fn(),
}));

vi.mock("../services/community.service", () => ({
  CommunityService: vi.fn(function CommunityServiceMock(this: {
    searchSuggestions: typeof searchSuggestions;
  }) {
    this.searchSuggestions = searchSuggestions;
  }),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useCommunityReaderSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchSuggestions.mockResolvedValue([
      { id: "ana", displayName: "Ana" },
    ]);
  });

  it("não consulta o banco com menos de dois caracteres", async () => {
    renderHook(() => useCommunityReaderSuggestions("self-1", "a"), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 350);
    });

    expect(searchSuggestions).not.toHaveBeenCalled();
  });

  it("busca sugestões no banco depois do debounce", async () => {
    const { result } = renderHook(
      () => useCommunityReaderSuggestions("self-1", "an"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(searchSuggestions).toHaveBeenCalledWith("self-1", "an");
    });

    await waitFor(() => {
      expect(result.current.suggestions).toEqual([
        { id: "ana", displayName: "Ana" },
      ]);
    });
  });
});
