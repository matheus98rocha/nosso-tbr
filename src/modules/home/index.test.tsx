import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientHome from "./index";
import { useHome } from "@/modules/home/hooks/useHome";

const mockSetBookFormOpen = vi.fn();

const { baseUseHome } = vi.hoisted(() => ({
  baseUseHome: {
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

vi.mock("@/modules/bookUpsert", () => ({
  BookUpsert: () => null,
}));

vi.mock(
  "../shelves/components/createEditBookshelves",
  () => ({
    CreateEditBookshelves: () => null,
  }),
);

vi.mock("../../components/listGrid", () => ({
  ListGrid: () => <div>list-grid</div>,
}));

vi.mock("@/components/bookCard", () => ({
  BookCard: () => <div>book-card</div>,
}));

vi.mock("@/components/pagintation/pagination", () => ({
  default: () => <div>pagination</div>,
}));

vi.mock("@/components/statusFilterChips", () => ({
  StatusFilterChips: () => <div>status-chips</div>,
}));

vi.mock("@/components/yearFilterChips", () => ({
  YearFilterChips: () => <div>year-chips</div>,
}));

describe("ClientHome book suggestions (empty network)", () => {
  beforeEach(() => {
    mockSetBookFormOpen.mockClear();
    vi.mocked(useHome).mockImplementation(() => ({ ...baseUseHome }));
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
    } as unknown as ReturnType<typeof useHome>);

    render(<ClientHome />);

    expect(
      screen.queryByRole("heading", { name: "Ainda não há livros por aqui" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("list-grid")).toBeInTheDocument();
  });
});
