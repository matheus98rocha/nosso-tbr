import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookDialog } from "./useBookDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/clientJsonFetch";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
  useRequireAuth: vi.fn(() => ({ id: "user-1" })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  fetchBookShelves: vi.fn(),
  BookshelfService: vi.fn(function (this: Record<string, unknown>) {
    this.addBookToShelf = vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock("../services/bookUpsert.service", () => ({
  BookUpsertService: vi.fn(function (this: Record<string, unknown>) {
    this.create = vi.fn().mockResolvedValue({ id: "book-new" });
    this.edit = vi.fn().mockResolvedValue(undefined);
    this.checkDuplicateBook = vi.fn().mockResolvedValue(false);
  }),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(() => ({
    reset: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    control: {},
    getValues: vi.fn(() => ({})),
    setValue: vi.fn(),
    watch: vi.fn(),
  })),
}));

vi.mock("@/modules/home/validators/createBook.validator", () => ({
  bookCreateSchema: {},
}));

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockPush = vi.fn();

const mockShelves = [
  { id: "shelf-1", name: "Favoritos" },
  { id: "shelf-2", name: "Lidos" },
];

const defaultProps = {
  bookData: undefined,
  setIsBookFormOpen: vi.fn(),
  chosenByOptions: [],
  isBookFormOpen: true,
};

function setupMocks({
  isLoggedIn = true,
  shelvesData = mockShelves,
  isLoadingBookshelves = false,
}: {
  isLoggedIn?: boolean;
  shelvesData?: typeof mockShelves | undefined;
  isLoadingBookshelves?: boolean;
} = {}) {
  (useIsLoggedIn as Mock).mockReturnValue(isLoggedIn);
  (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });
  (useQueryClient as Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  });
  (useQuery as Mock).mockReturnValue({
    data: shelvesData,
    isLoading: isLoadingBookshelves,
  });
  (useMutation as Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
}

describe("useBookDialog — query de estantes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RN18 — guard de autenticação", () => {
    it("passa enabled: false para useQuery quando não está logado", () => {
      setupMocks({ isLoggedIn: false, shelvesData: undefined });
      renderHook(() => useBookDialog(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("passa enabled: true para useQuery quando está logado e o formulário está aberto", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookDialog(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it("passa enabled: false quando o formulário está fechado", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() =>
        useBookDialog({ ...defaultProps, isBookFormOpen: false }),
      );
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("retorna bookshelfOptions vazio quando não está logado", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      (useMutation as Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: vi.fn() });
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });

      const { result } = renderHook(() => useBookDialog(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([]);
    });
  });

  describe("RN19 — staleTime em queries compartilhadas", () => {
    it("declara staleTime de 5 minutos (300000ms)", () => {
      setupMocks();
      renderHook(() => useBookDialog(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ staleTime: 1000 * 60 * 5 }),
      );
    });

    it("usa queryKey [\"bookshelves\"] para compartilhar cache com outros hooks", () => {
      setupMocks();
      renderHook(() => useBookDialog(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["bookshelves"] }),
      );
    });
  });

  describe("bookshelfOptions", () => {
    it("mapeia estantes para { label, value }", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([
        { label: "Favoritos", value: "shelf-1" },
        { label: "Lidos", value: "shelf-2" },
      ]);
    });

    it("retorna array vazio quando data é undefined", () => {
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      (useMutation as Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });
      const { result } = renderHook(() => useBookDialog(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([]);
    });

    it("expõe isLoadingBookshelves true enquanto carrega", () => {
      setupMocks({ isLoggedIn: true, isLoadingBookshelves: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));
      expect(result.current.isLoadingBookshelves).toBe(true);
    });

    it("expõe isLoadingBookshelves false quando termina", () => {
      setupMocks({ isLoggedIn: true, isLoadingBookshelves: false });
      const { result } = renderHook(() => useBookDialog(defaultProps));
      expect(result.current.isLoadingBookshelves).toBe(false);
    });
  });

  describe("tratamento de erro de autenticação", () => {
    it("exibe mensagem amigável e redireciona para /auth quando recebe 401", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookDialog(defaultProps));

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      mutationOptions.onError?.(new ApiError("Unauthorized", 401));

      expect(toast).toHaveBeenCalledWith("Sessão expirada", {
        description: "Faça login novamente para continuar.",
        className: "toast-error",
      });
      expect(mockPush).toHaveBeenCalledWith("/auth");
    });

    it("mantém toast genérico para erros não relacionados à autenticação", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookDialog(defaultProps));

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      mutationOptions.onError?.(new Error("Falha qualquer"));

      expect(toast).toHaveBeenCalledWith("Erro ao salvar livro", {
        description: "Falha qualquer",
        className: "toast-error",
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
