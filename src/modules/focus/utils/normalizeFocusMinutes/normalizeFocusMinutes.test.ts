import { describe, expect, it } from "vitest";

import { normalizeFocusMinutes } from "./normalizeFocusMinutes";

describe("normalizeFocusMinutes", () => {
  it("arredonda e aceita minutos dentro do intervalo", () => {
    expect(normalizeFocusMinutes(25)).toBe(25);
    expect(normalizeFocusMinutes(24.6)).toBe(25);
    expect(normalizeFocusMinutes(1)).toBe(1);
    expect(normalizeFocusMinutes(180)).toBe(180);
  });

  it("recusa valores fora do intervalo ou não finitos", () => {
    expect(normalizeFocusMinutes(0)).toBeNull();
    expect(normalizeFocusMinutes(181)).toBeNull();
    expect(normalizeFocusMinutes(Number.NaN)).toBeNull();
    expect(normalizeFocusMinutes(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
