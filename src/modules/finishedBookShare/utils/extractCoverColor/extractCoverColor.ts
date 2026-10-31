import { FINISHED_BOOK_SHARE_LAYOUT } from "../../constants";
import { relativeLuminance } from "../relativeLuminance";

export type CoverRgb = {
  r: number;
  g: number;
  b: number;
};

type ColorBucket = {
  index: number;
  count: number;
  chromaSum: number;
  rSum: number;
  gSum: number;
  bSum: number;
};

export function extractCoverColor(image: ImageData): CoverRgb | null {
  const { data } = image;
  const step = FINISHED_BOOK_SHARE_LAYOUT.quantizationStep;
  const buckets = new Map<number, ColorBucket>();

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset] ?? 0;
    const green = data[offset + 1] ?? 0;
    const blue = data[offset + 2] ?? 0;
    const alpha = data[offset + 3] ?? 0;
    if (alpha < FINISHED_BOOK_SHARE_LAYOUT.alphaMin) continue;

    const chroma = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
    if (chroma < FINISHED_BOOK_SHARE_LAYOUT.chromaticityMin) continue;

    const luminance = relativeLuminance(red / 255, green / 255, blue / 255);
    if (
      luminance < FINISHED_BOOK_SHARE_LAYOUT.luminanceFloor ||
      luminance > FINISHED_BOOK_SHARE_LAYOUT.luminanceCeil
    ) {
      continue;
    }

    const quantRed = Math.floor(red / step) * step;
    const quantGreen = Math.floor(green / step) * step;
    const quantBlue = Math.floor(blue / step) * step;
    const index =
      (quantRed / step) * 256 + (quantGreen / step) * 16 + quantBlue / step;
    const bucket = buckets.get(index) ?? {
      index,
      count: 0,
      chromaSum: 0,
      rSum: 0,
      gSum: 0,
      bSum: 0,
    };
    bucket.count += 1;
    bucket.chromaSum += chroma;
    bucket.rSum += red;
    bucket.gSum += green;
    bucket.bSum += blue;
    buckets.set(index, bucket);
  }

  let winner: ColorBucket | null = null;
  for (const bucket of buckets.values()) {
    if (!winner || bucket.count > winner.count) {
      winner = bucket;
      continue;
    }
    if (bucket.count < winner.count) continue;

    const bucketChroma = bucket.chromaSum / bucket.count;
    const winnerChroma = winner.chromaSum / winner.count;
    if (bucketChroma > winnerChroma) {
      winner = bucket;
      continue;
    }
    if (bucketChroma < winnerChroma) continue;
    if (bucket.index < winner.index) winner = bucket;
  }

  if (!winner) return null;

  return {
    r: winner.rSum / winner.count,
    g: winner.gSum / winner.count,
    b: winner.bSum / winner.count,
  };
}
