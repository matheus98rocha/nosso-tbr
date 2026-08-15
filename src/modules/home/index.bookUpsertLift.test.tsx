import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ClientHome from "./index";
import { useHome } from "@/modules/home/hooks/useHome";
import type { BookDomain } from "@/types/books.types";

const { baseUseHome } = vi.hoisted(() => {
  const mockBook: BookDomain = {
    id: "book-edit-1",
    title: "Livro para editar",
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

  return {
    baseUseHome: {
      allBooks: { data: [mockBook], total: 1 },
    isLoadingAllBooks: false,
    isFetched: true,
    isError: false,
    searchQuery: "",
    updateUrlWithFilters: vi.fn(),
    formattedStatus: "",
    formattedReaders: "",
    formattedGenres: "",
    formattedYear: "",
    handleSearchButtonClick: vi.fn(),
    handleInputBlur: vi.fn(),
    inputRef: { current: null },
    handleOnPressEnter: vi.fn(),
    hasSearchParams: false,
    readersObj: { readers: [], readersDisplay: "" },
    user: null,
    users: [],
    handleClearAllFilters: vi.fn(),
    filters: {
      readers: [],
      status: [],
      gender: [],
      view: "todos" as const,
      year: undefined,
    },
    currentPage: 0,
    setCurrentPage: vi.fn(),
    activeStatuses: [],
    handleToggleStatus: vi.fn(),
    handleSetYear: vi.fn(),
    handleSetSort: vi.fn(),
    canClear: false,
    activeFilterLabels: [],
    totalPages: 0,
    handleToggleMyBooks: vi.fn(),
    handleSetAllBooks: vi.fn(),
    handleSetJointReading: vi.fn(),
    handleSetFollowingFeed: vi.fn(),
    handleToggleReader: vi.fn(),
    isMyBooksActive: false,
    isAllBooksActive: true,
    isFollowingFeedActive: false,
    followingFeedEmpty: false,
    isLoggedIn: true,
    checkIsUserActive: vi.fn(() => false),
    readers: [],
    lockedReaderId: undefined,
    needsExtraReader: false,
    readingProgressBatch: {
      readingBookIds: [],
      progressByBookId: new Map(),
      isLoading: false,
      isError: false,
    },
    },
  };
});

vi.mock("@/modules/home/hooks/useHome", () => ({
  useHome: vi.fn(() => ({ ...baseUseHome })),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(
    (selector: (state: { isLoggingOut: boolean }) => unknown) =>
      selector({ isLoggingOut: false }),
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
    if (!isBookFormOpen) {
      return null;
    }

    if (bookData) {
      return (
        <div data-testid="edit-book-upsert">{bookData.id}</div>
      );
    }

    return <div data-testid="create-book-upsert" />;
  },
}));

vi.mock("../shelves/components/createEditBookshelves", () => ({
  CreateEditBookshelves: () => null,
}));

vi.mock("../../components/listGrid", () => ({
  ListGrid: <T,>({
    items,
    renderItem,
  }: {
    items: T[];
    renderItem: (item: T) => ReactNode;
  }) => <div data-testid="list-grid">{items.map((item) => renderItem(item))}</div>,
}));

vi.mock("@/components/bookCard", () => ({
  BookCard: ({
    book,
    onEditBook,
  }: {
    book: BookDomain;
    onEditBook?: () => void;
  }) => (
    <div>
      <span>{book.title}</span>
      <button type="button" onClick={onEditBook}>
        Editar livro
      </button>
    </div>
  ),
}));

vi.mock("@/modules/home/components/readingNow", () => ({
  default: () => null,
}));

vi.mock("@/components/pagintation/pagination", () => ({
  default: () => null,
}));

vi.mock("@/components/statusFilterChips", () => ({
  StatusFilterChips: () => null,
}));

vi.mock("@/components/yearFilterChips", () => ({
  YearFilterChips: () => null,
}));

vi.mock("@/modules/aiRecommendation", () => ({
  AiRecommendationDialog: () => null,
  AiRecommendationFab: () => null,
}));

vi.mock("@/modules/home/components/collapsibleBookFilters", () => ({
  default: () => null,
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

describe("ClientHome BookUpsert lift", () => {
  beforeEach(() => {
    vi.mocked(useHome).mockImplementation(
      () => ({ ...baseUseHome }) as ReturnType<typeof useHome>,
    );
  });

  it("opens edit BookUpsert with selected book when card triggers onEditBook", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ClientHome />);

    expect(screen.queryByTestId("edit-book-upsert")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar livro" }));

    expect(screen.getByTestId("edit-book-upsert")).toHaveTextContent(
      "book-edit-1",
    );
    expect(screen.queryByTestId("create-book-upsert")).not.toBeInTheDocument();
  });
});
