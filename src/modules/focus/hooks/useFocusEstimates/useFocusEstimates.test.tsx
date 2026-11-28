import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { FocusBook } from "../../types/focus.types";
import { useFocusEstimates } from "./useFocusEstimates";

const book: FocusBook = {
  id: "book-1",
  title: "O nome do vento",
  author: "Patrick Rothfuss",
  authorIds: ["author-1"],
  imageUrl: "https://example.com/capa.jpg",
  pages: 200,
  currentPage: 30,
  readerIds: ["user-1"],
  chosenBy: "user-1",
  userId: "user-1",
  startDate: "2026-01-01",
  gender: "Fantasia",
  isReread: false,
  status: "reading",
};

describe("useFocusEstimates", () => {
  it("sugere minutos a partir das páginas entre a atual e a pretendida", () => {
    const { result } = renderHook(() =>
      useFocusEstimates({
        sessions: [],
        book,
        goalPages: 20,
        targetPage: 50,
        durationMinutes: 25,
      }),
    );

    expect(result.current.speed).toBe(1);
    expect(result.current.suggestedMinutes).toBe(20);
    expect(result.current.remainingMinutes).toBe(20);
  });

  it("usa o fim do livro quando não há página pretendida", () => {
    const { result } = renderHook(() =>
      useFocusEstimates({
        sessions: [],
        book,
        goalPages: null,
        durationMinutes: 25,
      }),
    );

    expect(result.current.remainingMinutes).toBe(170);
  });
});
