import { describe, expect, it } from "vitest";

import { FINISHED_BOOK_SHARE_LAYOUT } from "../../constants";
import { relativeLuminance } from "../relativeLuminance";
import {
  contrastRatio,
  deriveCardPalette,
  fallbackCoverColor,
  luminanceOf,
  pillStrokeWidth,
} from "./deriveCardPalette";

const WHITE = { r: 0xff, g: 0xff, b: 0xff };
const DARK_INK = { r: 0x1c, g: 0x19, b: 0x17 };
const PILL_INK_ON_LIGHT = { r: 0x14, g: 0x12, b: 0x10 };

describe("deriveCardPalette", () => {
  it("usa tinta clara e pílula branca em fundo escuro", () => {
    const palette = deriveCardPalette({ r: 20, g: 12, b: 8 });

    expect(luminanceOf(palette.textRegion)).toBeLessThan(0.42);
    expect(palette.titleInk).toEqual(WHITE);
    expect(palette.pillBackground).toEqual(WHITE);
    expect(palette.pillInk).toEqual(PILL_INK_ON_LIGHT);
    expect(contrastRatio(palette.pillInk, palette.pillBackground)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("usa #1C1917 e pílula escura quando o stop claro passa de 0.42", () => {
    const palette = deriveCardPalette({ r: 255, g: 255, b: 255 });

    expect(luminanceOf(palette.textRegion)).toBeGreaterThanOrEqual(0.42);
    expect(palette.titleInk).toEqual(DARK_INK);
    expect(palette.authorInk).toEqual(DARK_INK);
    expect(palette.pillBackground).toEqual(DARK_INK);
    expect(palette.pillInk).toEqual(WHITE);
    expect(contrastRatio(palette.pillInk, palette.pillBackground)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("força tinta clara no fallback mesmo se o stop claro subir", () => {
    const fallback = fallbackCoverColor();
    expect(fallback).toEqual({ r: 0x6b, g: 0x4f, b: 0x3a });

    const forced = deriveCardPalette(fallback, { isFallback: true });
    expect(forced.titleInk).toEqual(WHITE);
    expect(forced.pillBackground).toEqual(WHITE);
    expect(forced.pillInk).toEqual(PILL_INK_ON_LIGHT);

    const lightBase = { r: 250, g: 244, b: 230 };
    const natural = deriveCardPalette(lightBase);
    const skipped = deriveCardPalette(lightBase, { isFallback: true });
    expect(luminanceOf(natural.textRegion)).toBeGreaterThanOrEqual(
      FINISHED_BOOK_SHARE_LAYOUT.lightBackgroundCut,
    );
    expect(natural.titleInk).toEqual(DARK_INK);
    expect(skipped.titleInk).toEqual(WHITE);
    expect(skipped.pillBackground).toEqual(WHITE);
    expect(skipped.pillInk).toEqual(PILL_INK_ON_LIGHT);
  });

  it("usa autor sólido quando a opacidade não passa de 4.5", () => {
    let solid = false;
    let translucent = false;

    for (let value = 8; value <= 220; value += 4) {
      const palette = deriveCardPalette({
        r: value,
        g: Math.max(0, value - 8),
        b: Math.max(0, value - 20),
      });
      if (palette.authorAlpha === 1) {
        solid = true;
        expect(palette.authorInk).toEqual(palette.titleInk);
      }
      if (palette.authorAlpha === FINISHED_BOOK_SHARE_LAYOUT.authorAlpha) {
        translucent = true;
      }
    }

    expect(solid).toBe(true);
    expect(translucent).toBe(true);
  });

  it("aplica traço de 4 px quando a pílula cola no fundo", () => {
    expect(pillStrokeWidth(0.5, 0.6)).toBe(4);
    expect(pillStrokeWidth(0.1, 1)).toBe(0);

    const palette = deriveCardPalette({ r: 20, g: 12, b: 8 });
    const expected = pillStrokeWidth(
      luminanceOf(palette.textRegion),
      luminanceOf(palette.pillBackground),
    );
    expect(palette.pillStrokeWidth).toBe(expected);
    expect(
      Math.abs(
        luminanceOf(palette.pillBackground) - luminanceOf(palette.textRegion),
      ),
    ).toBeGreaterThanOrEqual(0.18);
    expect(palette.pillStrokeWidth).toBe(0);
  });

  it("mantém o contraste do 100% nos dois pares", () => {
    const dark = deriveCardPalette({ r: 12, g: 18, b: 32 });
    const light = deriveCardPalette({ r: 245, g: 236, b: 214 });
    expect(contrastRatio(dark.pillInk, dark.pillBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.pillInk, light.pillBackground)).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(1, 1, 1)).toBeGreaterThan(0.92);
  });
});
