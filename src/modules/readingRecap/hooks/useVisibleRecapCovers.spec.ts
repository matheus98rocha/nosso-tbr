import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapImageCover } from "../types";
import { useVisibleRecapCovers } from "./useVisibleRecapCovers";

const AMAZON = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_B = "https://m.media-amazon.com/images/I/81def.jpg";
const LOCAL = "/x.svg";

function cover(
  bookId: string,
  title: string,
  src: string,
): RecapImageCover {
  return { bookId, title, src };
}

describe("useVisibleRecapCovers", () => {
  it("mantém todos os slots, inclusive placeholder, e troca só o src da capa que falhou", () => {
    const { result } = renderHook(() =>
      useVisibleRecapCovers([
        cover("a", "Amazon", AMAZON),
        cover("p", "Placeholder", BOOK_COVER_PLACEHOLDER_SRC),
        cover("l", "Local", LOCAL),
        cover("b", "Amazon B", AMAZON_B),
      ]),
    );

    expect(result.current.visibleCovers).toEqual([
      cover("a", "Amazon", AMAZON),
      cover("p", "Placeholder", BOOK_COVER_PLACEHOLDER_SRC),
      cover("l", "Local", LOCAL),
      cover("b", "Amazon B", AMAZON_B),
    ]);

    act(() => {
      result.current.handleCoverError("a");
    });

    expect(result.current.visibleCovers).toEqual([
      cover("a", "Amazon", BOOK_COVER_PLACEHOLDER_SRC),
      cover("p", "Placeholder", BOOK_COVER_PLACEHOLDER_SRC),
      cover("l", "Local", LOCAL),
      cover("b", "Amazon B", AMAZON_B),
    ]);
    expect(result.current.visibleCovers).toHaveLength(4);

    act(() => {
      result.current.handleCoverError("b");
    });

    expect(result.current.visibleCovers.map((item) => item.src)).toEqual([
      BOOK_COVER_PLACEHOLDER_SRC,
      BOOK_COVER_PLACEHOLDER_SRC,
      LOCAL,
      BOOK_COVER_PLACEHOLDER_SRC,
    ]);
    expect(result.current.visibleCovers.map((item) => item.bookId)).toEqual([
      "a",
      "p",
      "l",
      "b",
    ]);
  });

  it("volta a mostrar a capa original quando a lista muda", () => {
    const { result, rerender } = renderHook(
      ({ covers }) => useVisibleRecapCovers(covers),
      {
        initialProps: {
          covers: [cover("a", "Amazon", AMAZON), cover("b", "B", AMAZON_B)],
        },
      },
    );

    act(() => {
      result.current.handleCoverError("a");
    });
    expect(result.current.visibleCovers[0]?.src).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );

    rerender({
      covers: [cover("a", "Amazon", AMAZON)],
    });
    expect(result.current.visibleCovers).toEqual([
      cover("a", "Amazon", AMAZON),
    ]);
  });
});
