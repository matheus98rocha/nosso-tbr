import { beforeEach, describe, expect, it } from "vitest";

import { useFinishedBookShareStore } from "@/modules/finishedBookShare/stores";

import type { ReviewComposerBook } from "../types";
import {
  closeReviewComposer,
  openReviewAfterFinish,
  openReviewBlank,
  openReviewForBook,
  resetReviewComposerStore,
  useReviewComposerStore,
} from "./reviewComposerStore";

function book(id: string): ReviewComposerBook {
  return {
    id,
    title: `Livro ${id}`,
    author: "Autora",
    imageUrl: null,
    status: "finished",
    isSolo: false,
  };
}

function subject(bookId: string) {
  return {
    bookId,
    title: `Livro ${bookId}`,
    author: "Autora",
    imageUrl: null,
  };
}

describe("reviewComposerStore", () => {
  beforeEach(() => {
    resetReviewComposerStore();
    useFinishedBookShareStore.setState({
      armedBookId: null,
      armedSubject: null,
      activeSubject: null,
    });
  });

  it("ao fechar a finalização, revela o cartão do X armado", () => {
    const share = subject("book-a");
    openReviewAfterFinish(book("book-a"), share);

    expect(useFinishedBookShareStore.getState().armedSubject).toEqual(share);
    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();

    closeReviewComposer();

    expect(useReviewComposerStore.getState().open).toBe(false);
    expect(useFinishedBookShareStore.getState().activeSubject).toEqual(share);
    expect(useFinishedBookShareStore.getState().armedBookId).toBeNull();
  });

  it("finalizar sem cartão não revela o cartão de outro livro", () => {
    const share = subject("book-a");
    openReviewAfterFinish(book("book-a"), share);
    openReviewAfterFinish(book("book-b"), null);

    closeReviewComposer();

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedSubject).toEqual(share);
  });

  it("fechar no modo escrever não abre o cartão do X", () => {
    openReviewForBook(book("book-a"));
    closeReviewComposer();

    expect(useReviewComposerStore.getState()).toMatchObject({
      open: false,
      mode: null,
      book: null,
    });
    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedBookId).toBeNull();
  });

  it("reset desmonta o popup e mantém o cartão armado escondido", () => {
    const share = subject("book-a");
    openReviewAfterFinish(book("book-a"), share);
    resetReviewComposerStore();

    expect(useReviewComposerStore.getState().open).toBe(false);
    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedSubject).toEqual(share);
  });

  it("só troca o livro com o popup aberto", () => {
    useReviewComposerStore.getState().selectBook(book("book-a"));
    expect(useReviewComposerStore.getState().book).toBeNull();

    openReviewBlank();
    useReviewComposerStore.getState().selectBook(book("book-a"));

    expect(useReviewComposerStore.getState().book?.id).toBe("book-a");
    expect(useReviewComposerStore.getState().mode).toBe("compose");
  });
});
