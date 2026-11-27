import { describe, expect, it } from "vitest";

import type { FocusBook } from "../../types/focus.types";
import { buildFocusFinishedBookPayload } from "./buildFocusFinishedBookPayload";

const book: FocusBook = {
  id: "book-1",
  title: "Livro de teste",
  author: "Autora",
  authorIds: ["author-1"],
  imageUrl: "https://example.com/capa.jpg",
  pages: 200,
  currentPage: 200,
  readerIds: ["user-1"],
  chosenBy: "user-1",
  userId: "user-1",
  startDate: "2026-01-01",
  gender: "Ficção",
  isReread: false,
  status: "reading",
};

describe("buildFocusFinishedBookPayload", () => {
  it("monta o payload completo usado pela regra de conclusão", () => {
    const payload = buildFocusFinishedBookPayload(book);

    expect(payload).toEqual({
      title: book.title,
      pages: book.pages,
      readers: ["user-1"],
      base_readers: ["user-1"],
      chosen_by: book.chosenBy,
      user_id: book.userId,
      author_ids: ["author-1"],
      start_date: book.startDate,
      end_date: null,
      planned_start_date: null,
      gender: book.gender,
      image_url: book.imageUrl,
      status: "finished",
      is_reread: false,
    });
  });

  it("não altera os arrays originais do livro", () => {
    const payload = buildFocusFinishedBookPayload(book);

    payload.readers.push("user-2");

    expect(book.readerIds).toEqual(["user-1"]);
  });
});
