import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_FILTERS } from "@/constants/keys";
import type { BookDomain } from "@/types/books.types";

import { ReadingRecapService } from "./readingRecap.service";

function domain(overrides: Partial<BookDomain> = {}): BookDomain {
  return {
    title: "Duna",
    author: "Frank Herbert",
    chosen_by: "user-1",
    pages: 100,
    status: "finished",
    readerIds: ["user-1", "user-2"],
    readersDisplay: "Ana, Bruno",
    end_date: "2026-10-07T15:00:00.000Z",
    gender: "science_fiction",
    image_url: "https://m.media-amazon.com/images/I/81abc.jpg",
    user_id: "user-2",
    is_reread: false,
    is_favorite: false,
    ...overrides,
  };
}

describe("ReadingRecapService.getFinishedBooks", () => {
  const getAll = vi.fn();

  beforeEach(() => {
    getAll.mockReset();
  });

  it("busca livros finished do leitor participante, sem filtro de ano da Home", async () => {
    getAll.mockResolvedValueOnce({
      data: [domain(), domain({ status: "reading", title: "Lendo" })],
      total: 2,
    });

    const service = new ReadingRecapService({
      getAll,
    } as never);

    const books = await service.getFinishedBooks("user-1");

    expect(getAll).toHaveBeenCalledWith({
      relationshipUserValues: ["user-1"],
      filters: { ...INITIAL_FILTERS, status: ["finished"] },
      page: 0,
      pageSize: 100,
    });
    expect(books).toEqual([
      {
        title: "Duna",
        endDate: "2026-10-07T15:00:00.000Z",
        gender: "science_fiction",
        imageUrl: "https://m.media-amazon.com/images/I/81abc.jpg",
      },
    ]);
  });

  it("pagina até carregar todos os finished", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      domain({ title: `Livro ${index}` }),
    );
    getAll
      .mockResolvedValueOnce({ data: firstPage, total: 101 })
      .mockResolvedValueOnce({
        data: [domain({ title: "Último" })],
        total: 101,
      });

    const service = new ReadingRecapService({
      getAll,
    } as never);

    const books = await service.getFinishedBooks("user-1");

    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ page: 1, pageSize: 100 }),
    );
    expect(books).toHaveLength(101);
  });
});
