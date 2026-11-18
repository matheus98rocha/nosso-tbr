import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_COPY } from "../constants";
import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import type { ReviewComposerBook, ReviewMine } from "../types";
import { useReviewComposerForm } from "./useReviewComposerForm";

const { getMineByBookId, upsert, toastMessage, toastError } = vi.hoisted(() => ({
  getMineByBookId: vi.fn(),
  upsert: vi.fn(),
  toastMessage: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: {
    getMineByBookId: typeof getMineByBookId;
    upsert: typeof upsert;
  }) {
    this.getMineByBookId = getMineByBookId;
    this.upsert = upsert;
  }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(toastMessage, { error: toastError }),
}));

type Mine = { review: ReviewMine | null; ratingStars: number | null };

const emptyMine: Mine = { review: null, ratingStars: null };

const readingBook: ReviewComposerBook = {
  id: "book-1",
  title: "O Hobbit",
  author: "Tolkien",
  imageUrl: null,
  status: "reading",
  isSolo: false,
};

const finishedBook: ReviewComposerBook = {
  ...readingBook,
  status: "finished",
  isSolo: true,
};

const savedReview: ReviewMine = {
  id: "review-1",
  stars: 4,
  content: "Salva",
  readingStatus: "reading",
};

let queryClient: QueryClient;
let resolveMine: (value: Mine) => void = () => undefined;
let resolveUpsert: (value: unknown) => void = () => undefined;
let rejectUpsert: (error: Error) => void = () => undefined;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function openComposer(book: ReviewComposerBook, mode: "compose" | "finish") {
  useReviewComposerStore.setState({ open: true, mode, book });
}

async function renderComposer(book: ReviewComposerBook, mode: "compose" | "finish") {
  const callsBefore = getMineByBookId.mock.calls.length;
  openComposer(book, mode);
  const hook = renderHook(() => useReviewComposerForm(), { wrapper });
  await waitFor(() =>
    expect(getMineByBookId.mock.calls.length).toBeGreaterThan(callsBefore),
  );
  return hook;
}

async function settleMine(value: Mine) {
  await act(async () => {
    resolveMine(value);
  });
}

describe("useReviewComposerForm", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    getMineByBookId.mockReset();
    upsert.mockReset();
    toastMessage.mockReset();
    toastError.mockReset();
    getMineByBookId.mockImplementation(
      () =>
        new Promise<Mine>((resolve) => {
          resolveMine = resolve;
        }),
    );
    upsert.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveUpsert = resolve;
          rejectUpsert = reject;
        }),
    );
    resetReviewComposerStore();
  });

  it("carrega a resenha salva em vez da avaliação", async () => {
    const { result } = await renderComposer(readingBook, "compose");
    await settleMine({ review: savedReview, ratingStars: 2 });

    await waitFor(() => expect(result.current.content).toBe("Salva"));
    expect(result.current.stars).toBe(4);
    expect(result.current.hasExistingReview).toBe(true);
  });

  it("carrega só as estrelas quando ainda não há resenha", async () => {
    const { result } = await renderComposer(readingBook, "compose");
    await settleMine({ review: null, ratingStars: 3 });

    await waitFor(() => expect(result.current.stars).toBe(3));
    expect(result.current.content).toBe("");
    expect(result.current.hasExistingReview).toBe(false);
  });

  it("não substitui o texto digitado quando a resenha salva chega depois", async () => {
    const { result } = await renderComposer(readingBook, "compose");

    act(() => {
      result.current.setContent("texto digitado");
      result.current.setStars(5);
    });
    await settleMine({
      review: { ...savedReview, content: "Do servidor", stars: 1 },
      ratingStars: 1,
    });

    await waitFor(() => expect(result.current.hasExistingReview).toBe(true));
    expect(result.current.content).toBe("texto digitado");
    expect(result.current.stars).toBe(5);
  });

  it("pede confirmação para descartar texto e fecha direto quando só as estrelas mudaram", async () => {
    const draft = await renderComposer(readingBook, "compose");
    await settleMine(emptyMine);
    await waitFor(() => expect(draft.result.current.isLoadingExisting).toBe(false));

    act(() => {
      draft.result.current.setStars(4);
      draft.result.current.setContent("rascunho");
    });
    act(() => {
      draft.result.current.requestClose();
    });

    expect(draft.result.current.confirmDiscard).toBe(true);
    expect(useReviewComposerStore.getState().open).toBe(true);

    draft.unmount();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    resetReviewComposerStore();
    const starsOnly = await renderComposer(finishedBook, "finish");
    await settleMine(emptyMine);
    await waitFor(() => expect(starsOnly.result.current.isLoadingExisting).toBe(false));

    act(() => {
      starsOnly.result.current.setStars(5);
    });
    act(() => {
      starsOnly.result.current.requestClose();
    });

    expect(starsOnly.result.current.confirmDiscard).toBe(false);
    expect(useReviewComposerStore.getState().open).toBe(false);
  });

  it("avisa a falha de publicar e mantém o compositor aberto", async () => {
    const { result } = await renderComposer(readingBook, "compose");
    await settleMine(emptyMine);
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));

    act(() => {
      result.current.setStars(4);
      result.current.setContent("Oi");
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    await act(async () => {
      rejectUpsert(new Error("down"));
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.publishError, {
        className: "toast-error",
      });
    });
    expect(useReviewComposerStore.getState().open).toBe(true);
    expect(upsert).toHaveBeenCalledWith({ bookId: "book-1", stars: 4, content: "Oi" });
  });

  it("avisa a falha da avaliação e mantém o compositor aberto", async () => {
    const { result } = await renderComposer(finishedBook, "finish");
    await settleMine(emptyMine);
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));

    act(() => {
      result.current.setStars(5);
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    await act(async () => {
      rejectUpsert(new Error("down"));
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.ratingError, {
        className: "toast-error",
      });
    });
    expect(useReviewComposerStore.getState().open).toBe(true);
    expect(upsert).toHaveBeenCalledWith({ bookId: "book-1", stars: 5, content: "" });
  });

  it("fecha depois de publicar e avisa quando só a avaliação foi salva", async () => {
    const published = await renderComposer(readingBook, "compose");
    await settleMine(emptyMine);
    await waitFor(() => expect(published.result.current.isLoadingExisting).toBe(false));

    act(() => {
      published.result.current.setStars(4);
      published.result.current.setContent("Oi");
    });
    await act(async () => {
      published.result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolveUpsert({ published: true, reviewId: "review-1", stars: 4 });
    });

    await waitFor(() => expect(useReviewComposerStore.getState().open).toBe(false));
    expect(toastMessage).not.toHaveBeenCalled();

    published.unmount();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    const rating = await renderComposer(finishedBook, "finish");
    await settleMine(emptyMine);
    await waitFor(() => expect(rating.result.current.isLoadingExisting).toBe(false));

    act(() => {
      rating.result.current.setStars(5);
    });
    await act(async () => {
      rating.result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(2));
    await act(async () => {
      resolveUpsert({ published: false, reviewId: null, stars: 5 });
    });

    await waitFor(() => expect(toastMessage).toHaveBeenCalledWith(REVIEWS_COPY.saveRating));
    expect(useReviewComposerStore.getState().open).toBe(false);
  });

  it("descarta o rascunho quando a finalização troca o livro do compositor", async () => {
    const otherBook: ReviewComposerBook = {
      ...readingBook,
      id: "book-2",
      title: "Outro",
      status: "finished",
    };
    const { result } = await renderComposer(readingBook, "compose");
    await settleMine(emptyMine);
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));

    act(() => {
      result.current.setStars(5);
      result.current.setContent("Sobre o Hobbit");
    });

    const callsBeforeSwitch = getMineByBookId.mock.calls.length;
    await act(async () => {
      useReviewComposerStore.getState().openAfterFinish(otherBook, null);
    });

    expect(result.current.book?.id).toBe("book-2");
    expect(result.current.content).toBe("");
    expect(result.current.stars).toBeNull();

    await act(async () => {
      result.current.submit();
    });
    expect(upsert).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(getMineByBookId.mock.calls.length).toBeGreaterThan(callsBeforeSwitch),
    );
    await settleMine({
      review: {
        id: "review-2",
        stars: 2,
        content: "Do outro",
        readingStatus: "finished",
      },
      ratingStars: 2,
    });

    await waitFor(() => expect(result.current.content).toBe("Do outro"));
    expect(result.current.stars).toBe(2);

    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    expect(upsert).toHaveBeenCalledWith({
      bookId: "book-2",
      stars: 2,
      content: "Do outro",
    });
  });
});
