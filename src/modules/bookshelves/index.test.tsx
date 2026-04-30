import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ClientBookshelves from "./index";

import { presetNextNavigationBookshelfDetail } from "@/test";

const { getShelfById, getBooksFromShelf } = vi.hoisted(() => ({
  getShelfById: vi
    .fn()
    .mockResolvedValue({ id: "shelf-1", name: "Coleção principal" }),
  getBooksFromShelf: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  BookshelfService: vi.fn(function BookshelfServiceCtor() {
    return {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getShelfById,
      addBookToShelf: vi.fn(),
    };
  }),
  fetchBookShelves: vi.fn(),
}));

vi.mock("@/modules/bookshelves/services/bookshelvesBooks.service", () => ({
  BookshelfServiceBooks: vi.fn(function BookshelfServiceBooksCtor() {
    return {
      getBooksFromShelf,
      reorderBooksOnShelf: vi.fn(),
      removeBookFromShelf: vi.fn(),
    };
  }),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(() => true),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./components/BookshelfBooksSortableGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="bookshelf-sortable-grid" />,
}));

function renderClientBookshelves() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<ClientBookshelves />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("ClientBookshelves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getShelfById.mockResolvedValue({
      id: "shelf-1",
      name: "Coleção principal",
    });
    getBooksFromShelf.mockResolvedValue([]);
    presetNextNavigationBookshelfDetail("shelf-1");
  });

  it("consulta nome da estante e lista de livros via serviços", async () => {
    renderClientBookshelves();

    await screen.findByText("Livros na estante");
    await screen.findByText("Coleção principal");

    await waitFor(() => {
      expect(getShelfById).toHaveBeenCalledWith("shelf-1");
    });
    await waitFor(() => {
      expect(getBooksFromShelf).toHaveBeenCalledWith("shelf-1");
    });
  });
});
