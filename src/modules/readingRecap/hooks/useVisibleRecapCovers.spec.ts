import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import { useVisibleRecapCovers } from "./useVisibleRecapCovers";

const AMAZON = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_B = "https://m.media-amazon.com/images/I/81def.jpg";

describe("useVisibleRecapCovers", () => {
  it("esconde placeholder, path local e capa cujo load falhou", () => {
    const { result } = renderHook(() =>
      useVisibleRecapCovers([
        AMAZON,
        BOOK_COVER_PLACEHOLDER_SRC,
        "/x.svg",
        AMAZON_B,
      ]),
    );

    expect(result.current.visibleCoverSrcs).toEqual([AMAZON, AMAZON_B]);

    act(() => {
      result.current.handleCoverError(AMAZON);
    });

    expect(result.current.visibleCoverSrcs).toEqual([AMAZON_B]);

    act(() => {
      result.current.handleCoverError(AMAZON_B);
    });

    expect(result.current.visibleCoverSrcs).toEqual([]);
  });

  it("volta a mostrar as capas quando a lista muda", () => {
    const { result, rerender } = renderHook(
      ({ srcs }) => useVisibleRecapCovers(srcs),
      { initialProps: { srcs: [AMAZON, AMAZON_B] } },
    );

    act(() => {
      result.current.handleCoverError(AMAZON);
    });
    expect(result.current.visibleCoverSrcs).toEqual([AMAZON_B]);

    rerender({ srcs: [AMAZON] });
    expect(result.current.visibleCoverSrcs).toEqual([AMAZON]);
  });
});
