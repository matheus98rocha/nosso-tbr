import { describe, expect, it } from "vitest";
import {
  computeReadingProgress,
  computeReadingProgressFromSchedule,
} from "./computeReadingProgress";

describe("computeReadingProgress", () => {
  it("retorna null quando total é zero", () => {
    expect(computeReadingProgress("book-1", 0, 0)).toBeNull();
  });

  it("retorna null quando total é negativo", () => {
    expect(computeReadingProgress("book-1", -1, 0)).toBeNull();
  });

  it("retorna null quando total não é finito", () => {
    expect(computeReadingProgress("book-1", Number.NaN, 0)).toBeNull();
    expect(computeReadingProgress("book-1", Number.POSITIVE_INFINITY, 0)).toBeNull();
  });

  it("calcula 0% quando nenhum capítulo foi lido", () => {
    expect(computeReadingProgress("book-1", 10, 0)).toEqual({
      bookId: "book-1",
      total: 10,
      completed: 0,
      percentage: 0,
    });
  });

  it("calcula 100% quando todos os capítulos foram lidos", () => {
    expect(computeReadingProgress("book-1", 10, 10)).toEqual({
      bookId: "book-1",
      total: 10,
      completed: 10,
      percentage: 100,
    });
  });

  it("arredonda percentuais não inteiros", () => {
    expect(computeReadingProgress("book-1", 7, 3)).toEqual({
      bookId: "book-1",
      total: 7,
      completed: 3,
      percentage: 43,
    });
    expect(computeReadingProgress("book-1", 7, 5)).toEqual({
      bookId: "book-1",
      total: 7,
      completed: 5,
      percentage: 71,
    });
  });

  it("trata completed maior que total como total (clamp)", () => {
    expect(computeReadingProgress("book-1", 5, 99)).toEqual({
      bookId: "book-1",
      total: 5,
      completed: 5,
      percentage: 100,
    });
  });

  it("trata completed negativo como zero", () => {
    expect(computeReadingProgress("book-1", 5, -10)).toEqual({
      bookId: "book-1",
      total: 5,
      completed: 0,
      percentage: 0,
    });
  });

  it("trata completed não finito como zero", () => {
    expect(computeReadingProgress("book-1", 5, Number.NaN)).toEqual({
      bookId: "book-1",
      total: 5,
      completed: 0,
      percentage: 0,
    });
  });
});

describe("computeReadingProgressFromSchedule", () => {
  it("retorna null para cronograma vazio", () => {
    expect(computeReadingProgressFromSchedule("book-1", [])).toBeNull();
  });

  it("retorna null para cronograma indefinido", () => {
    expect(computeReadingProgressFromSchedule("book-1", undefined)).toBeNull();
    expect(computeReadingProgressFromSchedule("book-1", null)).toBeNull();
  });

  it("conta corretamente linhas completas", () => {
    const schedule = [
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: false },
    ];
    expect(computeReadingProgressFromSchedule("book-1", schedule)).toEqual({
      bookId: "book-1",
      total: 4,
      completed: 2,
      percentage: 50,
    });
  });

  it("retorna 100% quando todas as linhas estão completas", () => {
    const schedule = [{ completed: true }, { completed: true }];
    expect(computeReadingProgressFromSchedule("book-1", schedule)).toEqual({
      bookId: "book-1",
      total: 2,
      completed: 2,
      percentage: 100,
    });
  });
});
