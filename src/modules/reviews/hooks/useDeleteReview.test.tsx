import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_COPY } from "../constants";
import { reviewQueryKeys } from "../utils";
import { useDeleteReview } from "./useDeleteReview";

const { deleteReview, toastError } = vi.hoisted(() => ({
  deleteReview: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: { deleteReview: typeof deleteReview }) {
    this.deleteReview = deleteReview;
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useDeleteReview", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    deleteReview.mockReset();
    toastError.mockReset();
    deleteReview.mockResolvedValue({ ok: true });
  });

  it("invalida o feed só depois que a resenha sai", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteReview(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("review-1");
    });

    expect(deleteReview).toHaveBeenCalledWith("review-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: reviewQueryKeys.all });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("avisa a falha e mantém o cache", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    deleteReview.mockRejectedValue(new Error("delete down"));
    const { result } = renderHook(() => useDeleteReview(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("review-1").catch(() => undefined);
    });

    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.deleteError, {
      className: "toast-error",
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
