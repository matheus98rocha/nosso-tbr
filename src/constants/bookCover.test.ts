import { describe, expect, it } from "vitest";

import {
  BOOK_COVER_PLACEHOLDER_SRC,
  isAllowedBookCoverUrl,
  isPlaceholderBookCoverSrc,
  isRegisteredBookCoverUrl,
  resolveBookCoverUrl,
} from "./bookCover";

describe("bookCover", () => {
  it("aceita hosts de imagem permitidos", () => {
    expect(
      isAllowedBookCoverUrl(
        "https://m.media-amazon.com/images/I/81abc.jpg",
      ),
    ).toBe(true);
    expect(
      isAllowedBookCoverUrl(
        "https://images-na.ssl-images-amazon.com/images/I/81abc.jpg",
      ),
    ).toBe(true);
    expect(
      isAllowedBookCoverUrl("https://books.google.com/books/content?id=abc"),
    ).toBe(true);
    expect(
      isAllowedBookCoverUrl(
        "https://covers.openlibrary.org/b/id/12345-L.jpg",
      ),
    ).toBe(true);
    expect(isAllowedBookCoverUrl("/book-cover-placeholder.svg")).toBe(true);
  });

  it("rejeita URLs de página de produto e hosts não configurados", () => {
    expect(
      isAllowedBookCoverUrl(
        "https://www.amazon.com.br/Sem-esperanca/dp/B09X24N1H4",
      ),
    ).toBe(false);
    expect(isAllowedBookCoverUrl("https://example.com/cover.jpg")).toBe(false);
    expect(isAllowedBookCoverUrl("http://m.media-amazon.com/images/I/x.jpg")).toBe(
      false,
    );
    expect(isAllowedBookCoverUrl("//evil.example/cover.jpg")).toBe(false);
  });

  it("resolve capa padrão para URL vazia ou inválida", () => {
    expect(resolveBookCoverUrl(null)).toBe(BOOK_COVER_PLACEHOLDER_SRC);
    expect(resolveBookCoverUrl("")).toBe(BOOK_COVER_PLACEHOLDER_SRC);
    expect(resolveBookCoverUrl("   ")).toBe(BOOK_COVER_PLACEHOLDER_SRC);
    expect(
      resolveBookCoverUrl("https://www.amazon.com.br/dp/B09X24N1H4"),
    ).toBe(BOOK_COVER_PLACEHOLDER_SRC);
  });

  it("preserva URL válida", () => {
    const url = "https://m.media-amazon.com/images/I/81abc.jpg";
    expect(resolveBookCoverUrl(url)).toBe(url);
  });

  it("reconhece o placeholder mesmo com query ou path absoluto", () => {
    expect(isPlaceholderBookCoverSrc(BOOK_COVER_PLACEHOLDER_SRC)).toBe(true);
    expect(isPlaceholderBookCoverSrc("/book-cover-placeholder.svg?v=1")).toBe(
      true,
    );
    expect(
      isPlaceholderBookCoverSrc(
        "https://app.example/book-cover-placeholder.svg",
      ),
    ).toBe(true);
    expect(
      isPlaceholderBookCoverSrc("https://m.media-amazon.com/images/I/81abc.jpg"),
    ).toBe(false);
  });

  it("só aceita capa cadastrada remota, nunca placeholder nem path local", () => {
    expect(
      isRegisteredBookCoverUrl("https://m.media-amazon.com/images/I/81abc.jpg"),
    ).toBe(true);
    expect(isRegisteredBookCoverUrl(BOOK_COVER_PLACEHOLDER_SRC)).toBe(false);
    expect(isRegisteredBookCoverUrl("/book-cover-placeholder.svg?v=1")).toBe(
      false,
    );
    expect(isRegisteredBookCoverUrl("/x.svg")).toBe(false);
    expect(isRegisteredBookCoverUrl(null)).toBe(false);
    expect(isRegisteredBookCoverUrl("")).toBe(false);
    expect(isRegisteredBookCoverUrl("https://example.com/cover.jpg")).toBe(
      false,
    );
    expect(isRegisteredBookCoverUrl(undefined)).toBe(false);
    expect(
      isRegisteredBookCoverUrl("  https://m.media-amazon.com/images/I/81abc.jpg  "),
    ).toBe(true);
    expect(
      isRegisteredBookCoverUrl("http://m.media-amazon.com/images/I/81abc.jpg"),
    ).toBe(false);
    expect(
      isPlaceholderBookCoverSrc("/book-cover-placeholder.svg#cover"),
    ).toBe(true);
  });
});
