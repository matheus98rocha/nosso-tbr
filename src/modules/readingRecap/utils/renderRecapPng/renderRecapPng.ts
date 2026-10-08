import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapImage } from "../../types";
import { toSameOriginCoverSrc } from "../toSameOriginCoverSrc";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const GRID_COLUMNS = 3;
const GRID_ROWS = 5;
const COVER_LOAD_TIMEOUT_MS = 8000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error("cover-load-timeout"));
    }, COVER_LOAD_TIMEOUT_MS);
    image.crossOrigin = "anonymous";
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

async function loadCoverImage(src: string): Promise<HTMLImageElement | null> {
  const proxied = toSameOriginCoverSrc(src);
  try {
    return await loadImage(proxied);
  } catch {
    if (proxied === BOOK_COVER_PLACEHOLDER_SRC) return null;
    try {
      return await loadImage(BOOK_COVER_PLACEHOLDER_SRC);
    } catch {
      return null;
    }
  }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  roundRectPath(ctx, x, y, width, height, 22);
  ctx.clip();
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("png-blob-failed"));
    }, "image/png");
  });
}

export async function renderRecapImageToPng(image: RecapImage): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas-unavailable");
  }

  const covers = await Promise.all(
    image.coverSrcs.map((src) => loadCoverImage(src)),
  );

  ctx.fillStyle = "#F3EDE3";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#E8DFD2";
  ctx.beginPath();
  ctx.arc(180, -40, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#E4D9F2";
  ctx.beginPath();
  ctx.arc(980, 1860, 280, 0, Math.PI * 2);
  ctx.fill();

  const contentX = 72;
  const contentWidth = CANVAS_WIDTH - contentX * 2;

  ctx.fillStyle = "#1C1917";
  ctx.font = '600 52px Georgia, "Times New Roman", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, image.title, contentWidth);
  let cursorY = 88;
  for (const line of titleLines) {
    ctx.fillText(line, CANVAS_WIDTH / 2, cursorY);
    cursorY += 64;
  }

  if (image.subtitle) {
    ctx.fillStyle = "#78716C";
    ctx.font = '500 28px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(image.subtitle, CANVAS_WIDTH / 2, cursorY + 8);
    cursorY += 52;
  } else {
    cursorY += 16;
  }

  const gridTop = cursorY + 36;
  const footerTop = CANVAS_HEIGHT - 120;
  const gridHeight = footerTop - gridTop - 24;
  const gap = 22;
  const cellWidth = (contentWidth - gap * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const cellHeight = (gridHeight - gap * (GRID_ROWS - 1)) / GRID_ROWS;

  covers.forEach((cover, index) => {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    const x = contentX + column * (cellWidth + gap);
    const y = gridTop + row * (cellHeight + gap);
    if (!cover || cover.width === 0) {
      ctx.save();
      roundRectPath(ctx, x, y, cellWidth, cellHeight, 22);
      ctx.fillStyle = "#E7E0D4";
      ctx.fill();
      ctx.restore();
      return;
    }
    drawCover(ctx, cover, x, y, cellWidth, cellHeight);
  });

  ctx.fillStyle = "#5B4BDB";
  ctx.font = '600 28px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Nosso TBR", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 72);

  return canvasToPngBlob(canvas);
}

export function triggerPngDownload(blob: Blob, filename: string) {
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
