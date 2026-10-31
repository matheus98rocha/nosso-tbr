"use client";

import { create } from "zustand";

import type { FinishedBookShareSubject } from "../types";

type FinishedBookShareState = {
  armedBookId: string | null;
  armedSubject: FinishedBookShareSubject | null;
  activeSubject: FinishedBookShareSubject | null;
  armAfterRating: (bookId: string, subject: FinishedBookShareSubject) => void;
  revealArmed: (bookId: string) => void;
  clearArmed: (bookId: string) => void;
  openNow: (subject: FinishedBookShareSubject) => void;
  close: () => void;
};

export const useFinishedBookShareStore = create<FinishedBookShareState>((set, get) => ({
  armedBookId: null,
  armedSubject: null,
  activeSubject: null,

  armAfterRating: (bookId, subject) => {
    set({ armedBookId: bookId, armedSubject: subject });
  },

  revealArmed: (bookId) => {
    const state = get();
    if (state.armedBookId !== bookId || !state.armedSubject) return;
    set({
      activeSubject: state.armedSubject,
      armedBookId: null,
      armedSubject: null,
    });
  },

  clearArmed: (bookId) => {
    if (get().armedBookId !== bookId) return;
    set({ armedBookId: null, armedSubject: null });
  },

  openNow: (subject) => {
    set({ activeSubject: subject });
  },

  close: () => {
    set({ activeSubject: null });
  },
}));

export function armAfterRating(
  bookId: string,
  subject: FinishedBookShareSubject,
) {
  useFinishedBookShareStore.getState().armAfterRating(bookId, subject);
}

export function revealArmed(bookId: string) {
  useFinishedBookShareStore.getState().revealArmed(bookId);
}

export function clearArmed(bookId: string) {
  useFinishedBookShareStore.getState().clearArmed(bookId);
}

export function openNow(subject: FinishedBookShareSubject) {
  useFinishedBookShareStore.getState().openNow(subject);
}

export function close() {
  useFinishedBookShareStore.getState().close();
}
