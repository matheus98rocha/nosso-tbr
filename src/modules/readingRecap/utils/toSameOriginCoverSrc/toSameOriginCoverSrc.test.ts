import { describe, expect, it } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import { toSameOriginCoverSrc } from "./toSameOriginCoverSrc";

describe("toSameOriginCoverSrc", () => {
  it("mantém caminho local", () => {
    expect(toSameOriginCoverSrc(BOOK_COVER_PLACEHOLDER_SRC)).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );
  });

  it("proxy same-origin para host de capa permitido", () => {
    const url = "https://m.media-amazon.com/images/I/81abc.jpg";
    expect(toSameOriginCoverSrc(url)).toBe(
      `/api/book-covers?url=${encodeURIComponent(url)}`,
    );
    const openLibrary = "https://covers.openlibrary.org/b/id/8570014-L.jpg";
    expect(toSameOriginCoverSrc(openLibrary)).toBe(
      `/api/book-covers?url=${encodeURIComponent(openLibrary)}`,
    );
  });

  it("cai no placeholder quando o host não é permitido", () => {
    expect(toSameOriginCoverSrc("https://example.com/cover.jpg")).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );
    expect(toSameOriginCoverSrc("//evil.example/cover.jpg")).toBe(
      BOOK_COVER_PLACEHOLDER_SRC,
    );
    expect(
      toSameOriginCoverSrc(
        "https://archive.org/download/l_covers_0008/cover.jpg",
      ),
    ).toBe(BOOK_COVER_PLACEHOLDER_SRC);
  });
});
