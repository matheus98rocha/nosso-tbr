import {
  BOOK_COVER_PLACEHOLDER_SRC,
  isAllowedBookCoverUrl,
  isPlaceholderBookCoverSrc,
} from "@/constants/bookCover";
import { toSameOriginCoverSrc } from "@/modules/readingRecap/utils/toSameOriginCoverSrc";

import { FINISHED_BOOK_SHARE_LAYOUT } from "../../constants";
import type { FinishedBookShareSubject } from "../../types";
import { buildShareModel } from "../buildShareModel";
import {
  deriveCardPalette,
  fallbackCoverColor,
  type CardPalette,
} from "../deriveCardPalette";
import { extractCoverColor, type CoverRgb } from "../extractCoverColor";

const COVER_LOAD_TIMEOUT_MS = 8000;

function rgbCss(color: CoverRgb, alpha = 1): string {
  const red = Math.round(color.r);
  const green = Math.round(color.g);
  const blue = Math.round(color.b);
  if (alpha < 1) return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  return `rgb(${red}, ${green}, ${blue})`;
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FINISHED_BOOK_SHARE_LAYOUT.fontFamily}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error("cover-load-timeout"));
    }, COVER_LOAD_TIMEOUT_MS);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("cover-load-failed"));
    };
    image.src = src;
  });
}

async function tryLoadCover(src: string): Promise<HTMLImageElement | null> {
  try {
    const image = await loadImage(src);
    return image.width > 0 ? image : null;
  } catch {
    return null;
  }
}

function canSampleCover(imageUrl: string | null): boolean {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed || isPlaceholderBookCoverSrc(trimmed)) return false;
  return isAllowedBookCoverUrl(trimmed);
}

function drawableSrc(imageUrl: string | null): string {
  const trimmed = imageUrl?.trim() ?? "";
  if (!canSampleCover(trimmed)) return BOOK_COVER_PLACEHOLDER_SRC;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return toSameOriginCoverSrc(trimmed);
}

async function loadDrawable(imageUrl: string | null): Promise<{
  image: HTMLImageElement | null;
  sample: boolean;
}> {
  const sample = canSampleCover(imageUrl);
  const loaded = await tryLoadCover(drawableSrc(imageUrl));
  if (loaded && sample) return { image: loaded, sample: true };
  if (loaded && !sample) return { image: loaded, sample: false };
  if (drawableSrc(imageUrl) === BOOK_COVER_PLACEHOLDER_SRC) {
    return { image: null, sample: false };
  }
  const placeholder = await tryLoadCover(BOOK_COVER_PLACEHOLDER_SRC);
  return { image: placeholder, sample: false };
}

function readCoverColor(image: HTMLImageElement): CoverRgb | null {
  const largest = Math.max(image.width, image.height);
  const scale =
    largest > FINISHED_BOOK_SHARE_LAYOUT.sampleMaxPx
      ? FINISHED_BOOK_SHARE_LAYOUT.sampleMaxPx / largest
      : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  context.drawImage(image, 0, 0, width, height);
  return extractCoverColor(context.getImageData(0, 0, width, height));
}

function traceRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.arcTo(x + width, y, x + width, y + height, corner);
  context.arcTo(x + width, y + height, x, y + height, corner);
  context.arcTo(x, y + height, x, y, corner);
  context.arcTo(x, y, x + width, y, corner);
  context.closePath();
}

function ellipsizeToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (context.measureText(text).width <= maxWidth) return text;
  const chars = Array.from(text);
  let low = 0;
  let high = chars.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${chars.slice(0, mid).join("")}…`;
    if (context.measureText(candidate).width <= maxWidth) low = mid;
    else high = mid - 1;
  }
  if (low <= 0) return "…";
  return `${chars.slice(0, low).join("")}…`;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (!current || context.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function limitLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const wrapped = wrapText(context, text, maxWidth);
  if (wrapped.length === 0) return [];
  const lines =
    wrapped.length <= maxLines
      ? wrapped
      : [...wrapped.slice(0, maxLines - 1), wrapped.slice(maxLines - 1).join(" ")];
  return lines.map((line) => ellipsizeToWidth(context, line, maxWidth));
}

function paintBackground(
  context: CanvasRenderingContext2D,
  palette: CardPalette,
) {
  const width = FINISHED_BOOK_SHARE_LAYOUT.canvasWidth;
  const height = FINISHED_BOOK_SHARE_LAYOUT.canvasHeight;
  const centerX =
    FINISHED_BOOK_SHARE_LAYOUT.textBlockX +
    FINISHED_BOOK_SHARE_LAYOUT.textBlockWidth / 2;
  const centerY = height / 2;
  const radius = Math.hypot(width, height);
  context.fillStyle = rgbCss(palette.edge);
  context.fillRect(0, 0, width, height);
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, rgbCss(palette.textRegion));
  gradient.addColorStop(1, rgbCss(palette.edge));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function paintCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
) {
  const boxX = FINISHED_BOOK_SHARE_LAYOUT.coverX;
  const boxWidth = FINISHED_BOOK_SHARE_LAYOUT.coverWidth;
  const boxHeight = FINISHED_BOOK_SHARE_LAYOUT.coverHeight;
  const boxY = (FINISHED_BOOK_SHARE_LAYOUT.canvasHeight - boxHeight) / 2;
  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = boxX + (boxWidth - drawWidth) / 2;
  const drawY = boxY + (boxHeight - drawHeight) / 2;

  context.save();
  context.shadowColor = "rgba(28, 25, 23, 0.28)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 10;
  traceRoundRect(
    context,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    FINISHED_BOOK_SHARE_LAYOUT.coverRadius,
  );
  context.fillStyle = "rgba(0, 0, 0, 0.01)";
  context.fill();
  context.shadowColor = "transparent";
  context.clip();
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function paintCopy(
  context: CanvasRenderingContext2D,
  palette: CardPalette,
  title: string,
  author: string | null,
) {
  const maxWidth = FINISHED_BOOK_SHARE_LAYOUT.textBlockWidth;
  const x = FINISHED_BOOK_SHARE_LAYOUT.textBlockX;
  context.font = font(
    FINISHED_BOOK_SHARE_LAYOUT.titleWeight,
    FINISHED_BOOK_SHARE_LAYOUT.titleSize,
  );
  const titleLines = limitLines(
    context,
    title,
    maxWidth,
    FINISHED_BOOK_SHARE_LAYOUT.titleMaxLines,
  );
  const titleHeight =
    titleLines.length * FINISHED_BOOK_SHARE_LAYOUT.titleLineHeight;
  const authorBlock = author
    ? FINISHED_BOOK_SHARE_LAYOUT.authorGap + FINISHED_BOOK_SHARE_LAYOUT.authorSize
    : 0;
  const total =
    titleHeight +
    authorBlock +
    FINISHED_BOOK_SHARE_LAYOUT.pillGap +
    FINISHED_BOOK_SHARE_LAYOUT.pillHeight;
  let cursorY = (FINISHED_BOOK_SHARE_LAYOUT.canvasHeight - total) / 2;

  context.fillStyle = rgbCss(palette.titleInk);
  context.textAlign = "left";
  context.textBaseline = "top";
  for (const line of titleLines) {
    context.fillText(line, x, cursorY);
    cursorY += FINISHED_BOOK_SHARE_LAYOUT.titleLineHeight;
  }

  if (author) {
    cursorY += FINISHED_BOOK_SHARE_LAYOUT.authorGap;
    context.font = font(
      FINISHED_BOOK_SHARE_LAYOUT.authorWeight,
      FINISHED_BOOK_SHARE_LAYOUT.authorSize,
    );
    context.fillStyle = rgbCss(palette.authorInk, palette.authorAlpha);
    const authorLine = ellipsizeToWidth(context, author, maxWidth);
    context.fillText(authorLine, x, cursorY);
    cursorY += FINISHED_BOOK_SHARE_LAYOUT.authorSize;
  }

  cursorY += FINISHED_BOOK_SHARE_LAYOUT.pillGap;
  context.font = font(
    FINISHED_BOOK_SHARE_LAYOUT.pillFontWeight,
    FINISHED_BOOK_SHARE_LAYOUT.pillFontSize,
  );
  const label = FINISHED_BOOK_SHARE_LAYOUT.pillLabel;
  const pillWidth =
    context.measureText(label).width + FINISHED_BOOK_SHARE_LAYOUT.pillPaddingX * 2;
  context.save();
  traceRoundRect(
    context,
    x,
    cursorY,
    pillWidth,
    FINISHED_BOOK_SHARE_LAYOUT.pillHeight,
    FINISHED_BOOK_SHARE_LAYOUT.pillRadius,
  );
  context.fillStyle = rgbCss(palette.pillBackground);
  context.fill();
  if (palette.pillStrokeWidth > 0) {
    context.lineWidth = palette.pillStrokeWidth;
    context.strokeStyle = rgbCss(palette.titleInk);
    context.stroke();
  }
  context.fillStyle = rgbCss(palette.pillInk);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    label,
    x + pillWidth / 2,
    cursorY + FINISHED_BOOK_SHARE_LAYOUT.pillHeight / 2,
  );
  context.restore();
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("png-blob-failed"));
      }, "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

export async function renderFinishedBookCardPng(
  subject: FinishedBookShareSubject,
): Promise<Blob> {
  const model = buildShareModel(subject);
  const drawable = await loadDrawable(subject.imageUrl);
  let extracted: CoverRgb | null = null;
  if (drawable.sample && drawable.image) {
    extracted = readCoverColor(drawable.image);
  }
  const palette = deriveCardPalette(extracted ?? fallbackCoverColor(), {
    isFallback: !extracted,
  });

  const canvas = document.createElement("canvas");
  canvas.width = FINISHED_BOOK_SHARE_LAYOUT.canvasWidth;
  canvas.height = FINISHED_BOOK_SHARE_LAYOUT.canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");

  paintBackground(context, palette);
  if (drawable.image) paintCover(context, drawable.image);
  paintCopy(context, palette, model.cardTitle, model.author);
  return canvasToPngBlob(canvas);
}

export function triggerFinishedBookShareDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
