import { beforeEach, describe, expect, it, vi } from "vitest";

import { syncBookAuthors } from "./syncBookAuthors";

describe("syncBookAuthors", () => {
  const deleteEq = vi.fn();
  const deleteFn = vi.fn(() => ({ eq: deleteEq }));
  const insert = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === "book_authors") {
      return { delete: deleteFn, insert };
    }
    return {};
  });

  beforeEach(() => {
    vi.clearAllMocks();
    deleteEq.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
  });

  it("substitui vínculos em book_authors pelos author_ids informados", async () => {
    const result = await syncBookAuthors(
      { from } as never,
      "book-1",
      ["author-a", "author-b"],
    );

    expect(result.error).toBeNull();
    expect(from).toHaveBeenCalledWith("book_authors");
    expect(deleteFn).toHaveBeenCalled();
    expect(deleteEq).toHaveBeenCalledWith("book_id", "book-1");
    expect(insert).toHaveBeenCalledWith([
      { book_id: "book-1", author_id: "author-a" },
      { book_id: "book-1", author_id: "author-b" },
    ]);
  });

  it("deduplica e ignora ids vazios", async () => {
    await syncBookAuthors({ from } as never, "book-1", [
      "author-a",
      "author-a",
      "",
      " author-b ",
    ]);

    expect(insert).toHaveBeenCalledWith([
      { book_id: "book-1", author_id: "author-a" },
      { book_id: "book-1", author_id: "author-b" },
    ]);
  });

  it("retorna erro quando a lista fica vazia", async () => {
    const result = await syncBookAuthors({ from } as never, "book-1", ["", "  "]);

    expect(result.error).toBe("É necessário ao menos um autor");
    expect(deleteFn).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("propaga erro de delete", async () => {
    deleteEq.mockResolvedValue({ error: { message: "delete failed" } });

    const result = await syncBookAuthors(
      { from } as never,
      "book-1",
      ["author-a"],
    );

    expect(result.error).toBe("delete failed");
    expect(insert).not.toHaveBeenCalled();
  });

  it("propaga erro de insert", async () => {
    insert.mockResolvedValue({ error: { message: "insert failed" } });

    const result = await syncBookAuthors(
      { from } as never,
      "book-1",
      ["author-a"],
    );

    expect(result.error).toBe("insert failed");
  });
});
