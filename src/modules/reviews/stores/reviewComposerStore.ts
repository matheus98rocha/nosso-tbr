"use client";

import { create } from "zustand";

import { armAfterRating, revealArmed } from "@/modules/finishedBookShare/stores";
import type { FinishedBookShareSubject } from "@/modules/finishedBookShare/types";

import type { ReviewComposerBook, ReviewComposerMode } from "../types";

type ReviewComposerState = {
  open: boolean;
  mode: ReviewComposerMode | null;
  book: ReviewComposerBook | null;
  openAfterFinish: (
    book: ReviewComposerBook,
    shareSubject: FinishedBookShareSubject | null,
  ) => void;
  openForBook: (book: ReviewComposerBook) => void;
  openBlank: () => void;
  selectBook: (book: ReviewComposerBook) => void;
  close: () => void;
  reset: () => void;
};

const closed = {
  open: false,
  mode: null,
  book: null,
};

export const useReviewComposerStore = create<ReviewComposerState>((set, get) => ({
  ...closed,

  openAfterFinish: (book, shareSubject) => {
    if (shareSubject) armAfterRating(book.id, shareSubject);
    set({ open: true, mode: "finish", book });
  },

  openForBook: (book) => {
    set({ open: true, mode: "compose", book });
  },

  openBlank: () => {
    set({ open: true, mode: "compose", book: null });
  },

  selectBook: (book) => {
    if (!get().open) return;
    set({ book });
  },

  close: () => {
    const { mode, book } = get();
    set(closed);
    if (mode === "finish" && book) revealArmed(book.id);
  },

  reset: () => {
    set(closed);
  },
}));

export function openReviewAfterFinish(
  book: ReviewComposerBook,
  shareSubject: FinishedBookShareSubject | null,
) {
  useReviewComposerStore.getState().openAfterFinish(book, shareSubject);
}

export function openReviewForBook(book: ReviewComposerBook) {
  useReviewComposerStore.getState().openForBook(book);
}

export function openReviewBlank() {
  useReviewComposerStore.getState().openBlank();
}

export function closeReviewComposer() {
  useReviewComposerStore.getState().close();
}

export function resetReviewComposerStore() {
  useReviewComposerStore.getState().reset();
}
