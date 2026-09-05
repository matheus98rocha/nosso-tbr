import { describe, expect, it } from "vitest";

import type { BookDomain } from "@/types/books.types";

import { selectNextReadingBook } from "./selectNextReadingBook";

function makeBook(
  overrides: Partial<BookDomain> & { id: string; title: string },
): BookDomain {
  return {
    author: "Autor",
    authorId: "author-1",
    chosen_by: "user-1",
    pages: 100,
    status: "planned",
    readerIds: ["user-1"],
    readersDisplay: "Matheus",
    start_date: null,
    planned_start_date: "2026-09-10",
    end_date: null,
    gender: null,
    image_url: "",
    user_id: "user-1",
    is_reread: false,
    is_favorite: false,
    ...overrides,
  };
}

describe("selectNextReadingBook", () => {
  describe("RN67 / seleção e desempate", () => {
    it("retorna null quando a lista está vazia", () => {
      expect(selectNextReadingBook([])).toBeNull();
    });

    it("filtra livros sem planned_start_date", () => {
      const selected = selectNextReadingBook([
        makeBook({
          id: "a",
          title: "Sem data",
          planned_start_date: null,
        }),
        makeBook({
          id: "b",
          title: "Com data",
          planned_start_date: "2026-04-01",
        }),
        makeBook({
          id: "c",
          title: "Undefined",
          planned_start_date: undefined,
        }),
      ]);

      expect(selected?.id).toBe("b");
    });

    it("exclui reading e not_started sem data", () => {
      expect(
        selectNextReadingBook([
          makeBook({
            id: "1",
            title: "A",
            status: "reading",
            planned_start_date: "2026-01-01",
          }),
          makeBook({
            id: "2",
            title: "B",
            status: "not_started",
            planned_start_date: null,
          }),
        ]),
      ).toBeNull();
    });

    it("exclui paused, abandoned e finished mesmo com planned_start_date", () => {
      expect(
        selectNextReadingBook([
          makeBook({
            id: "p",
            title: "Pausado",
            status: "paused",
            planned_start_date: "2026-01-01",
          }),
          makeBook({
            id: "a",
            title: "Abandonado",
            status: "abandoned",
            planned_start_date: "2026-01-02",
          }),
          makeBook({
            id: "f",
            title: "Finalizado",
            status: "finished",
            planned_start_date: "2026-01-03",
          }),
        ]),
      ).toBeNull();
    });

    it("escolhe a menor planned_start_date incluindo atrasados", () => {
      const selected = selectNextReadingBook([
        makeBook({
          id: "future",
          title: "Futuro",
          status: "planned",
          planned_start_date: "2026-09-20",
        }),
        makeBook({
          id: "overdue",
          title: "Atrasado",
          status: "not_started",
          planned_start_date: "2026-08-01",
        }),
        makeBook({
          id: "later",
          title: "Depois",
          planned_start_date: "2026-10-01",
        }),
      ]);

      expect(selected?.id).toBe("overdue");
    });

    it("em empate de data desempatá por title ASC", () => {
      const selected = selectNextReadingBook([
        makeBook({ id: "z", title: "Zebra", planned_start_date: "2026-09-10" }),
        makeBook({ id: "a", title: "Alpha", planned_start_date: "2026-09-10" }),
        makeBook({ id: "m", title: "Moby", planned_start_date: "2026-09-10" }),
      ]);

      expect(selected?.id).toBe("a");
      expect(selected?.title).toBe("Alpha");
    });

    it("em empate de data e title desempatá por id ASC", () => {
      const selected = selectNextReadingBook([
        makeBook({ id: "book-c", title: "Mesmo", planned_start_date: "2026-09-10" }),
        makeBook({ id: "book-a", title: "Mesmo", planned_start_date: "2026-09-10" }),
        makeBook({ id: "book-b", title: "Mesmo", planned_start_date: "2026-09-10" }),
      ]);

      expect(selected?.id).toBe("book-a");
    });
  });
});
