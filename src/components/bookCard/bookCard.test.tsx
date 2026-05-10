import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { BookDomain } from "@/types/books.types";

import { BookCard } from "./bookCard";
import { useBookCard } from "./hooks/useBookCard";

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  },
}));

vi.mock("@/modules/bookUpsert", () => ({
  BookUpsert: () => null,
}));

vi.mock("./components/addBookToShelf", () => ({
  AddBookToShelf: () => null,
}));

vi.mock("@/components/confirmDialog", () => ({
  ConfirmDialog: ({
    title,
    description,
    open,
  }: {
    title: string;
    description: string;
    open: boolean;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    ) : null,
}));

vi.mock("./hooks/useBookCard");

const mockedUseBookCard = vi.mocked(useBookCard);

const baseBook: BookDomain = {
  id: "book-1",
  title: "Memórias Póstumas",
  author: "Machado de Assis",
  chosen_by: "11111111-1111-4111-8111-111111111111",
  pages: 160,
  readerIds: ["11111111-1111-4111-8111-111111111111"],
  readersDisplay: "Eu",
  status: "reading",
  planned_start_date: null,
  end_date: null,
  gender: null,
  image_url: "/book-cover-placeholder.svg",
  user_id: "11111111-1111-4111-8111-111111111111",
  is_reread: false,
  is_favorite: false,
};

function modalState(isOpen: boolean) {
  const setIsOpen = vi.fn();
  return {
    isOpen,
    setIsOpen,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  };
}

function tapStub() {
  return {
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleClick: vi.fn(),
  };
}

type ModalMock = ReturnType<typeof modalState>;

function presetUseBookCard(
  book: BookDomain,
  patch: Partial<{
    isLogged: boolean;
    isOwnSoloBook: boolean;
    deleteDialogOpen: boolean;
    dialogAddShelfModal: ModalMock;
    dialogDeleteModal: ModalMock;
    dialogEditModal: ModalMock;
    dropdownModal: ModalMock;
    bookDetailsModal: ModalMock;
    showFavoriteToggle: boolean;
    canAccessCollectiveReading: boolean;
    statusDisplay: {
      label: string;
      colorClass: string;
      dotClass: string;
    } | null;
    handleNavigateToAuthor: () => void;
    handleOpenBookDetails: () => void;
    handleAuthorSearchFromDetails: () => void;
    handleCollectiveReadingFromDetails: () => void;
    handleScheduleFromDetails: () => void;
    handleQuotesFromDetails: () => void;
  }> = {},
) {
  const {
    isLogged = true,
    isOwnSoloBook = false,
    deleteDialogOpen = false,
    statusDisplay = {
      label: "Lendo agora",
      colorClass: "bg-amber-100",
      dotClass: "bg-amber-500",
    },
    handleNavigateToAuthor = vi.fn(),
    handleOpenBookDetails = vi.fn(),
    handleAuthorSearchFromDetails = vi.fn(),
    handleCollectiveReadingFromDetails = vi.fn(),
    handleScheduleFromDetails = vi.fn(),
    handleQuotesFromDetails = vi.fn(),
  } = patch;

  const dialogDeleteModal =
    patch.dialogDeleteModal ?? modalState(deleteDialogOpen);
  const dialogEditModal = patch.dialogEditModal ?? modalState(false);
  const dialogAddShelfModal = patch.dialogAddShelfModal ?? modalState(false);
  const dropdownModal = patch.dropdownModal ?? modalState(false);
  const bookDetailsModal = patch.bookDetailsModal ?? modalState(false);

  mockedUseBookCard.mockReturnValue({
    book,
    dialogAddShelfModal,
    dialogDeleteModal,
    dialogEditModal,
    dropdownModal,
    bookDetailsModal,
    handleOpenBookDetails,
    handleAuthorSearchFromDetails,
    handleCollectiveReadingFromDetails,
    handleScheduleFromDetails,
    handleQuotesFromDetails,
    dropdownTap: tapStub(),
    shareOnWhatsApp: vi.fn(),
    handleNavigateToSchedule: vi.fn(),
    handleNavigateToAuthor,
    handleNavigateToQuotes: vi.fn(),
    isLogged,
    handleConfirmDelete: vi.fn(),
    statusDisplay,
    isOwnSoloBook,
    showFavoriteToggle: patch.showFavoriteToggle ?? false,
    handleFavoriteClick: vi.fn(),
    isFavoritePending: false,
    canAccessCollectiveReading: patch.canAccessCollectiveReading ?? false,
    collectiveReadingHref: "/collective-reading/book-1/Mem%C3%B3rias%20P%C3%B3stumas",
    handleNavigateToCollectiveReading: vi.fn(),
    badgeObject: {
      bookStatusClass: "bg-green-800 text-white",
      bookStatusText: "Já iniciei a leitura",
    },
  } as unknown as ReturnType<typeof useBookCard>);
}

describe("BookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe título, autor e faixa de status (composição com useBookCard)", () => {
    presetUseBookCard(baseBook);
    render(<BookCard book={baseBook} />);

    expect(screen.getByText("Memórias Póstumas")).toBeInTheDocument();
    expect(screen.getByText("Machado de Assis")).toBeInTheDocument();
    expect(screen.getByText("Lendo agora")).toBeInTheDocument();
  });

  it("clique no alvo principal do card chama abertura do modal de detalhes", () => {
    const handleOpenBookDetails = vi.fn();
    presetUseBookCard(baseBook, { handleOpenBookDetails });
    render(<BookCard book={baseBook} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Ver detalhes: Memórias Póstumas/i }),
    );

    expect(handleOpenBookDetails).toHaveBeenCalledTimes(1);
  });

  it("RN20: sem sessão, não exibe o menu de mais opções", () => {
    presetUseBookCard(baseBook, { isLogged: false });
    render(<BookCard book={baseBook} />);

    expect(
      screen.queryByRole("button", {
        name: 'Mais opções para "Memórias Póstumas"',
      }),
    ).not.toBeInTheDocument();
  });

  it("sem sessão, não exibe nomes de leitores mesmo se readersDisplay vier preenchido", () => {
    const book = {
      ...baseBook,
      readersDisplay: "be1cb368-a253-489b-8615-c88d06c0ff00",
    };
    presetUseBookCard(book, { isLogged: false });
    render(<BookCard book={book} />);

    expect(
      screen.queryByText("be1cb368-a253-489b-8615-c88d06c0ff00"),
    ).not.toBeInTheDocument();
  });

  it("com sessão, exibe o menu de mais opções (alvo tocável ampliado)", () => {
    presetUseBookCard(baseBook, { isLogged: true });
    const { container } = render(<BookCard book={baseBook} />);

    const moreBtn = screen.getByRole("button", {
      name: 'Mais opções para "Memórias Póstumas"',
    });
    expect(moreBtn).toBeInTheDocument();
    expect(moreBtn.className).toMatch(/w-11/);
    expect(moreBtn.className).toMatch(/h-11/);
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("RN55: na estante, o diálogo de remoção descreve apenas o vínculo com a estante", () => {
    const shelfBook = { ...baseBook, id: "s-1" };
    presetUseBookCard(shelfBook, { deleteDialogOpen: true });
    render(
      <BookCard book={shelfBook} isShelf shelfId="shelf-42" />,
    );

    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Remover livro da estante",
    );
    expect(screen.getByText(/continua na sua biblioteca/)).toBeInTheDocument();
  });

  it("RN55: na biblioteca, o diálogo de remoção referencia exclusão do livro", () => {
    presetUseBookCard(baseBook, { deleteDialogOpen: true });
    render(<BookCard book={baseBook} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Excluir livro",
    );
    expect(screen.getByText("Deseja excluir este livro?")).toBeInTheDocument();
  });

  it("RN56: exibe selo Privado no modal de detalhes quando o hook indica livro individual", () => {
    presetUseBookCard(baseBook, {
      isOwnSoloBook: true,
      bookDetailsModal: modalState(true),
    });
    render(<BookCard book={baseBook} />);

    expect(
      screen.getByLabelText("Livro privado — visível apenas para você"),
    ).toBeInTheDocument();
    expect(screen.getByText("Privado")).toBeInTheDocument();
  });

  it("no contexto de estante, reduz o alvo tocável do menu (RN15 contexto denso)", () => {
    const shelfBook = { ...baseBook, id: "s-2" };
    presetUseBookCard(shelfBook);
    render(<BookCard book={shelfBook} isShelf shelfId="shelf-42" />);

    const moreBtn = screen.getByRole("button", {
      name: 'Mais opções para "Memórias Póstumas"',
    });
    expect(moreBtn.className).toMatch(/w-8/);
    expect(moreBtn.className).toMatch(/h-8/);
  });

  it("exibe selo Releitura e chip de gênero no modal quando o livro traz esses campos", () => {
    const book = {
      ...baseBook,
      is_reread: true,
      gender: "romance" as const,
    };
    presetUseBookCard(book, { bookDetailsModal: modalState(true) });
    render(<BookCard book={book} />);

    expect(screen.getByText("Releitura")).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
  });

  it("RN55: no menu da estante, a remoção é «Remover livro da estante»", () => {
    const shelfBook = { ...baseBook, id: "s-3" };
    presetUseBookCard(shelfBook, {
      dropdownModal: modalState(true),
    });
    render(<BookCard book={shelfBook} isShelf shelfId="shelf-42" />);

    expect(
      screen.getByRole("menuitem", { name: "Remover livro da estante" }),
    ).toBeInTheDocument();
  });

  it("ao acionar Editar Livro no menu, abre o fluxo de edição (setIsOpen true)", async () => {
    const user = userEvent.setup();
    const setEditOpen = vi.fn();
    presetUseBookCard(baseBook, {
      dialogEditModal: { ...modalState(false), setIsOpen: setEditOpen },
      dropdownModal: modalState(true),
    });
    render(<BookCard book={baseBook} />);

    await user.click(screen.getByRole("menuitem", { name: "Editar Livro" }));

    expect(setEditOpen).toHaveBeenCalledWith(true);
  });

  it("ao acionar Adicionar Livro a Estante, abre o modal de estantes", async () => {
    const user = userEvent.setup();
    const setAddShelfOpen = vi.fn();
    presetUseBookCard(baseBook, {
      dialogAddShelfModal: { ...modalState(false), setIsOpen: setAddShelfOpen },
      dropdownModal: modalState(true),
    });
    render(<BookCard book={baseBook} />);

    await user.click(
      screen.getByRole("menuitem", { name: "Adicionar Livro a Estante" }),
    );

    expect(setAddShelfOpen).toHaveBeenCalledWith(true);
  });

  it("ao acionar Remover livro no menu (biblioteca), abre o diálogo de exclusão", async () => {
    const user = userEvent.setup();
    const setDeleteOpen = vi.fn();
    presetUseBookCard(baseBook, {
      dialogDeleteModal: { ...modalState(false), setIsOpen: setDeleteOpen },
      dropdownModal: modalState(true),
    });
    render(<BookCard book={baseBook} />);

    await user.click(screen.getByRole("menuitem", { name: "Remover livro" }));

    expect(setDeleteOpen).toHaveBeenCalledWith(true);
  });
});
