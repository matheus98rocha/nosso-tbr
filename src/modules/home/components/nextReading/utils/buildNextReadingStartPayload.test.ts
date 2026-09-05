import { afterEach, describe, expect, it, vi } from "vitest";

import type { BookDomain } from "@/types/books.types";

import { buildNextReadingStartPayload } from "./buildNextReadingStartPayload";

const sampleBook: BookDomain & { id: string } = {
  id: "book-1",
  title: "Duna",
  author: "Frank Herbert",
  authorId: "author-1",
  chosen_by: "user-1",
  pages: 688,
  status: "planned",
  readerIds: ["user-1", "user-2"],
  readersDisplay: "Matheus, Ana",
  start_date: null,
  planned_start_date: "2026-09-10",
  end_date: "2026-01-01",
  gender: "fiction",
  image_url: "https://books.google.com/cover.jpg",
  user_id: "user-1",
  is_reread: true,
  is_favorite: false,
};

describe("buildNextReadingStartPayload", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("RN69 / transição Iniciar leitura", () => {
    it("marca status reading e limpa planned_start_date e end_date", () => {
      const payload = buildNextReadingStartPayload(sampleBook);

      expect(payload.status).toBe("reading");
      expect(payload.planned_start_date).toBeNull();
      expect(payload.end_date).toBeNull();
    });

    it("preserva start_date existente", () => {
      const payload = buildNextReadingStartPayload({
        ...sampleBook,
        start_date: "2026-08-01T12:00:00.000Z",
      });

      expect(payload.start_date).toBe("2026-08-01T12:00:00.000Z");
    });

    it("preenche start_date com ISO recente quando start_date é null", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-05T15:00:00.000Z"));

      const payload = buildNextReadingStartPayload(sampleBook);

      expect(payload.start_date).toBe("2026-09-05T15:00:00.000Z");
    });

    it("preenche start_date com ISO recente quando start_date é undefined", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-05T15:00:00.000Z"));

      const payload = buildNextReadingStartPayload({
        ...sampleBook,
        start_date: undefined,
      });

      expect(payload.start_date).toBe("2026-09-05T15:00:00.000Z");
    });

    it("copia campos do livro para o BookCreateValidator", () => {
      const payload = buildNextReadingStartPayload({
        ...sampleBook,
        start_date: "2026-08-01T12:00:00.000Z",
      });

      expect(payload.title).toBe("Duna");
      expect(payload.pages).toBe(688);
      expect(payload.readers).toEqual(["user-1", "user-2"]);
      expect(payload.chosen_by).toBe("user-1");
      expect(payload.user_id).toBe("user-1");
      expect(payload.author_id).toBe("author-1");
      expect(payload.gender).toBe("fiction");
      expect(payload.image_url).toBe("https://books.google.com/cover.jpg");
      expect(payload.is_reread).toBe(true);
    });

    it("normaliza author_id e gender ausentes como string vazia", () => {
      const payload = buildNextReadingStartPayload({
        ...sampleBook,
        authorId: undefined,
        gender: null,
        image_url: "",
        start_date: "2026-08-01T12:00:00.000Z",
      });

      expect(payload.author_id).toBe("");
      expect(payload.gender).toBe("");
      expect(payload.image_url).toBe("");
    });
  });
});
