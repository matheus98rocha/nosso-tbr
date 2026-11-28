import { describe, expect, it } from "vitest";

import { computeFocusPageRange, normalizeFocusBookPage } from "./focusPageRange";

describe("focusPageRange", () => {
  it("aceita páginas inteiras dentro do livro", () => {
    expect(normalizeFocusBookPage(1, 200)).toBe(1);
    expect(normalizeFocusBookPage(200, 200)).toBe(200);
  });

  it("rejeita páginas fora do livro", () => {
    expect(normalizeFocusBookPage(0, 200)).toBeNull();
    expect(normalizeFocusBookPage(201, 200)).toBeNull();
    expect(normalizeFocusBookPage(10.5, 200)).toBeNull();
  });

  it("calcula as páginas entre a atual e a pretendida", () => {
    expect(computeFocusPageRange(30, 50, 200)).toBe(20);
    expect(computeFocusPageRange(30, 30, 200)).toBeNull();
    expect(computeFocusPageRange(30, 20, 200)).toBeNull();
  });
});
