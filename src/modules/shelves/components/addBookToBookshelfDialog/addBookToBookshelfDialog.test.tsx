import { render } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddBookToBookshelfDialog } from "./addBookToBookshelfDialog";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({
      data: [],
      isLoading: false,
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isPending: false,
    })),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
    })),
  };
});

vi.mock("../bookCombobox", () => ({
  BookCombobox: () => null,
}));

const mockedUseQuery = vi.mocked(useQuery);

const defaultShelf = {
  id: "shelf-1",
  name: "Favoritos",
  bookIdsOnShelf: [],
};

describe("AddBookToBookshelfDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não habilita a query de livros com o diálogo fechado", () => {
    render(
      <AddBookToBookshelfDialog
        isOpen={false}
        onOpenChange={vi.fn()}
        bookshelfe={defaultShelf}
      />,
    );

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("habilita a query de livros com o diálogo aberto", () => {
    render(
      <AddBookToBookshelfDialog
        isOpen
        onOpenChange={vi.fn()}
        bookshelfe={defaultShelf}
      />,
    );

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });
});
