import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapBook } from "../types";
import { useLoadableRecapBooks } from "./useLoadableRecapBooks";

const GOOD = "https://m.media-amazon.com/images/I/good.jpg";
const DEAD = "https://m.media-amazon.com/images/I/dead.jpg";
const LOCAL = "/x.svg";

function book(title: string, imageUrl: string): RecapBook {
  return {
    title,
    endDate: "2026-01-01",
    gender: null,
    imageUrl,
  };
}

function stubImage(succeedFor: string[]) {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(value: string) {
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
}

describe("useLoadableRecapBooks", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("espera o probe e fica só com capas que carregaram", async () => {
    stubImage([GOOD, LOCAL]);
    const { result } = renderHook(() =>
      useLoadableRecapBooks([
        book("Ok", GOOD),
        book("Morto", DEAD),
        book("Local", LOCAL),
      ]),
    );

    expect(result.current.isProbing).toBe(true);

    await waitFor(() => {
      expect(result.current.isProbing).toBe(false);
    });

    expect(result.current.loadableBooks.map((item) => item.title)).toEqual([
      "Ok",
      "Local",
    ]);
  });

  it("exclui placeholder e host não permitido sem probe", () => {
    const { result } = renderHook(() =>
      useLoadableRecapBooks([
        book("Placeholder", BOOK_COVER_PLACEHOLDER_SRC),
        book("Host inválido", "https://example.com/cover.jpg"),
      ]),
    );

    expect(result.current.isProbing).toBe(false);
    expect(result.current.loadableBooks).toEqual([]);
  });

  it("marca falha depois e tira o livro da lista", async () => {
    stubImage([GOOD]);
    const { result } = renderHook(() =>
      useLoadableRecapBooks([book("Ok", GOOD)]),
    );

    await waitFor(() => {
      expect(result.current.isProbing).toBe(false);
    });
    expect(result.current.loadableBooks).toHaveLength(1);

    act(() => {
      result.current.markCoverFailed(GOOD);
    });

    expect(result.current.loadableBooks).toEqual([]);
    expect(result.current.isProbing).toBe(false);
  });
});
