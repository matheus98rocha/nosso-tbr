import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientHome from "./index";
import { useHome } from "@/modules/home/hooks/useHome";
import { useUserStore } from "@/stores/userStore";

const mockSetBookFormOpen = vi.fn();

const { baseUseHome } = vi.hoisted(() => ({
  baseUseHome: {
    allBooks: { data: [], total: 0 },
    isLoadingAllBooks: false,
    isBooksListAwaitingData: false,
    showEmptyReadingSuggestions: true,
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
  },
}));

vi.mock("@/modules/home/hooks/useHome", () => ({
  useHome: vi.fn(() => ({ ...baseUseHome })),
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
  useModal: vi.fn(() => ({ isOpen: false, setIsOpen: mockSetBookFormOpen })),
}));

vi.mock("@/modules/bookUpsert/bookUpsert", () => ({
  BookUpsert: () => null,
}));

vi.mock(
  "../shelves/components/createEditBookshelves/createEditBookshelves",
  () => ({
    CreateEditBookshelves: () => null,
  }),
);

vi.mock("../../components/listGrid/listGrid", () => ({
  ListGrid: ({ isLoading }: { isLoading?: boolean }) => (
    <div data-testid="list-grid" data-loading={isLoading ? "true" : "false"}>
      list-grid
    </div>
  ),
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

describe("ClientHome book suggestions (empty network)", () => {
  beforeEach(() => {
    mockSetBookFormOpen.mockClear();
    vi.mocked(useHome).mockImplementation(() => ({ ...baseUseHome }));
    vi.mocked(useUserStore).mockImplementation(
      (selector: (state: UserStoreState) => unknown) =>
        selector({ isLoggingOut: false }),
    );
  });

  it("shows guidance copy and both paths when logged-in Todos view has zero books", () => {
    render(<ClientHome />);

    expect(
      screen.getByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Pode ser combinação dos filtros ou ainda pouca atividade na sua rede/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Conectar com amigos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Registrar suas leituras" }),
    ).toBeInTheDocument();

    const profileLink = screen.getByRole("link", {
      name: "Abrir perfil para encontrar e seguir amigos",
    });
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("opens add-book flow when choosing Registrar suas leituras CTA", async () => {
    const user = userEvent.setup();
    render(<ClientHome />);

    await user.click(
      screen.getByRole("button", {
        name: "Abrir formulário para adicionar livros à sua lista",
      }),
    );

    expect(mockSetBookFormOpen).toHaveBeenCalledWith(true);
  });

  it("renders list grid when there are books (no suggestion panel)", () => {
    vi.mocked(useHome).mockReturnValueOnce({
      ...baseUseHome,
      allBooks: { data: [{ id: "b1" } as never], total: 1 },
      showEmptyReadingSuggestions: false,
    } as unknown as ReturnType<typeof useHome>);

    render(<ClientHome />);

    expect(
      screen.queryByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("list-grid")).toBeInTheDocument();
  });


  it("keeps suggestion panel as default empty return even with active filters", () => {
    vi.mocked(useHome).mockReturnValueOnce({
      ...baseUseHome,
      activeFilterLabels: ["Ano: 2024"],
      showEmptyReadingSuggestions: true,
      allBooks: { data: [], total: 0 },
    } as unknown as ReturnType<typeof useHome>);

    render(<ClientHome />);

    expect(
      screen.getByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("list-grid")).not.toBeInTheDocument();
  });

  it("does not show the suggestion panel while the books list is awaiting data", () => {
    vi.mocked(useHome).mockReturnValueOnce({
      ...baseUseHome,
      isBooksListAwaitingData: true,
      showEmptyReadingSuggestions: false,
    } as unknown as ReturnType<typeof useHome>);

    render(<ClientHome />);

    expect(
      screen.queryByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("list-grid")).toHaveAttribute(
      "data-loading",
      "true",
    );
  });

  it("hides the suggestion panel during logout even if the hook would show empty suggestions", () => {
    vi.mocked(useUserStore).mockImplementation((selector) =>
      selector({ isLoggingOut: true } as never),
    );

    render(<ClientHome />);

    expect(
      screen.queryByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("list-grid")).toHaveAttribute(
      "data-loading",
      "true",
    );
  });
});
