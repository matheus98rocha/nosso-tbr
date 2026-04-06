import { beforeEach, describe, expect, it, vi } from "vitest";
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
      relationshipUserValues: [
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
      ],
      filters: { readers: [], status: [], gender: [], view: "todos" },
    });

    expect(builderInstance.withUserRelationship).toHaveBeenCalledWith([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(builderInstance.withUser).not.toHaveBeenCalledWith("user-1");
  });

  it("scopes Todos view to the current user only when they follow nobody (single relationship id)", async () => {
    const soloId = "11111111-1111-4111-8111-111111111111";
    const service = new BookService();

    await service.getAll({
      relationshipUserValues: [soloId],
      filters: { readers: [], status: [], gender: [], view: "todos" },
    });

    expect(builderInstance.withUserRelationship).toHaveBeenCalledWith([soloId]);
  });

  it("returns all books when no filter is applied", async () => {
    const service = new BookService();

    await service.getAll({
      filters: { readers: [], status: [], gender: [], view: "todos" },
    });

    expect(builderInstance.withUserRelationship).toHaveBeenCalledWith(undefined);
    expect(builderInstance.withUser).toHaveBeenCalledWith(undefined);
  });

  it('keeps "planned" status and delegates compatibility guard to query builder', async () => {
    const service = new BookService();

    await service.getAll({
      filters: {
        readers: [],
        status: ["planned"],
        gender: [],
        view: "todos",
      },
    });

    expect(builderInstance.withStatus).toHaveBeenCalledWith(["planned"]);
  });
});
