import { afterEach, describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapImage } from "../../types";
import { renderRecapImageToPng } from "./renderRecapPng";

const AMAZON = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_PROXY = `/api/book-covers?url=${encodeURIComponent(AMAZON)}`;
const OPEN_LIBRARY = "https://covers.openlibrary.org/b/id/8570014-L.jpg";
const OPEN_LIBRARY_PROXY = `/api/book-covers?url=${encodeURIComponent(OPEN_LIBRARY)}`;
const LOCAL = "/x.svg";
const INVALID = "https://example.com/cover.jpg";

function recapImage(coverSrcs: string[]): RecapImage {
  const covers = coverSrcs.map((src, index) => ({
    bookId: `book-${index + 1}`,
    title: `Livro ${index + 1}`,
    src,
  }));

  return {
    title: "Leituras de 7 de outubro de 2026",
    subtitle: null,
    covers,
    coverSrcs: covers.map((cover) => cover.src),
  };
}

function stubImage(succeedFor: string[]) {
  const assigned: string[] = [];

  class MockImage {
    crossOrigin = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 90;
    height = 130;

    set src(value: string) {
      assigned.push(value);
      queueMicrotask(() => {
        if (succeedFor.includes(value)) {
          this.onload?.();
          return;
        }
        this.onerror?.();
      });
    }
  }

  vi.stubGlobal("Image", MockImage);
  return assigned;
}

function stubCanvas() {
  const fills: string[] = [];
  const drawImage = vi.fn();
  const ctx = {
    fillStyle: "",
    font: "",
    textAlign: "center" as CanvasTextAlign,
    textBaseline: "top" as CanvasTextBaseline,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(() => {
      fills.push(String(ctx.fillStyle));
    }),
    fillText: vi.fn(),
    measureText: () => ({ width: 10 }),
    save: vi.fn(),
    restore: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    drawImage,
  };

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (callback: (blob: Blob | null) => void) => {
      callback(new Blob(["png"], { type: "image/png" }));
    },
  };

  const nativeCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    if (tagName === "canvas") {
      return canvas as unknown as HTMLCanvasElement;
    }
    return nativeCreateElement(tagName, options);
  }) as typeof document.createElement);

  return { fills, drawImage };
}

describe("renderRecapImageToPng", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("desenha capa cadastrada, path local e placeholder no mesmo número de slots", async () => {
    const assigned = stubImage([
      AMAZON_PROXY,
      LOCAL,
      BOOK_COVER_PLACEHOLDER_SRC,
    ]);
    const { drawImage } = stubCanvas();

    await renderRecapImageToPng(
      recapImage([AMAZON, BOOK_COVER_PLACEHOLDER_SRC, LOCAL, INVALID]),
    );

    expect(assigned).toContain(AMAZON_PROXY);
    expect(assigned).toContain(LOCAL);
    expect(assigned).toContain(BOOK_COVER_PLACEHOLDER_SRC);
    expect(assigned.filter((src) => src === BOOK_COVER_PLACEHOLDER_SRC).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(drawImage).toHaveBeenCalledTimes(4);
  });

  it("se a capa remota falha o load, desenha o placeholder no mesmo slot", async () => {
    const assigned = stubImage([BOOK_COVER_PLACEHOLDER_SRC]);
    const { drawImage } = stubCanvas();

    await renderRecapImageToPng(recapImage([AMAZON]));

    expect(assigned).toEqual([
      AMAZON_PROXY,
      AMAZON,
      BOOK_COVER_PLACEHOLDER_SRC,
    ]);
    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it("se o proxy da Open Library falha, desenha a URL original antes do placeholder", async () => {
    const assigned = stubImage([OPEN_LIBRARY]);
    const { drawImage } = stubCanvas();

    await renderRecapImageToPng(recapImage([OPEN_LIBRARY]));

    expect(assigned).toEqual([OPEN_LIBRARY_PROXY, OPEN_LIBRARY]);
    expect(drawImage).toHaveBeenCalledTimes(1);
  });

  it("não reordena nem omite slot quando só a capa do meio falha", async () => {
    const second = "https://m.media-amazon.com/images/I/81def.jpg";
    const secondProxy = `/api/book-covers?url=${encodeURIComponent(second)}`;
    const assigned = stubImage([AMAZON_PROXY, BOOK_COVER_PLACEHOLDER_SRC, LOCAL]);
    const { drawImage } = stubCanvas();

    await renderRecapImageToPng(recapImage([AMAZON, second, LOCAL]));

    expect(assigned).toEqual(
      expect.arrayContaining([
        AMAZON_PROXY,
        secondProxy,
        second,
        BOOK_COVER_PLACEHOLDER_SRC,
        LOCAL,
      ]),
    );
    expect(assigned).toHaveLength(5);
    expect(drawImage).toHaveBeenCalledTimes(3);
  });
});
