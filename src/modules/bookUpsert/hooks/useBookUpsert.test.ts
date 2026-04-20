import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, Mock, beforeEach, describe, it, expect } from "vitest";
import { useBookUpsert } from "./useBookUpsert";
import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUser } from "@/services/users/hooks/useUsers";
import { useBookDialog } from "./useBookDialog";
import { useBookLookup } from "./useBookLookup";
import { usePlannedStartDateLabel } from "./usePlannedStartDateLabel";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";
import { BookCandidate } from "../types/bookCandidate.types";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/stores/hooks/useAuth", () => ({ useIsLoggedIn: vi.fn() }));
vi.mock("@/services/users/hooks/useUsers", () => ({ useUser: vi.fn() }));
vi.mock("./useBookDialog", () => ({ useBookDialog: vi.fn() }));
vi.mock("./useBookLookup", () => ({ useBookLookup: vi.fn() }));
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
const mockClearCandidates = vi.fn();
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

const defaultLookupReturn = {
  candidates: [],
  isSearching: false,
  hasSearched: false,
  lookupQuery: "",
  handleLookupQueryChange: vi.fn(),
  handleSearchBooks: vi.fn(),
  clearCandidates: mockClearCandidates,
};

const defaultProps = {
  bookData: undefined,
  isBookFormOpen: true,
  setIsBookFormOpen: mockSetIsBookFormOpen,
};

function setupMocks(overrides: {
  authors?: { id: string; name: string }[];
  isLoadingAuthors?: boolean;
} = {}) {
  (useIsLoggedIn as Mock).mockReturnValue(true);
  (useUser as Mock).mockReturnValue({ chosenByOptions: [], isLoadingUsers: false });
  (useBookDialog as Mock).mockReturnValue(defaultDialogReturn);
  (useBookLookup as Mock).mockReturnValue(defaultLookupReturn);
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

const makeCandidate = (partial: Partial<BookCandidate> = {}): BookCandidate => ({
  title: "Dom Quixote",
  author_name: "Miguel de Cervantes",
  pages: 863,
  image_url: null,
  gender: "Fiction",
  publisher: null,
  published_date: null,
  isbn: null,
  source: "google_books",
  ...partial,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBookUpsert — handleDialogOpenChange", () => {
  it("chama clearCandidates ao fechar o modal", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(false);
    });

    expect(mockClearCandidates).toHaveBeenCalledTimes(1);
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

  it("não chama clearCandidates ao abrir o modal", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleDialogOpenChange(true);
    });

    expect(mockClearCandidates).not.toHaveBeenCalled();
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

describe("useBookUpsert — handleApplyCandidate", () => {
  it("define o título do livro no formulário", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));
    const candidate = makeCandidate({ title: "Dom Quixote", author_name: null });

    act(() => {
      result.current.handleApplyCandidate(candidate);
    });

    expect(mockSetValue).toHaveBeenCalledWith("title", "Dom Quixote");
  });

  it("define páginas, image_url e gender quando presentes", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));
    const candidate = makeCandidate({
      pages: 500,
      image_url: "https://img.com/cover.jpg",
      gender: "Fiction",
    });

    act(() => {
      result.current.handleApplyCandidate(candidate);
    });

    expect(mockSetValue).toHaveBeenCalledWith("pages", 500);
    expect(mockSetValue).toHaveBeenCalledWith("image_url", "https://img.com/cover.jpg");
    expect(mockSetValue).toHaveBeenCalledWith("gender", "Fiction");
  });

  it("chama clearCandidates após aplicar candidato", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(makeCandidate());
    });

    expect(mockClearCandidates).toHaveBeenCalledTimes(1);
  });

  it("não define author_id imediatamente ao aplicar candidato com autor", () => {
    setupMocks({ authors: [] });
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(makeCandidate({ author_name: "Cervantes" }));
    });

    expect(mockSetValue).not.toHaveBeenCalledWith("author_id", expect.anything());
  });

  it("expõe authorSearch com o nome do autor após aplicar candidato", () => {
    setupMocks({ authors: [] });
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(
        makeCandidate({ author_name: "Miguel de Cervantes" }),
      );
    });

    expect(result.current.authorSearch).toBe("Miguel de Cervantes");
  });

  it("não altera authorSearch quando o candidato não tem autor", () => {
    setupMocks();
    const { result } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(makeCandidate({ author_name: null }));
    });

    expect(result.current.authorSearch).toBe("");
  });
});

describe("useBookUpsert — auto-seleção de autor", () => {
  it("define author_id quando autores carregam após candidato ser aplicado", async () => {
    setupMocks({ authors: [], isLoadingAuthors: false });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(
        makeCandidate({ author_name: "Miguel de Cervantes" }),
      );
    });

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
    setupMocks({ authors: [], isLoadingAuthors: false });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(
        makeCandidate({ author_name: "Nome Diferente" }),
      );
    });

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

  it("não define author_id enquanto autores ainda estão carregando", () => {
    setupMocks({ authors: [], isLoadingAuthors: true });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(
        makeCandidate({ author_name: "Cervantes" }),
      );
    });

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "author-1", name: "Cervantes" }],
      isLoading: true,
    });

    rerender();

    expect(mockSetValue).not.toHaveBeenCalledWith("author_id", expect.anything());
  });

  it("não define author_id quando authors está vazio após candidato aplicado", () => {
    setupMocks({ authors: [], isLoadingAuthors: false });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(
        makeCandidate({ author_name: "Autor Desconhecido" }),
      );
    });

    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    rerender();

    expect(mockSetValue).not.toHaveBeenCalledWith("author_id", expect.anything());
  });

  it("não auto-seleciona autor quando candidato não tem author_name", () => {
    setupMocks({ authors: [], isLoadingAuthors: false });
    const { result, rerender } = renderHook(() => useBookUpsert(defaultProps));

    act(() => {
      result.current.handleApplyCandidate(makeCandidate({ author_name: null }));
    });

    (useQuery as Mock).mockReturnValue({
      data: [{ id: "author-1", name: "Qualquer Autor" }],
      isLoading: false,
    });

    rerender();

    expect(mockSetValue).not.toHaveBeenCalledWith("author_id", expect.anything());
  });
});
