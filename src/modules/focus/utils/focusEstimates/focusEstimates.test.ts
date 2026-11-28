import { describe, expect, it } from "vitest";

import type { FocusSession } from "../../types/focus.types";
import {
  computeFocusSpeed,
  estimateBookRemainingMinutes,
  estimateFocusPages,
  suggestFinishPage,
  suggestFocusMinutes,
} from "./focusEstimates";

function makeSession(
  index: number,
  pagesRead: number,
  durationSeconds: number,
): FocusSession {
  return {
    id: `session-${index}`,
    startedAt: "2026-01-01T12:00:00Z",
    finishedAt: "2026-01-01T12:30:00Z",
    durationSeconds,
    mode: "timer",
    bookId: null,
    goalPages: pagesRead,
    pagesRead,
    finishedPage: null,
  };
}

describe("focusEstimates", () => {
  it("usa a velocidade padrão até haver três sessões válidas", () => {
    expect(computeFocusSpeed([makeSession(1, 60, 1800)])).toBe(1);
    expect(
      computeFocusSpeed([
        makeSession(1, 30, 1800),
        makeSession(2, 20, 1200),
        makeSession(3, 10, 600),
      ]),
    ).toBe(1);
  });

  it("calcula páginas por minuto a partir das sessões válidas", () => {
    const speed = computeFocusSpeed([
      makeSession(1, 30, 1800),
      makeSession(2, 40, 1200),
      makeSession(3, 50, 1800),
    ]);

    expect(speed).toBeCloseTo(1.5);
  });

  it("sugere minutos arredondando para cima", () => {
    expect(suggestFocusMinutes(21, 2)).toBe(11);
    expect(suggestFocusMinutes(20, 2)).toBe(10);
    expect(suggestFocusMinutes(0, 2)).toBeNull();
  });

  it("estima páginas a partir do tempo selecionado", () => {
    expect(estimateFocusPages(25, 1.5)).toBe(37);
    expect(estimateFocusPages(0, 2)).toBe(0);
  });

  it("estima o tempo restante para concluir o livro", () => {
    expect(estimateBookRemainingMinutes(10, 210, 2)).toBe(100);
    expect(estimateBookRemainingMinutes(210, 210, 2)).toBe(0);
  });

  it("sugere a página final sem passar do total de páginas", () => {
    expect(suggestFinishPage(10, 20, 15, 100)).toBe(30);
    expect(suggestFinishPage(10, null, 15, 100)).toBe(25);
    expect(suggestFinishPage(95, 20, 15, 100)).toBe(100);
  });
});
