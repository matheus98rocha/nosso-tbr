import { describe, expect, it } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";
import type { BookDomain } from "@/types/books.types";

import { buildAddToLibraryPayload } from "./buildAddToLibraryPayload";

const book: BookDomain = {
  id: "other-book",
  title: "Memórias Póstumas",
  author: "Machado de Assis",
  authorId: "author-1",
  chosen_by: "other-user",
  pages: 160,
  readerIds: ["other-user"],
  readersDisplay: "Outra pessoa",
  status: "finished",
  start_date: "2024-01-01",
  planned_start_date: "2024-01-01",
  end_date: "2024-02-01",
  gender: "romance",
  image_url: "https://m.media-amazon.com/images/I/cover.jpg",
  user_id: "other-user",
  is_reread: true,
  is_favorite: false,
};

describe("buildAddToLibraryPayload", () => {
  it("copia metadados e cria cadastro próprio em not_started", () => {
    expect(buildAddToLibraryPayload(book, "user-123")).toEqual({
      title: "Memórias Póstumas",
      pages: 160,
      readers: ["user-123"],
      chosen_by: "user-123",
      user_id: "user-123",
      author_id: "author-1",
      start_date: null,
      end_date: null,
      planned_start_date: null,
      gender: "romance",
      image_url: "https://m.media-amazon.com/images/I/cover.jpg",
      status: "not_started",
      is_reread: false,
    });
  });

  it("omite capa local ou placeholder para passar na validação de criação", () => {
    expect(
      buildAddToLibraryPayload(
        { ...book, image_url: BOOK_COVER_PLACEHOLDER_SRC },
        "user-123",
      ).image_url,
    ).toBe("");
    expect(
      buildAddToLibraryPayload(
        { ...book, image_url: "https://example.com/x.jpg" },
        "user-123",
      ).image_url,
    ).toBe("");
  });
});
