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
};

function modalState(isOpen: boolean) {
  return { isOpen, setIsOpen: vi.fn() };
}

function tapStub() {
  return {
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleClick: vi.fn(),
  };
}

type ModalMock = { isOpen: boolean; setIsOpen: ReturnType<typeof vi.fn> };

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
    statusDisplay: {
      label: string;
      colorClass: string;
      dotClass: string;
    } | null;
    handleNavigateToAuthor: ReturnType<typeof vi.fn>;
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
  } = patch;

  const dialogDeleteModal =
    patch.dialogDeleteModal ?? modalState(deleteDialogOpen);
  const dialogEditModal = patch.dialogEditModal ?? modalState(false);
  const dialogAddShelfModal = patch.dialogAddShelfModal ?? modalState(false);
  const dropdownModal = patch.dropdownModal ?? modalState(false);

  mockedUseBookCard.mockReturnValue({
    book,
    dialogAddShelfModal,
    dialogDeleteModal,
    dialogEditModal,
    dropdownModal,
    dropdownTap: tapStub(),
    shareOnWhatsApp: vi.fn(),
    handleNavigateToSchedule: vi.fn(),
    handleNavigateToAuthor,
    handleNavigateToQuotes: vi.fn(),
    isLogged,
    handleConfirmDelete: vi.fn(),
    statusDisplay,
    isOwnSoloBook,
  });
}

describe("BookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe título, autor e faixa de status (composição com useBookCard)", () => {
    presetUseBookCard(baseBook);
    render(<BookCard book={baseBook} />);

    expect(screen.getByText("Memórias Póstumas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Autor: Machado de Assis — Memórias Póstumas",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lendo agora")).toBeInTheDocument();
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

  it("com sessão, exibe o menu de mais opções (alvo tocável ampliado)", () => {
    presetUseBookCard(baseBook, { isLogged: true });
    const { container } = render(<BookCard book={baseBook} />);

    const moreBtn = screen.getByRole("button", {
      name: 'Mais opções para "Memórias Póstumas"',
    });
    expect(moreBtn).toBeInTheDocument();
    expect(moreBtn.className).toMatch(/w-11/);
    expect(moreBtn.className).toMatch(/h-11/);
    expect(container.querySelector('img[alt="Memórias Póstumas"]')).toBeTruthy();
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

  it("RN56: exibe selo Privado quando o hook indica livro individual do usuário", () => {
    presetUseBookCard(baseBook, { isOwnSoloBook: true });
    render(<BookCard book={baseBook} />);

    expect(
      screen.getByLabelText("Livro privado — visível apenas para você"),
    ).toBeInTheDocument();
    expect(screen.getByText("Privado")).toBeInTheDocument();
  });

  it("dispara navegação ao autor ao clicar no botão do autor", () => {
    const handleNavigateToAuthor = vi.fn();
    presetUseBookCard(baseBook, { handleNavigateToAuthor });
    render(<BookCard book={baseBook} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Autor: Machado de Assis — Memórias Póstumas",
      }),
    );

    expect(handleNavigateToAuthor).toHaveBeenCalledTimes(1);
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

  it("exibe selo Releitura e chip de gênero quando o livro traz esses campos", () => {
    const book = {
      ...baseBook,
      is_reread: true,
      gender: "romance" as const,
    };
    presetUseBookCard(book);
    render(<BookCard book={book} />);

    expect(screen.getByText("Releitura")).toBeInTheDocument();
    expect(screen.getByText("Romance")).toBeInTheDocument();
  });

  it("RN55: no menu da estante, a remoção é «Remover livro da estante»", () => {
    const shelfBook = { ...baseBook, id: "s-3" };
    presetUseBookCard(shelfBook, {
      dropdownModal: { isOpen: true, setIsOpen: vi.fn() },
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
      dialogEditModal: { isOpen: false, setIsOpen: setEditOpen },
      dropdownModal: { isOpen: true, setIsOpen: vi.fn() },
    });
    render(<BookCard book={baseBook} />);

    await user.click(screen.getByRole("menuitem", { name: "Editar Livro" }));

    expect(setEditOpen).toHaveBeenCalledWith(true);
  });

  it("ao acionar Adicionar Livro a Estante, abre o modal de estantes", async () => {
    const user = userEvent.setup();
    const setAddShelfOpen = vi.fn();
    presetUseBookCard(baseBook, {
      dialogAddShelfModal: { isOpen: false, setIsOpen: setAddShelfOpen },
      dropdownModal: { isOpen: true, setIsOpen: vi.fn() },
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
      dialogDeleteModal: { isOpen: false, setIsOpen: setDeleteOpen },
      dropdownModal: { isOpen: true, setIsOpen: vi.fn() },
    });
    render(<BookCard book={baseBook} />);

    await user.click(screen.getByRole("menuitem", { name: "Remover livro" }));

    expect(setDeleteOpen).toHaveBeenCalledWith(true);
  });
});
