import { describe, expect, it } from "vitest";

import type { ReadingProgressDomain } from "../types/readingProgress.types";
import { normalizeReadingProgressManyQueryData } from "./normalizeReadingProgressManyQueryData";

const row: ReadingProgressDomain = {
  bookId: "book-1",
  total: 10,
  completed: 4,
  percentage: 40,
};

describe("normalizeReadingProgressManyQueryData", () => {
  it("retorna mapas vazios quando data é undefined", () => {
    const result = normalizeReadingProgressManyQueryData(undefined);

    expect(result.progress).toEqual([]);
    expect(result.paceByBookId.size).toBe(0);
  });

  it("aceita o formato legado de array no cache", () => {
    const result = normalizeReadingProgressManyQueryData([row]);

    expect(result.progress).toEqual([row]);
    expect(result.paceByBookId.size).toBe(0);
  });

  it("preserva progress e paceByBookId no formato atual", () => {
    const paceByBookId = new Map();
    const result = normalizeReadingProgressManyQueryData({
      progress: [row],
      paceByBookId,
    });

    expect(result.progress).toEqual([row]);
    expect(result.paceByBookId).toBe(paceByBookId);
  });

  it("não quebra quando o payload não tem progress iterável", () => {
    const result = normalizeReadingProgressManyQueryData({
      data: [{ id: "book-1" }],
      total: 1,
    } as never);

    expect(result.progress).toEqual([]);
    expect(result.paceByBookId.size).toBe(0);
  });
});
