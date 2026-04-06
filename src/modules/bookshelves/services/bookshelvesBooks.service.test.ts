import { describe, expect, it, vi, beforeEach } from "vitest";
import { BookshelfServiceBooks } from "./bookshelvesBooks.service";
import { apiJson } from "@/lib/api/clientJsonFetch";

vi.mock("@/lib/api/clientJsonFetch", () => ({
  apiJson: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  })),
}));

describe("BookshelfServiceBooks.reorderBooksOnShelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs bookIds to the reorder API", async () => {
    vi.mocked(apiJson).mockResolvedValue({ ok: true });
    const svc = new BookshelfServiceBooks();
    const ids = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ];
    await svc.reorderBooksOnShelf("shelf-1", ids);
    expect(apiJson).toHaveBeenCalledWith(
      "/api/shelves/shelf-1/books/reorder",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ bookIds: ids }),
      }),
    );
  });
});
