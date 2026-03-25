import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookService } from "./books.service";

const buildMockBuilder = () => ({
  withReaders: vi.fn().mockReturnThis(),
  withStatus: vi.fn().mockReturnThis(),
  withGender: vi.fn().mockReturnThis(),
  withYear: vi.fn().mockReturnThis(),
  withSearchTerm: vi.fn().mockReturnThis(),
  withId: vi.fn().mockReturnThis(),
  withAuthor: vi.fn().mockReturnThis(),
  withUserRelationship: vi.fn().mockReturnThis(),
  withUser: vi.fn().mockReturnThis(),
  withDefaultOrdering: vi.fn().mockReturnThis(),
  withPagination: vi.fn().mockReturnThis(),
  build: vi.fn(),
});

let builderInstance = buildMockBuilder();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

vi.mock("./bookQuery.builder", () => ({
  BookQueryBuilder: vi.fn(function MockBookQueryBuilder() {
    return builderInstance;
  }),
}));

vi.mock("@/services/books/books.mapper", () => ({
  BookMapper: {
    toDomain: vi.fn((book) => book),
  },
}));

describe("BookService.getAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builderInstance = buildMockBuilder();
    builderInstance.build.mockResolvedValue({
      data: [{ id: "1", readers: ["user-1"], chosen_by: "user-1" }],
      error: null,
      count: 1,
    });
  });

  it('returns only user-related books when "Todos" is active', async () => {
    const service = new BookService();

    await service.getAll({
      relationshipUserValues: ["user-1", "Matheus"],
      filters: { readers: [], status: [], gender: [] },
    });

    expect(builderInstance.withUserRelationship).toHaveBeenCalledWith([
      "user-1",
      "Matheus",
    ]);
    expect(builderInstance.withUser).not.toHaveBeenCalledWith("user-1");
  });

  it("returns all books when no filter is applied", async () => {
    const service = new BookService();

    await service.getAll({
      filters: { readers: [], status: [], gender: [] },
    });

    expect(builderInstance.withUserRelationship).toHaveBeenCalledWith(undefined);
    expect(builderInstance.withUser).toHaveBeenCalledWith(undefined);
  });
});
