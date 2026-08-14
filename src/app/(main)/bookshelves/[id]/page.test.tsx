import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookshelvesPage from "./page";

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

vi.mock("@/modules/bookshelves/components/BookshelfBooksSortableGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="bookshelf-sortable-grid" />,
}));

function renderBookshelfDetailPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<BookshelvesPage />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("BookshelvesPage [id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getShelfById.mockResolvedValue({
      id: "shelf-1",
      name: "Coleção principal",
    });
    getBooksFromShelf.mockResolvedValue([]);
    presetNextNavigationBookshelfDetail("shelf-1");
  });

  it("consulta meta e livros da estante para o id da rota (RN45 fluxo leitura)", async () => {
    const { container } = renderBookshelfDetailPage();

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass("max-w-7xl");

    await screen.findByText("Coleção principal");
    expect(screen.getByText("Livros na estante")).toBeInTheDocument();

    await waitFor(() => {
      expect(getShelfById).toHaveBeenCalledWith("shelf-1");
    });
    await waitFor(() => {
      expect(getBooksFromShelf).toHaveBeenCalledWith("shelf-1");
    });
  });
});
