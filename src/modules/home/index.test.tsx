import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClientHome from "./index";

vi.mock("@/modules/home/hooks/useHome", () => ({
  useHome: vi.fn(() => ({
    allBooks: { data: [], total: 0 },
    isLoadingAllBooks: false,
    isFetched: true,
    isError: false,
    handleClearAllFilters: vi.fn(),
    filters: { year: undefined },
    currentPage: 0,
    setCurrentPage: vi.fn(),
    activeStatuses: [],
    handleToggleStatus: vi.fn(),
    handleSetYear: vi.fn(),
    canClear: false,
    activeFilterLabels: [],
    totalPages: 0,
    handleToggleMyBooks: vi.fn(),
    handleSetAllBooks: vi.fn(),
    handleSetJointReading: vi.fn(),
    handleToggleReader: vi.fn(),
    isMyBooksActive: false,
    isAllBooksActive: true,
    isLoggedIn: true,
    checkIsUserActive: vi.fn(() => false),
    readers: [],
  })),
}));

type UserStoreState = {
  isLoggingOut: boolean;
};

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: UserStoreState) => unknown) =>
    selector({ isLoggingOut: false }),
  ),
}));

vi.mock("@/hooks/useModal", () => ({
  useModal: vi.fn(() => ({ isOpen: false, setIsOpen: vi.fn() })),
}));

vi.mock("@/modules/bookUpsert/bookUpsert", () => ({
  BookUpsert: () => null,
}));

vi.mock("../shelves/components/createEditBookshelves/createEditBookshelves", () => ({
  CreateEditBookshelves: () => null,
}));

vi.mock("../../components/listGrid/listGrid", () => ({
  ListGrid: () => <div>list-grid</div>,
}));

vi.mock("@/components/bookCard/bookCard", () => ({
  BookCard: () => <div>book-card</div>,
}));

vi.mock("@/components/pagintation/pagination", () => ({
  default: () => <div>pagination</div>,
}));

vi.mock("@/components/statusFilterChips/statusFilterChips", () => ({
  StatusFilterChips: () => <div>status-chips</div>,
}));

vi.mock("@/components/yearFilterChips/yearFilterChips", () => ({
  YearFilterChips: () => <div>year-chips</div>,
}));

describe("ClientHome empty social state", () => {
  it("exibe mensagem amigável e CTA para perfil quando não há livros na rede", () => {
    render(<ClientHome />);

    expect(
      screen.getByText("Você ainda não tem livros na sua rede"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Siga novos amigos para descobrir e acompanhar os livros deles."),
    ).toBeInTheDocument();

    const profileLink = screen.getByRole("link", { name: /Ir para perfil/i });
    expect(profileLink).toHaveAttribute("href", "/profile");
  });
});
