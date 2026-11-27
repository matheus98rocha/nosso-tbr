import { beforeEach, describe, expect, it } from "vitest";

import type { FocusActiveSession, FocusSession } from "../../types/focus.types";
import {
  appendFocusSession,
  clearFocusActive,
  loadFocusActive,
  loadFocusPages,
  loadFocusSessions,
  saveFocusActive,
  saveFocusPage,
} from "./focusStorage";

const USER_ID = "user-1";

const active: FocusActiveSession = {
  mode: "timer",
  status: "paused",
  startedAt: "2026-01-01T12:00:00Z",
  endsAt: "2026-01-01T12:25:00Z",
  accumulatedSeconds: 42,
  durationSeconds: 1500,
  selectedBookId: "book-1",
  goalPages: 10,
  muted: true,
  updatedAt: "2026-01-01T12:01:00Z",
};

const session: FocusSession = {
  id: "session-1",
  startedAt: "2026-01-01T12:00:00Z",
  finishedAt: "2026-01-01T12:25:00Z",
  durationSeconds: 1500,
  mode: "timer",
  bookId: "book-1",
  goalPages: 10,
  pagesRead: 10,
  finishedPage: 20,
};

describe("focusStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persiste e remove a sessão ativa", () => {
    saveFocusActive(USER_ID, active);

    expect(loadFocusActive(USER_ID)).toEqual(active);

    clearFocusActive(USER_ID);

    expect(loadFocusActive(USER_ID)).toBeNull();
  });

  it("isola os dados por usuário", () => {
    saveFocusActive(USER_ID, active);

    expect(loadFocusActive("user-2")).toBeNull();
  });

  it("acumula sessões sem duplicar o mesmo id", () => {
    appendFocusSession(USER_ID, session);
    appendFocusSession(USER_ID, { ...session, pagesRead: 12 });

    expect(loadFocusSessions(USER_ID)).toHaveLength(1);
    expect(loadFocusSessions(USER_ID)[0].pagesRead).toBe(12);
  });

  it("persiste a página atual por livro", () => {
    saveFocusPage(USER_ID, "book-1", 20);
    saveFocusPage(USER_ID, "book-2", 7);

    expect(loadFocusPages(USER_ID)).toEqual({
      "book-1": 20,
      "book-2": 7,
    });
  });

  it("ignora dados inválidos", () => {
    window.localStorage.setItem(
      "nosso-tbr:focus:active:user-1",
      "{ invalido",
    );
    window.localStorage.setItem(
      "nosso-tbr:focus:sessions:user-1",
      JSON.stringify([{ id: "incompleto" }]),
    );
    window.localStorage.setItem(
      "nosso-tbr:focus:pages:user-1",
      JSON.stringify({ "book-1": -5 }),
    );

    expect(loadFocusActive(USER_ID)).toBeNull();
    expect(loadFocusSessions(USER_ID)).toEqual([]);
    expect(loadFocusPages(USER_ID)).toEqual({});
  });
});
