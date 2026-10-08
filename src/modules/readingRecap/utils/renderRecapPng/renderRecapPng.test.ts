import { afterEach, describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import { renderRecapImageToPng } from "./renderRecapPng";

const AMAZON = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_PROXY = `/api/book-covers?url=${encodeURIComponent(AMAZON)}`;

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

  it("só desenha capa cadastrada e nunca carrega o placeholder", async () => {
    const assigned = stubImage([AMAZON_PROXY, "/x.svg"]);
    const { fills, drawImage } = stubCanvas();

    await renderRecapImageToPng({
      title: "Leituras de 7 de outubro de 2026",
      subtitle: null,
      coverSrcs: [
        AMAZON,
        BOOK_COVER_PLACEHOLDER_SRC,
        "/x.svg",
        "https://example.com/cover.jpg",
      ],
    });

    expect(assigned).toEqual([AMAZON_PROXY, "/x.svg"]);
    expect(assigned).not.toContain(BOOK_COVER_PLACEHOLDER_SRC);
    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(fills).not.toContain("#E7E0D4");
  });

  it("se a capa remota falha o load, não cai no placeholder nem desenha slot vazio", async () => {
    const assigned = stubImage([]);
    const { fills, drawImage } = stubCanvas();

    await renderRecapImageToPng({
      title: "Leituras de 7 de outubro de 2026",
      subtitle: null,
      coverSrcs: [AMAZON],
    });

    expect(assigned).toEqual([AMAZON_PROXY]);
    expect(assigned).not.toContain(BOOK_COVER_PLACEHOLDER_SRC);
    expect(drawImage).not.toHaveBeenCalled();
    expect(fills).not.toContain("#E7E0D4");
  });
});
