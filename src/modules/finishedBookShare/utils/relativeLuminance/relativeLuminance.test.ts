import { describe, expect, it } from "vitest";

import { relativeLuminance } from "./relativeLuminance";

describe("relativeLuminance", () => {
  it("trata preto como quase preto", () => {
    expect(relativeLuminance(0, 0, 0)).toBeLessThan(0.08);
  });

  it("trata branco como quase branco", () => {
    expect(relativeLuminance(1, 1, 1)).toBeGreaterThan(0.92);
  });

  it("deixa #E0A020 no meio da escala", () => {
    const luminance = relativeLuminance(0xe0 / 255, 0xa0 / 255, 0x20 / 255);
    expect(luminance).toBeGreaterThan(0.08);
    expect(luminance).toBeLessThan(0.92);
  });
});
