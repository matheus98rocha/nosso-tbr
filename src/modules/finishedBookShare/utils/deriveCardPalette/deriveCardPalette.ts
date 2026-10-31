import { FINISHED_BOOK_SHARE_LAYOUT } from "../../constants";
import type { CoverRgb } from "../extractCoverColor";
import { relativeLuminance } from "../relativeLuminance";

export type CardPalette = {
  textRegion: CoverRgb;
  edge: CoverRgb;
  titleInk: CoverRgb;
  authorInk: CoverRgb;
  authorAlpha: number;
  pillBackground: CoverRgb;
  pillInk: CoverRgb;
  pillStrokeWidth: number;
};

type Hsl = {
  h: number;
  s: number;
  l: number;
};

function hexToRgb(hex: string): CoverRgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: CoverRgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  return { h: hue * 60, s: saturation, l: lightness };
}

function hslToRgb({ h, s, l }: Hsl): CoverRgb {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const huePrime = ((h % 360) + 360) % 360 / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }
  const match = l - chroma / 2;
  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

export function luminanceOf(color: CoverRgb): number {
  return relativeLuminance(color.r / 255, color.g / 255, color.b / 255);
}

export function contrastRatio(first: CoverRgb, second: CoverRgb): number {
  const lighter = Math.max(luminanceOf(first), luminanceOf(second));
  const darker = Math.min(luminanceOf(first), luminanceOf(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function pillStrokeWidth(regionY: number, pillY: number): number {
  return Math.abs(pillY - regionY) < FINISHED_BOOK_SHARE_LAYOUT.pillSeparation
    ? FINISHED_BOOK_SHARE_LAYOUT.pillStrokePx
    : 0;
}

export function deriveCardPalette(
  base: CoverRgb,
  options?: { isFallback?: boolean },
): CardPalette {
  const baseHsl = rgbToHsl(base);
  const textRegion = hslToRgb({
    h: baseHsl.h,
    s: baseHsl.s * FINISHED_BOOK_SHARE_LAYOUT.gradientSaturationScale,
    l: Math.min(
      baseHsl.l + FINISHED_BOOK_SHARE_LAYOUT.gradientLightnessLift,
      FINISHED_BOOK_SHARE_LAYOUT.gradientLightnessCap,
    ),
  });
  const edge = hslToRgb({
    h: baseHsl.h,
    s: baseHsl.s,
    l: Math.max(
      baseHsl.l * FINISHED_BOOK_SHARE_LAYOUT.edgeLightnessScale,
      FINISHED_BOOK_SHARE_LAYOUT.edgeLightnessFloor,
    ),
  });
  const lightInk = hexToRgb(FINISHED_BOOK_SHARE_LAYOUT.lightInk);
  const darkInk = hexToRgb(FINISHED_BOOK_SHARE_LAYOUT.darkInk);
  const pillInkOnLight = hexToRgb(FINISHED_BOOK_SHARE_LAYOUT.pillInkOnLight);
  const regionY = luminanceOf(textRegion);
  const useLightInk = options?.isFallback
    ? true
    : regionY < FINISHED_BOOK_SHARE_LAYOUT.lightBackgroundCut;

  const titleInk = useLightInk ? lightInk : darkInk;
  const pillBackground = useLightInk ? lightInk : darkInk;
  const pillInk = useLightInk ? pillInkOnLight : lightInk;
  const compositedAuthor = {
    r:
      titleInk.r * FINISHED_BOOK_SHARE_LAYOUT.authorAlpha +
      textRegion.r * (1 - FINISHED_BOOK_SHARE_LAYOUT.authorAlpha),
    g:
      titleInk.g * FINISHED_BOOK_SHARE_LAYOUT.authorAlpha +
      textRegion.g * (1 - FINISHED_BOOK_SHARE_LAYOUT.authorAlpha),
    b:
      titleInk.b * FINISHED_BOOK_SHARE_LAYOUT.authorAlpha +
      textRegion.b * (1 - FINISHED_BOOK_SHARE_LAYOUT.authorAlpha),
  };
  const authorIsSolid =
    contrastRatio(compositedAuthor, textRegion) <
    FINISHED_BOOK_SHARE_LAYOUT.minContrast;

  return {
    textRegion,
    edge,
    titleInk,
    authorInk: titleInk,
    authorAlpha: authorIsSolid ? 1 : FINISHED_BOOK_SHARE_LAYOUT.authorAlpha,
    pillBackground,
    pillInk,
    pillStrokeWidth: pillStrokeWidth(regionY, luminanceOf(pillBackground)),
  };
}

export function fallbackCoverColor(): CoverRgb {
  return hexToRgb(FINISHED_BOOK_SHARE_LAYOUT.fallbackColor);
}
