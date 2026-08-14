import { act, renderHook, waitFor } from "@testing-library/react";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUser } from "@/services/users/hooks/useUsers";

import { BookLookupData } from "../types/bookLookup.types";
import { useBookDialog } from "./useBookDialog";
import { useBookLookupV2 } from "./useBookLookupV2";
import { useBookUpsert } from "./useBookUpsert";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";
import { usePlannedStartDateLabel } from "./usePlannedStartDateLabel";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/stores/hooks/useAuth", () => ({ useIsLoggedIn: vi.fn() }));
vi.mock("@/services/users/hooks/useUsers", () => ({ useUser: vi.fn() }));
vi.mock("./useBookDialog", () => ({ useBookDialog: vi.fn() }));
vi.mock("./useBookLookupV2", () => ({ useBookLookupV2: vi.fn() }));
vi.mock("./usePlannedStartDateLabel", () => ({
  usePlannedStartDateLabel: vi.fn(),
}));
vi.mock("./usePlannedStartDateFieldVisibility", () => ({
  usePlannedStartDateFieldVisibility: vi.fn(),
}));
vi.mock("../../authors/services/authors.service", () => ({
  AuthorsService: vi.fn(function (this: Record<string, unknown>) {
    this.searchAuthors = vi.fn().mockResolvedValue([]);
  }),
}));

const mockSetValue = vi.fn();
const mockReset = vi.fn();
const mockSetSelected = vi.fn();
const mockClearV2 = vi.fn();
const mockSetIsBookFormOpen = vi.fn();

const mockForm = {
  setValue: mockSetValue,
  reset: mockReset,
  handleSubmit: vi.fn((fn: unknown) => fn),
  control: {},
  getValues: vi.fn(() => ({})),
  watch: vi.fn(),
};

const defaultDialogReturn = {
  form: mockForm,
  reset: mockReset,
  onSubmit: vi.fn(),
  isLoading: false,
  isAddToShelfEnabled: false,
  selected: null,
  selectedShelfId: null,
  setIsAddToShelfEnabled: vi.fn(),
  setSelected: mockSetSelected,
  setSelectedShelfId: vi.fn(),
  isDiscoveryOpen: false,
  isParticipationBlockOpen: false,
  isLinkingToExistingBook: false,
  matchedBook: null,
  handleSubmit: vi.fn(),
  control: {},
  checkboxes: [],
  isEdit: false,
  isLoadingBookshelves: false,
  bookshelfOptions: [],
  handleLinkToExistingBook: vi.fn(),
  handleIgnoreAndCreateNewBook: vi.fn(),
  closeDiscovery: vi.fn(),
  closeParticipationBlock: vi.fn(),
  handleOnChangePageNumber: vi.fn(),
  handleChosenByChange: vi.fn(),
};

const defaultLookupV2Return: {
  book: BookLookupData | null;
  isLoading: boolean;
  error: string | null;
  lookup: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} = {
  book: null,
  isLoading: false,
  error: null,
  lookup: vi.fn(),
  clear: mockClearV2,
};

const defaultProps = {
  bookData: undefined,
  isBookFormOpen: true,
  setIsBookFormOpen: mockSetIsBookFormOpen,
};

function setupMocks(
  overrides: {
    authors?: { id: string; name: string }[];
    isLoadingAuthors?: boolean;
    lookupV2?: Partial<typeof defaultLookupV2Return>;
  } = {},
) {
  (useIsLoggedIn as Mock).mockReturnValue(true);
  (useUser as Mock).mockReturnValue({
    chosenByOptions: [],
    isLoadingUsers: false,
  });
  (useBookDialog as Mock).mockReturnValue(defaultDialogReturn);
  (useBookLookupV2 as Mock).mockReturnValue({
    ...defaultLookupV2Return,
    ...overrides.lookupV2,
  });
  (usePlannedStartDateLabel as Mock).mockReturnValue({
    plannedStartDateLabel: "",
  });
  (usePlannedStartDateFieldVisibility as Mock).mockReturnValue({
    shouldShowPlannedStartDate: false,
  });
  (useQuery as Mock).mockReturnValue({
    data: overrides.authors ?? [],
    isLoading: overrides.isLoadingAuthors ?? false,
  });
}

const makeBookLookupData = (
  partial: Partial<BookLookupData> = {},
): BookLookupData => ({
  nome_do_livro: "Dom Quixote",
  autor: "Miguel de Cervantes",
  paginas: 863,
  url_capa: null,
  genero: "Fiction",
  isbn_13: null,
  isbn_10: null,
  fonte: "google_books",
  ...partial,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBookUpsert — handleDialogOpenChange", () => {
  it("chama clear ao fechar o modal", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(false);
    });

    expect(mockClearV2).toHaveBeenCalledTimes(1);
  });

  it("chama reset e setSelected('not_started') ao fechar o modal", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(false);
    });

    expect(mockReset).toHaveBeenCalled();
    expect(mockSetSelected).toHaveBeenCalledWith("not_started");
  });

  it("não chama clear ao abrir o modal", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(true);
    });

    expect(mockClearV2).not.toHaveBeenCalled();
  });

  it("chama setIsBookFormOpen com o valor correto ao abrir e fechar", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(false);
    });
    expect(mockSetIsBookFormOpen).toHaveBeenCalledWith(false);

    act(() => {
      result.current.handleDialogOpenChange(true);
    });
    expect(mockSetIsBookFormOpen).toHaveBeenCalledWith(true);
  });
});

describe("useBookUpsert — efeito de foundBook", () => {
  it("define o título do livro no formulário quando foundBook chega", async () => {
    setupMocks({
      lookupV2: { book: makeBookLookupData({ nome_do_livro: "Dom Quixote", autor: null }) },
    });
    renderHook(() => useBookUpsert(defaultProps));

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("title", "Dom Quixote");
    });
  });

  it("define páginas, url_capa e genero quando presentes", async () => {
    setupMocks({
      lookupV2: {
        book: makeBookLookupData({
          paginas: 500,
          url_capa: "https://img.com/cover.jpg",
          genero: "Ficção",
          autor: null,
        }),
      },
    });
    renderHook(() => useBookUpsert(defaultProps));

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("pages", 500);
      expect(mockSetValue).toHaveBeenCalledWith(
        "image_url",
        "https://img.com/cover.jpg",
      );
      expect(mockSetValue).toHaveBeenCalledWith("gender", "Ficção");
    });
  });

  it("não define author_id imediatamente quando foundBook tem autor", async () => {
    setupMocks({
      authors: [],
      lookupV2: { book: makeBookLookupData({ autor: "Cervantes" }) },
    });
    renderHook(() => useBookUpsert(defaultProps));

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("title", "Dom Quixote");
    });
    expect(mockSetValue).not.toHaveBeenCalledWith(
      "author_id",
      expect.anything(),
    );
  });

  it("expõe authorSearch com o nome do autor após foundBook chegar", async () => {
    setupMocks({
      authors: [],
      lookupV2: { book: makeBookLookupData({ autor: "Miguel de Cervantes" }) },
    });
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    await waitFor(() => {
      expect(result.current.authorSearch).toBe("Miguel de Cervantes");
    });
  });

  it("não altera authorSearch quando foundBook não tem autor", async () => {
    setupMocks({
      lookupV2: { book: makeBookLookupData({ autor: null }) },
    });
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("title", "Dom Quixote");
    });
    expect(result.current.authorSearch).toBe("");
  });

  it("não dispara efeito quando foundBook é null", () => {
    setupMocks({ lookupV2: { book: null } });
    renderHook(() => useBookUpsert(defaultProps));

    expect(mockSetValue).not.toHaveBeenCalled();
  });
});

describe("useBookUpsert — auto-seleção de autor", () => {
  it("define author_id quando autores carregam após foundBook chegar", async () => {
    setupMocks({
      authors: [],
      isLoadingAuthors: true,
      lookupV2: { book: makeBookLookupData({ autor: "Miguel de Cervantes" }) },
    });
    const { rerender } = renderHook(() => useBookUpsert(defaultProps));

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "author-42", name: "Miguel de Cervantes" }],
      isLoading: false,
    });

    rerender();

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("author_id", "author-42");
    });
  });

  it("usa o primeiro autor disponível quando não há correspondência exata", async () => {
    setupMocks({
      authors: [],
      isLoadingAuthors: true,
      lookupV2: { book: makeBookLookupData({ autor: "Nome Diferente" }) },
    });
    const { rerender } = renderHook(() => useBookUpsert(defaultProps));

    (useQuery as Mock).mockReturnValue({
      data: [
        { id: "author-1", name: "Primeiro Autor" },
        { id: "author-2", name: "Segundo Autor" },
      ],
      isLoading: false,
    });

    rerender();

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith("author_id", "author-1");
    });
  });

  it("não define author_id enquanto autores ainda estão carregando", async () => {
    setupMocks({
      authors: [],
      isLoadingAuthors: true,
      lookupV2: { book: makeBookLookupData({ autor: "Cervantes" }) },
    });
    const { rerender } = renderHook(() => useBookUpsert(defaultProps));

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "author-1", name: "Cervantes" }],
      isLoading: true,
    });

    rerender();

    expect(mockSetValue).not.toHaveBeenCalledWith(
      "author_id",
      expect.anything(),
    );
  });

  it("abre o modal de criar autor quando autor não é encontrado no banco", async () => {
    setupMocks({
      authors: [],
      isLoadingAuthors: true,
      lookupV2: { book: makeBookLookupData({ autor: "Autor Desconhecido" }) },
    });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    (useQuery as Mock).mockReturnValue({ data: [], isLoading: false });

    rerender();

    await waitFor(() => {
      expect(result.current.isAuthorModalOpen).toBe(true);
    });
    expect(mockSetValue).not.toHaveBeenCalledWith("author_id", expect.anything());
  });

  it("não auto-seleciona autor quando foundBook não tem autor", async () => {
    setupMocks({
      authors: [],
      isLoadingAuthors: false,
      lookupV2: { book: makeBookLookupData({ autor: null }) },
    });
    const { rerender } = renderHook(() => useBookUpsert(defaultProps));

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "author-1", name: "Qualquer Autor" }],
      isLoading: false,
    });

    rerender();

    expect(mockSetValue).not.toHaveBeenCalledWith(
      "author_id",
      expect.anything(),
    );
  });
});
