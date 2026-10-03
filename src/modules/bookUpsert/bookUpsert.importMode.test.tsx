import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type UseFormReturn } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import type { BookDomain } from "@/types/books.types";
import { TestQueryWrapper } from "@/test-utils/QueryWrapper";

import { BookUpsert } from "./bookUpsert";
import type { BookImportResult } from "./bookUpsert.types";

vi.mock("@/modules/authors/components", () => ({
  AuthorUpsert: () => null,
}));

vi.mock("@/modules/bookRating", () => ({
  FinishedReadingRatingDialog: () => null,
}));

const harness = vi.hoisted(() => ({
  bookData: undefined as BookDomain | undefined,
  form: null as UseFormReturn | null,
  isEdit: false,
}));

vi.mock("./hooks/useBookUpsert", () => ({
  useBookUpsert: () => {
    const form = harness.form;

    if (!form) {
      throw new Error("form harness ausente");
    }

    return {
      authorSearch: "",
      authors: [],
      bookData: harness.bookData,
      bookshelfOptions: [],
      checkboxes: [],
      chosenByOptions: [],
      closeParticipationBlock: vi.fn(),
      control: form.control,
      emptyAuthorSearch: false,
      form,
      foundBook: null,
      handleAuthorCreated: vi.fn(),
      handleAuthorModalOpenChange: vi.fn(),
      handleAuthorSearchChange: vi.fn(),
      handleCancelDiscoveryDialog: vi.fn(),
      handleDialogOpenChange: vi.fn(),
      handleDismissRatingPrompt: vi.fn(),
      handleIgnoreAndCreateNewBook: vi.fn(),
      handleLinkToExistingBook: vi.fn(),
      handleLookupQueryChange: vi.fn(),
      handleOpenAddAuthorModal: vi.fn(),
      handlePageNumberChange: vi.fn(),
      handleSearchBooks: vi.fn(),
      handleStatusChange: vi.fn(),
      handleSubmit: form.handleSubmit,
      isAddToShelfEnabled: false,
      isAuthorModalOpen: false,
      isDiscoveryOpen: false,
      isEdit: harness.isEdit,
      isLinkingToExistingBook: false,
      isLoading: false,
      isLoadingAuthors: false,
      isLoadingBookshelves: false,
      isLoadingUsers: false,
      isLoggedIn: true,
      isParticipationBlockOpen: false,
      isSearchingBooks: false,
      lookupError: null,
      lookupQuery: "",
      matchedBook: null,
      onSubmit: vi.fn(),
      plannedStartDateLabel: "",
      ratingPromptBookId: null,
      selected: null,
      selectedShelfId: "",
      setIsAddToShelfEnabled: vi.fn(),
      setSelectedShelfId: vi.fn(),
      shouldShowPlannedStartDate: false,
    };
  },
}));

const editBook: BookDomain = {
  author: "Autora",
  chosen_by: "user-1",
  gender: null,
  image_url: "",
  is_favorite: false,
  is_reread: false,
  pages: 10,
  readerIds: [],
  readersDisplay: "",
  title: "Livro editado",
  user_id: "user-1",
};

function Harness({
  bookData,
  importResult = null,
  isOpen = true,
  onImportBooks,
}: {
  bookData?: BookDomain;
  importResult?: BookImportResult | null;
  isOpen?: boolean;
  onImportBooks?: (file: File) => void;
}) {
  const form = useForm({
    defaultValues: {
      author_id: "",
      end_date: null,
      gender: undefined,
      image_url: "",
      is_reread: false,
      pages: undefined,
      planned_start_date: null,
      readers: [],
      start_date: null,
      title: "",
    },
  });

  harness.form = form;
  harness.bookData = bookData;
  harness.isEdit = Boolean(bookData);

  return (
    <TestQueryWrapper>
      <BookUpsert
        bookData={bookData}
        importResult={importResult}
        isBookFormOpen={isOpen}
        onImportBooks={onImportBooks}
        setIsBookFormOpen={vi.fn()}
      />
    </TestQueryWrapper>
  );
}

describe("entrada de vários livros", () => {
  it("troca o formulário de um livro pelo painel sem fechar o modal", async () => {
    const user = userEvent.setup();

    render(<Harness />);

    expect(
      screen.getByRole("dialog", { name: "Adicione um novo livro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Busca automática" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Um livro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Vários livros" }));

    expect(
      screen.getByRole("dialog", { name: "Traga vários livros" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Busca automática" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Importar livros" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Adicionar" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Um livro" }));

    expect(
      screen.getByRole("dialog", { name: "Adicione um novo livro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Busca automática" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeInTheDocument();
  });

  it("mostra o arquivo escolhido e só então libera a importação", async () => {
    const user = userEvent.setup();
    const onImportBooks = vi.fn();
    const file = new File(["titulo,autor\n"], "estante.csv", {
      type: "text/csv",
    });

    render(<Harness onImportBooks={onImportBooks} />);

    await user.click(screen.getByRole("button", { name: "Vários livros" }));
    await user.upload(
      screen.getByLabelText(/Escolher arquivo \.csv/),
      new File(["oi"], "notas.pdf", { type: "application/pdf" }),
    );

    expect(screen.queryByText("notas.pdf")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar livros" })).toBeDisabled();

    await user.upload(
      screen.getByLabelText(/Escolher arquivo \.csv/),
      new File(["titulo,autor\n"], "estante.txt", { type: "text/plain" }),
    );

    expect(screen.getByText("estante.txt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar livros" })).toBeEnabled();

    await user.upload(screen.getByLabelText(/Escolher arquivo \.csv/), file);

    expect(screen.getByText("estante.csv")).toBeInTheDocument();
    expect(screen.getByText("13 B")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Baixar modelo" }),
    ).toHaveAttribute("href", "/modelo-importacao-livros.csv");

    await user.click(screen.getByRole("button", { name: "Importar livros" }));

    expect(onImportBooks).toHaveBeenCalledWith(file);
    expect(screen.queryByText(/livro criado/)).not.toBeInTheDocument();
  });

  it("mostra o resultado só quando o pai envia", async () => {
    const user = userEvent.setup();

    render(
      <Harness
        importResult={{
          kind: "refused",
          message: "Esse arquivo não deu para ler.",
        }}
      />,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vários livros" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Esse arquivo não deu para ler.",
    );
  });

  it("não oferece vários livros ao editar", () => {
    render(<Harness bookData={editBook} />);

    expect(
      screen.getByRole("dialog", { name: "Editar Livro" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vários livros" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Busca automática" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });
});
