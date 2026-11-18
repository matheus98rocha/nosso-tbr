import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/clientJsonFetch";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import type { ReviewComposerBook, ReviewMine } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewComposerForm } from "./useReviewComposerForm";

const { getMineByBookId, upsert, deleteReview } = vi.hoisted(() => ({
  getMineByBookId: vi.fn(),
  upsert: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    getMineByBookId = getMineByBookId;
    upsert = upsert;
    deleteReview = deleteReview;
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
    deleteReview.mockReset();
    upsert.mockResolvedValue({ published: false, reviewId: null, stars: 4 });
    deleteReview.mockResolvedValue({ ok: true });
    getMineByBookId.mockResolvedValue({
      review: aliceReview,
      ratingStars: 5,
    });
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
    expect(deleteReview).not.toHaveBeenCalled();

    resolveBob({ review: null, ratingStars: null });
  });

  it("retira a resenha publicada quando a finalização fica só com a avaliação", async () => {
    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      result.current.setStars(4);
      result.current.setContent("   ");
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
    expect(deleteReview).toHaveBeenCalledWith("review-alice");
    expect(deleteReview.mock.invocationCallOrder[0]).toBeLessThan(
      upsert.mock.invocationCallOrder[0],
    );
  });

  it("mantém a resenha quando o texto continua na finalização", async () => {
    upsert.mockResolvedValue({ published: true, reviewId: "review-alice", stars: 4 });
    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

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
        content: "Texto privado da Alice",
      });
    });
    expect(deleteReview).not.toHaveBeenCalled();
  });

  it("salva a avaliação quando a resenha já não existe", async () => {
    deleteReview.mockRejectedValue(new ApiError("Resenha não encontrada", 404));
    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      result.current.setStars(3);
      result.current.setContent("");
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith({
        bookId: "book-1",
        stars: 3,
        content: "",
      });
    });
    expect(deleteReview).toHaveBeenCalledWith("review-alice");
  });

  it("não exclui de novo se a avaliação falha depois da retirada", async () => {
    upsert.mockRejectedValueOnce(new Error("falhou"));
    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      result.current.setStars(3);
      result.current.setContent("");
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledTimes(1);
    });

    upsert.mockResolvedValue({ published: false, reviewId: null, stars: 3 });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledTimes(2);
    });
    expect(deleteReview).toHaveBeenCalledTimes(1);
  });

  it("descarta o rascunho quando a finalização troca o livro do compositor", async () => {
    const otherReview: ReviewMine = {
      id: "review-2",
      stars: 2,
      content: "Do outro",
      readingStatus: "finished",
    };
    const otherBook: ReviewComposerBook = {
      id: "book-2",
      title: "Outro",
      author: null,
      imageUrl: null,
      status: "finished",
      isSolo: false,
    };
    getMineByBookId.mockImplementation(async (id: string) => {
      if (id === otherBook.id) {
        return { review: otherReview, ratingStars: 2 };
      }
      return { review: aliceReview, ratingStars: 5 };
    });

    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      result.current.setStars(4);
      result.current.setContent("Sobre o Hobbit");
    });

    act(() => {
      useReviewComposerStore.getState().openAfterFinish(otherBook, null);
    });

    expect(result.current.book?.id).toBe(otherBook.id);
    expect(result.current.content).toBe("");
    expect(result.current.stars).toBeNull();

    act(() => {
      result.current.submit();
    });
    expect(upsert).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.content).toBe("Do outro");
    });
    expect(result.current.stars).toBe(2);

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith({
        bookId: "book-2",
        stars: 2,
        content: "Do outro",
      });
    });
  });

  it("não exclui a resenha de outro livro quando a finalização troca o livro após limpar o texto", async () => {
    const otherReview: ReviewMine = {
      id: "review-2",
      stars: 2,
      content: "Do outro",
      readingStatus: "finished",
    };
    const otherBook: ReviewComposerBook = {
      id: "book-2",
      title: "Outro",
      author: null,
      imageUrl: null,
      status: "finished",
      isSolo: false,
    };
    getMineByBookId.mockImplementation(async (id: string) => {
      if (id === otherBook.id) {
        return { review: otherReview, ratingStars: 2 };
      }
      return { review: aliceReview, ratingStars: 5 };
    });

    const { result } = renderForm();

    await waitFor(() => {
      expect(result.current.content).toBe("Texto privado da Alice");
    });

    act(() => {
      result.current.setStars(4);
      result.current.setContent("");
    });
    act(() => {
      useReviewComposerStore.getState().openAfterFinish(otherBook, null);
    });

    expect(result.current.book?.id).toBe(otherBook.id);
    expect(result.current.content).toBe("");
    expect(result.current.stars).toBeNull();
    expect(deleteReview).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.content).toBe("Do outro");
    });
    expect(result.current.stars).toBe(2);

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(upsert).toHaveBeenCalledWith({
        bookId: "book-2",
        stars: 2,
        content: "Do outro",
      });
    });
    expect(deleteReview).not.toHaveBeenCalled();
  });
});
