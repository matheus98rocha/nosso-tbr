import { afterEach, describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import { renderFinishedBookCardPng } from "./renderFinishedBookCardPng";

const AMAZON = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_PROXY = `/api/book-covers?url=${encodeURIComponent(AMAZON)}`;
const LOCAL = "/x.svg";
const INVALID = "https://example.com/cover.jpg";

const subject = {
  bookId: "book-1",
  title: "Jogos Vorazes (Jogos Vorazes, #1)",
  author: "Suzanne Collins",
  imageUrl: AMAZON,
};

function stubImage(succeedFor: string[]) {
  const assigned: string[] = [];

  class MockImage {
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

function stubCanvas(options?: { imageDataError?: boolean; blobError?: boolean }) {
  const fillText = vi.fn();
  const drawImage = vi.fn();
  const getImageData = vi.fn(() => {
    if (options?.imageDataError) {
      throw new DOMException("tainted", "SecurityError");
    }
    return {
      data: new Uint8ClampedArray([0, 0, 0, 255]),
      width: 1,
      height: 1,
    };
  });
  const exports: { width: number; height: number; type?: string }[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = {
    fillStyle: "",
    strokeStyle: "",
    font: "",
    lineWidth: 0,
    textAlign: "left" as CanvasTextAlign,
    textBaseline: "top" as CanvasTextBaseline,
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText,
    measureText: () => ({ width: 10 }),
    save: vi.fn(),
    restore: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    drawImage,
    getImageData,
    createRadialGradient: () => gradient,
  };

  const nativeCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((
    tagName: string,
    elementOptions?: ElementCreationOptions,
  ) => {
    if (tagName === "canvas") {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => context,
        toBlob(callback: (blob: Blob | null) => void, type?: string) {
          if (options?.blobError) {
            throw new DOMException("tainted", "SecurityError");
          }
          exports.push({ width: canvas.width, height: canvas.height, type });
          callback(new Blob(["png"], { type: "image/png" }));
        },
      };
      return canvas as unknown as HTMLCanvasElement;
    }
    return nativeCreateElement(tagName, elementOptions);
  }) as typeof document.createElement);

  return { fillText, drawImage, getImageData, exports };
}

describe("renderFinishedBookCardPng", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exporta canvas 1200×600 em image/png e desenha título, autor e 100%", async () => {
    stubImage([AMAZON_PROXY]);
    const { fillText, drawImage, exports } = stubCanvas();

    const blob = await renderFinishedBookCardPng(subject);

    expect(blob.type).toBe("image/png");
    expect(exports).toEqual([
      { width: 1200, height: 600, type: "image/png" },
    ]);
    expect(fillText).toHaveBeenCalledWith(
      "Jogos Vorazes (Jogos Vorazes, #1)",
      expect.any(Number),
      expect.any(Number),
    );
    expect(fillText).toHaveBeenCalledWith(
      "Suzanne Collins",
      expect.any(Number),
      expect.any(Number),
    );
    expect(fillText).toHaveBeenCalledWith("100%", expect.any(Number), expect.any(Number));

    const display = drawImage.mock.calls.find((call) => Number(call[3]) > 64);
    expect(display?.[3]).toBeCloseTo(300);
    expect(display?.[4]).toBeCloseTo(130 * (300 / 90));
  });

  it("pede a capa da Amazon só pelo proxy", async () => {
    const assigned = stubImage([AMAZON_PROXY]);
    stubCanvas();

    await renderFinishedBookCardPng(subject);

    expect(assigned).toContain(AMAZON_PROXY);
    expect(assigned).not.toContain(AMAZON);
  });

  it("não amostra placeholder nem host proibido e ainda pede o SVG local", async () => {
    const assigned = stubImage([BOOK_COVER_PLACEHOLDER_SRC]);
    const { getImageData, drawImage } = stubCanvas();

    await renderFinishedBookCardPng({
      ...subject,
      imageUrl: BOOK_COVER_PLACEHOLDER_SRC,
    });
    await renderFinishedBookCardPng({
      ...subject,
      imageUrl: INVALID,
    });

    expect(assigned).not.toContain(INVALID);
    expect(assigned.filter((src) => src === BOOK_COVER_PLACEHOLDER_SRC).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(getImageData).not.toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalled();
  });

  it("carrega path local direto", async () => {
    const assigned = stubImage([LOCAL]);
    const { getImageData } = stubCanvas();

    await renderFinishedBookCardPng({ ...subject, imageUrl: LOCAL });

    expect(assigned).toEqual([LOCAL]);
    expect(getImageData).toHaveBeenCalled();
  });

  it("falha o cartão inteiro em SecurityError de getImageData ou toBlob", async () => {
    stubImage([AMAZON_PROXY]);
    stubCanvas({ imageDataError: true });
    await expect(renderFinishedBookCardPng(subject)).rejects.toMatchObject({
      name: "SecurityError",
    });

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    stubImage([AMAZON_PROXY]);
    stubCanvas({ blobError: true });
    await expect(renderFinishedBookCardPng(subject)).rejects.toMatchObject({
      name: "SecurityError",
    });
  });
});
