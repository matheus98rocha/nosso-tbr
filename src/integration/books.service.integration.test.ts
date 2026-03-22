import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = {
  contains: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn(),
};

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => mockQuery),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { BookService } from "@/services/books/books.service";

describe("BookService integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped books and total on happy path", async () => {
    mockQuery.range.mockResolvedValue({
      data: [
        {
          id: "book-1",
          title: "O Hobbit",
          author: { name: "Tolkien" },
          author_id: "author-1",
          chosen_by: "Matheus",
          pages: 320,
          start_date: "2024-01-10T00:00:00.000Z",
          planned_start_date: "2024-01-01T00:00:00.000Z",
          end_date: "2024-02-01T00:00:00.000Z",
          readers: ["Matheus", "Barbara"],
          gender: "fantasia",
          image_url: "https://example.com/hobbit.jpg",
          user_id: "user-1",
        },
      ],
      count: 1,
      error: null,
    });

    const service = new BookService();

    const result = await service.getAll({
      page: 0,
      pageSize: 8,
      search: "hobbit",
      filters: {
        readers: [],
        status: ["finished"],
        gender: ["fantasia"],
        year: 2024,
        userId: "",
        bookId: "",
        authorId: "",
        myBooks: false,
      },
    });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: "book-1",
      title: "O Hobbit",
      author: "Tolkien",
      status: "finished",
      readers: "Matheus e Barbara",
    });
  });
});
