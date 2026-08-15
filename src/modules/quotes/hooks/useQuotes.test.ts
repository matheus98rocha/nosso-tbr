import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { useMutation, useQuery } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
  })),
}));

vi.mock("../services/quotes.service", () => ({
  QuotesService: vi.fn(),
}));

import { useQuotes } from "./useQuotes";

describe("useQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "quote-1", content: "Test", page: 1 }],
      isLoading: false,
      isError: false,
    });

    (useMutation as Mock).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("exposes isError from quotes query", () => {
    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const { result } = renderHook(() =>
      useQuotes({ id: "book-1", title: "Livro" }),
    );

    expect(result.current.isError).toBe(true);
    expect(result.current.hasQuotes).toBe(false);
  });

  it("computes hasQuotes only when query succeeds with data", () => {
    const { result, rerender } = renderHook(() =>
      useQuotes({ id: "book-1", title: "Livro" }),
    );

    expect(result.current.hasQuotes).toBe(true);

    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    rerender();

    expect(result.current.hasQuotes).toBe(false);
  });
});
