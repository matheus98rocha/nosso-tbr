import { describe, expect, it } from "vitest";

import type { BookDomain } from "@/types/books.types";

import { mapBooksToRecapBooks } from "./mapBooksToRecapBooks";

function domain(overrides: Partial<BookDomain> = {}): BookDomain {
  return {
    title: "Duna",
    author: "Frank Herbert",
    chosen_by: "user-1",
    pages: 100,
    status: "finished",
    readerIds: ["user-1"],
    readersDisplay: "Ana",
    end_date: "2026-10-07T15:00:00.000Z",
    gender: "science_fiction",
    image_url: "https://m.media-amazon.com/images/I/81abc.jpg",
    user_id: "user-1",
    is_reread: false,
    is_favorite: false,
    ...overrides,
  };
}

describe("mapBooksToRecapBooks", () => {
  it("inclui finished com end_date e usa BookDomain.id", () => {
    expect(mapBooksToRecapBooks([domain({ id: "book-uuid-1" })])).toEqual([
      {
        id: "book-uuid-1",
        title: "Duna",
        endDate: "2026-10-07T15:00:00.000Z",
        gender: "science_fiction",
        imageUrl: "https://m.media-amazon.com/images/I/81abc.jpg",
      },
    ]);
  });

  it("gera id de fallback com título, endDate e imageUrl quando BookDomain.id falta", () => {
    expect(mapBooksToRecapBooks([domain()])).toEqual([
      {
        id: "Duna|2026-10-07T15:00:00.000Z|https://m.media-amazon.com/images/I/81abc.jpg",
        title: "Duna",
        endDate: "2026-10-07T15:00:00.000Z",
        gender: "science_fiction",
        imageUrl: "https://m.media-amazon.com/images/I/81abc.jpg",
      },
    ]);
  });

  it("exclui leitura que não está finished ou sem data de término", () => {
    expect(
      mapBooksToRecapBooks([
        domain({ status: "reading" }),
        domain({ status: "paused" }),
        domain({ status: "abandoned" }),
        domain({ end_date: null }),
      ]),
    ).toEqual([]);
  });

  it("inclui releitura finished no período", () => {
    expect(
      mapBooksToRecapBooks([domain({ is_reread: true, id: "reread-1" })]),
    ).toHaveLength(1);
  });
});
