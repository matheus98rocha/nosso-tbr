import { beforeEach, describe, expect, it } from "vitest";

import type { FinishedBookShareSubject } from "../types";
import {
  armAfterRating,
  clearArmed,
  close,
  openNow,
  revealArmed,
  useFinishedBookShareStore,
} from "./finishedBookShareStore";

const FIXTURE_ID = "book-1";

function subject(bookId = FIXTURE_ID): FinishedBookShareSubject {
  return {
    bookId,
    title: "Jogos Vorazes",
    author: "Suzanne Collins",
    imageUrl: null,
  };
}

describe("finishedBookShareStore", () => {
  beforeEach(() => {
    close();
    clearArmed(FIXTURE_ID);
  });

  it("arma sem abrir", () => {
    armAfterRating(FIXTURE_ID, subject());

    const state = useFinishedBookShareStore.getState();
    expect(state.armedBookId).toBe(FIXTURE_ID);
    expect(state.activeSubject).toBeNull();
  });

  it("revela só o id armado", () => {
    armAfterRating(FIXTURE_ID, subject());
    revealArmed("outro-livro");

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    expect(useFinishedBookShareStore.getState().armedBookId).toBe(FIXTURE_ID);

    revealArmed(FIXTURE_ID);

    expect(useFinishedBookShareStore.getState().activeSubject).toEqual(subject());
  });

  it("clearArmed descarta o id sem abrir", () => {
    armAfterRating(FIXTURE_ID, subject());
    clearArmed("outro-livro");
    expect(useFinishedBookShareStore.getState().armedBookId).toBe(FIXTURE_ID);

    clearArmed(FIXTURE_ID);

    const state = useFinishedBookShareStore.getState();
    expect(state.armedBookId).toBeNull();
    expect(state.activeSubject).toBeNull();
  });

  it("guarda um único slot armado", () => {
    armAfterRating(FIXTURE_ID, subject());
    armAfterRating("book-2", subject("book-2"));
    revealArmed(FIXTURE_ID);

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
    revealArmed("book-2");
    expect(useFinishedBookShareStore.getState().activeSubject?.bookId).toBe("book-2");
    clearArmed("book-2");
  });

  it("openNow abre sem estrelas", () => {
    openNow(subject());

    const state = useFinishedBookShareStore.getState();
    expect(state.activeSubject).toEqual(subject());
    expect(state.armedBookId).toBeNull();
  });

  it("close fecha o diálogo ativo", () => {
    openNow(subject());
    close();

    expect(useFinishedBookShareStore.getState().activeSubject).toBeNull();
  });
});
