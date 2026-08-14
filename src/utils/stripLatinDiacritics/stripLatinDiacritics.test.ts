import { describe, expect, it } from "vitest";
import { stripLatinDiacritics } from "./stripLatinDiacritics";

describe("stripLatinDiacritics", () => {
  it("removes common Portuguese diacritics", () => {
    expect(stripLatinDiacritics("Anéis")).toBe("Aneis");
    expect(stripLatinDiacritics("AÇÚCAR")).toBe("ACUCAR");
  });

  it("leaves ascii letters unchanged", () => {
    expect(stripLatinDiacritics("aneis")).toBe("aneis");
  });
});
