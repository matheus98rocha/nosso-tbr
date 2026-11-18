import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import type { ReviewMine } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewComposerForm } from "./useReviewComposerForm";

const { getMineByBookId, upsert } = vi.hoisted(() => ({
  getMineByBookId: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    getMineByBookId = getMineByBookId;
    upsert = upsert;
  },
}));

const alice = { id: "alice" } as User;
const bob = { id: "bob" } as User;

const aliceReview: ReviewMine = {
  id: "review-alice",
  stars: 5,
  content: "Texto privado da Alice",
  readingStatus: "finished",
};

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 120_000, refetchOnMount: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(reviewQueryKeys.mineByBook(alice.id, "book-1"), {
    review: aliceReview,
    ratingStars: 5,
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => useReviewComposerForm(), { wrapper });
}

describe("useReviewComposerForm", () => {
  beforeEach(() => {
    resetReviewComposerStore();
    getMineByBookId.mockReset();
    upsert.mockReset();
    upsert.mockResolvedValue({ published: false, reviewId: null, stars: 4 });
    useUserStore.setState({ user: alice });
    useReviewComposerStore.setState({
      open: true,
      mode: "finish",
      book: {
        id: "book-1",
        title: "O Hobbit",
        author: null,
        imageUrl: null,
        status: "finished",
        isSolo: true,
      },
    });
  });

  it("preenche a resenha salva do leitor atual", async () => {
    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });
    expect(result.current.stars).toBe(5);
  });

  it("não publica o texto do leitor anterior quando a conta muda", async () => {
    let resolveBob: (value: { review: null; ratingStars: null }) => void = () => {};
    getMineByBookId.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBob = resolve;
        }),
    );

    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      useUserStore.setState({ user: bob });
    });

    await waitFor(() => {
      expect(result.current.content).toBe("");
    });
    expect(result.current.stars).toBeNull();

    act(() => {
      result.current.setStars(4);
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith({
        bookId: "book-1",
        stars: 4,
        content: "",
      });
    });

    resolveBob({ review: null, ratingStars: null });
  });
});
