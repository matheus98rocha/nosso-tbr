import { describe, expect, it } from "vitest";

import { normalizeFocusPages } from "./normalizeFocusPages";

describe("normalizeFocusPages", () => {
  it("aceita páginas inteiras dentro do intervalo", () => {
    expect(normalizeFocusPages(12.4)).toBe(12);
    expect(normalizeFocusPages(1)).toBe(1);
    expect(normalizeFocusPages(5000)).toBe(5000);
  });

  it("rejeita valores fora do intervalo", () => {
    expect(normalizeFocusPages(0)).toBeNull();
    expect(normalizeFocusPages(5001)).toBeNull();
    expect(normalizeFocusPages(Number.NaN)).toBeNull();
  });

  it("respeita o limite de páginas do livro", () => {
    expect(normalizeFocusPages(30, 20)).toBeNull();
    expect(normalizeFocusPages(10, 20)).toBe(10);
  });
});
