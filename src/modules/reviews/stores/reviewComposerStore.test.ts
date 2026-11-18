import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useFinishedBookShareStore } from "@/modules/finishedBookShare/stores";
import type { FinishedBookShareSubject } from "@/modules/finishedBookShare/types";

import type { ReviewComposerBook } from "../types";
import { resetReviewComposerStore, useReviewComposerStore } from "./reviewComposerStore";

const book: ReviewComposerBook = {
  id: "book-1",
  title: "O Hobbit",
  author: "Tolkien",
  imageUrl: null,
  status: "finished",
  isSolo: true,
};

const otherBook: ReviewComposerBook = {
  ...book,
  id: "book-2",
  title: "Outro",
};

const share: FinishedBookShareSubject = {
  bookId: "book-1",
  title: "O Hobbit",
  author: "Tolkien",
  imageUrl: null,
};

const otherShare: FinishedBookShareSubject = {
  bookId: "book-2",
  title: "Outro",
  author: null,
  imageUrl: null,
};

function resetShare() {
  useFinishedBookShareStore.setState({
    armedBookId: null,
    armedSubject: null,
    activeSubject: null,
  });
}

describe("reviewComposerStore", () => {
  beforeEach(() => {
    resetReviewComposerStore();
    resetShare();
  });

  afterEach(() => {
    resetReviewComposerStore();
    resetShare();
  });

  it("ao fechar a finalização, revela só o card armado daquele livro", () => {
    useReviewComposerStore.getState().openAfterFinish(book, share);
    expect(useFinishedBookShareStore.getState().armedBookId).toBe("book-1");

    useReviewComposerStore.getState().close();

    expect(useReviewComposerStore.getState().open).toBe(false);
    expect(useFinishedBookShareStore.getState().activeSubject).toEqual(share);
    expect(useFinishedBookShareStore.getState().armedBookId).toBeNull();
  });

  it("finalização sem card não revela o card de outro livro", () => {
    useFinishedBookShareStore.getState().armAfterRating("book-2", otherShare);
    useReviewComposerStore.getState().openAfterFinish(book, null);

    useReviewComposerStore.getState().close();

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedSubject).toEqual(otherShare);
  });

  it("fechar a composição e o reset não revelam o card armado", () => {
    useFinishedBookShareStore.getState().armAfterRating(book.id, share);
    useReviewComposerStore.getState().openForBook(book);
    useReviewComposerStore.getState().close();

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedBookId).toBe(book.id);

    useReviewComposerStore.getState().openAfterFinish(otherBook, otherShare);
    useReviewComposerStore.getState().reset();

    expect(useReviewComposerStore.getState()).toMatchObject({
      open: false,
      mode: null,
      book: null,
    });
    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedBookId).toBe(otherBook.id);
  });
});
