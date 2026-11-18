import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REVIEWS_COPY } from "../constants";
import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import type { ReviewComposerBook } from "../types";
import { useReviewComposerForm } from "./useReviewComposerForm";

const { getMineByBookId, upsert, toastError, toastMessage } = vi.hoisted(() => ({
  getMineByBookId: vi.fn(),
  upsert: vi.fn(),
  toastError: vi.fn(),
  toastMessage: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(toastMessage, { error: toastError }),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    getMineByBookId = getMineByBookId;
    upsert = upsert;
  },
}));

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
};

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useReviewComposerForm(), { wrapper });
}

describe("useReviewComposerForm", () => {
  beforeEach(() => {
    getMineByBookId.mockReset();
    upsert.mockReset();
    toastError.mockReset();
    toastMessage.mockReset();
    getMineByBookId.mockResolvedValue({ review: null, ratingStars: null });
    resetReviewComposerStore();
  });

  it("pede confirmação só quando há texto que ainda não foi publicado", async () => {
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: readingBook,
    });
    const { result } = renderForm();
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));

    act(() => {
      result.current.setContent("  um rascunho  ");
    });
    act(() => {
      result.current.requestClose();
    });

    expect(result.current.confirmDiscard).toBe(true);
    expect(useReviewComposerStore.getState().open).toBe(true);

    act(() => {
      result.current.setContent("   ");
      result.current.setStars(5);
    });
    act(() => {
      result.current.requestClose();
    });

    expect(useReviewComposerStore.getState().open).toBe(false);
  });

  it("não substitui o texto já digitado pela resenha salva", async () => {
    let resolveMine: (value: {
      review: { id: string; stars: number; content: string; readingStatus: "reading" };
      ratingStars: number | null;
    }) => void = () => undefined;
    getMineByBookId.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMine = resolve;
        }),
    );
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: readingBook,
    });
    const { result } = renderForm();

    act(() => {
      result.current.setStars(5);
      result.current.setContent("rascunho");
    });
    await act(async () => {
      resolveMine({
        review: {
          id: "review-1",
          stars: 2,
          content: "gravada",
          readingStatus: "reading",
        },
        ratingStars: 1,
      });
    });

    expect(result.current.content).toBe("rascunho");
    expect(result.current.stars).toBe(5);
  });

  it("carrega a resenha salva quando o campo ainda não foi editado", async () => {
    getMineByBookId.mockResolvedValue({
      review: {
        id: "review-1",
        stars: 4,
        content: "gravada",
        readingStatus: "paused",
      },
      ratingStars: null,
    });
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: readingBook,
    });
    const { result } = renderForm();

    await waitFor(() => expect(result.current.content).toBe("gravada"));
    expect(result.current.stars).toBe(4);
    expect(result.current.hasExistingReview).toBe(true);
  });

  it("mantém o compositor aberto quando a resenha não publica", async () => {
    let rejectUpsert: (error: Error) => void = () => undefined;
    upsert.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectUpsert = reject;
        }),
    );
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: readingBook,
    });
    const { result } = renderForm();
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));
    act(() => {
      result.current.setStars(5);
      result.current.setContent("Oi");
    });
    act(() => {
      result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    await act(async () => {
      rejectUpsert(new Error("fail"));
    });

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.publishError, {
        className: "toast-error",
      }),
    );
    expect(upsert).toHaveBeenCalledWith({
      bookId: "book-1",
      stars: 5,
      content: "Oi",
    });
    expect(useReviewComposerStore.getState().open).toBe(true);
  });

  it("mantém o compositor aberto quando a avaliação não salva", async () => {
    let rejectUpsert: (error: Error) => void = () => undefined;
    upsert.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectUpsert = reject;
        }),
    );
    useReviewComposerStore.setState({
      open: true,
      mode: "finish",
      book: finishedBook,
    });
    const { result } = renderForm();
    await waitFor(() => expect(result.current.isLoadingExisting).toBe(false));
    act(() => {
      result.current.setStars(4);
    });
    act(() => {
      result.current.submit();
    });
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    await act(async () => {
      rejectUpsert(new Error("fail"));
    });

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.ratingError, {
        className: "toast-error",
      }),
    );
    expect(upsert).toHaveBeenCalledWith({
      bookId: "book-1",
      stars: 4,
      content: "",
    });
    expect(useReviewComposerStore.getState().open).toBe(true);
  });
});
