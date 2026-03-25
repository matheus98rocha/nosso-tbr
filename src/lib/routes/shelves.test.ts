import { SHELVES_LIST_PATH, getBookshelfBooksPath } from "./shelves";

describe("shelves routes", () => {
  it("exports the shelves list path", () => {
    expect(SHELVES_LIST_PATH).toBe("/shelves");
  });

  it("builds bookshelf books path from shelf id", () => {
    expect(getBookshelfBooksPath("abc-123")).toBe("/bookshelves/abc-123");
  });
});
