import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ClientBookshelves from "./index";
import type { BookDomain } from "@/types/books.types";
import { presetNextNavigationBookshelfDetail } from "@/test";

const { mockBook } = vi.hoisted(() => {
  const mockBook: BookDomain = {
    id: "book-edit-shelf-1",
    title: "Livro na estante",
    author: "Autor",
    pages: 100,
    status: "reading",
    readerIds: ["user-1"],
    readersDisplay: "User",
    chosen_by: "user-1",
    start_date: null,
    end_date: null,
    gender: null,
    image_url: "",
    user_id: "user-1",
    is_reread: false,
    is_favorite: false,
  };

  return { mockBook };
});

vi.mock("./hooks/useBookshelfBooks", () => ({
  useBookshelfBooks: vi.fn(() => ({
    data: [mockBook],
    isLoading: false,
    isError: false,
    isSuccess: true,
    isFetched: true,
  })),
}));

vi.mock("./hooks/useBookshelfMeta", () => ({
  useBookshelfMeta: vi.fn(() => ({
    data: { id: "shelf-1", name: "Coleção principal" },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("./hooks/useBookshelfBookOrder", () => ({
  useBookshelfBookOrder: vi.fn(() => ({
    applyReorder: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("./hooks/useBookshelfSort", () => ({
  useBookshelfSort: vi.fn(() => ({
    sort: undefined,
    sortedBooks: [mockBook],
    isSortActive: false,
    handleSetSort: vi.fn(),
  })),
}));

vi.mock("@/services/bookFavorites/hooks/useBookFavoriteIds", () => ({
  useBookFavoriteIds: vi.fn(() => ({
    favoriteIdSet: new Set<string>(),
  })),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(
    (selector: (state: { user: { id: string } | null }) => unknown) =>
      selector({ user: { id: "user-1" } }),
  ),
}));

vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  const React = await import("react");

  return {
    ...actual,
    useModal: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return {
        isOpen,
        setIsOpen,
        open: () => setIsOpen(true),
      };
    },
  };
});

vi.mock("@/modules/bookUpsert", () => ({
  BookUpsert: ({
    isBookFormOpen,
    bookData,
  }: {
    isBookFormOpen: boolean;
    bookData?: BookDomain;
  }) => {
    if (!isBookFormOpen || !bookData) {
      return null;
    }

    return (
      <div data-testid="edit-book-upsert">{bookData.id}</div>
    );
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./components/BookshelfBooksSortableGrid", () => ({
  __esModule: true,
  default: ({
    onEditBook,
  }: {
    onEditBook?: (book: BookDomain) => void;
  }) => (
    <button type="button" onClick={() => onEditBook?.(mockBook)}>
      Editar livro da estante
    </button>
  ),
}));

function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

describe("ClientBookshelves BookUpsert lift", () => {
  beforeEach(() => {
    presetNextNavigationBookshelfDetail("shelf-1");
  });

  it("opens edit BookUpsert with selected book when grid triggers onEditBook", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ClientBookshelves />);

    expect(screen.queryByTestId("edit-book-upsert")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Editar livro da estante" }),
    );

    expect(screen.getByTestId("edit-book-upsert")).toHaveTextContent(
      "book-edit-shelf-1",
    );
  });
});
