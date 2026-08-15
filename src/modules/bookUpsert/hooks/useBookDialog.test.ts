import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookDialog } from "./useBookDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsLoggedIn, useRequireAuth } from "@/stores/hooks/useAuth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/clientJsonFetch";
import type { BookDomain } from "@/types/books.types";

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
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams("status=paused&myBooks=true")),
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
const mockReplace = vi.fn();

const mockShelves = [
  { id: "shelf-1", name: "Favoritos" },
  { id: "shelf-2", name: "Lidos" },
];

/** Formulário visível — alinhado a `enabled: isLoggedIn && isBookFormOpen` no hook */
const defaultProps = {
  bookData: undefined,
  isBookFormOpen: true,
  setIsBookFormOpen: vi.fn(),
  chosenByOptions: [],
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
  (useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
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
    (usePathname as Mock).mockReturnValue("/");
    (useSearchParams as Mock).mockReturnValue(
      new URLSearchParams("status=paused&myBooks=true"),
    );
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

    it("passa enabled: false para useQuery quando está logado mas o formulário está fechado", () => {
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
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });

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
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
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

  describe("status padrão", () => {
    it("inicializa selected com 'not_started' para formulário novo", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));

      expect(result.current.selected).toBe("not_started");
    });

  });

  describe("preenchimento automático — leitores e responsável", () => {
    it("inclui o usuário logado em readers ao inicializar formulário novo", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));

      expect(result.current.reset).toHaveBeenCalledWith(
        expect.objectContaining({ readers: ["user-1"] }),
      );
    });

    it("define chosen_by como o id do usuário logado nos defaults", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));

      expect(result.current.reset).toHaveBeenCalledWith(
        expect.objectContaining({ chosen_by: "user-1" }),
      );
    });

    it("define user_id como o id do usuário logado nos defaults", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookDialog(defaultProps));

      expect(result.current.reset).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user-1" }),
      );
    });

    it("mantém readers, chosen_by e user_id vazios quando authUser não está disponível", () => {
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useRequireAuth as Mock).mockReturnValue(null);
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: mockReplace });
      (useQueryClient as Mock).mockReturnValue({
        invalidateQueries: mockInvalidateQueries,
      });
      (useQuery as Mock).mockReturnValue({
        data: mockShelves,
        isLoading: false,
      });
      (useMutation as Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });

      const { result } = renderHook(() => useBookDialog(defaultProps));

      expect(result.current.reset).toHaveBeenCalledWith(
        expect.objectContaining({ readers: [], chosen_by: "", user_id: "" }),
      );
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

  describe("navegação após alteração de status", () => {
    const editBookData: BookDomain = {
      id: "book-1",
      title: "Livro Teste",
      author: "Autor Teste",
      pages: 200,
      status: "paused",
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

    it("navega para o filtro do novo status ao editar na home", async () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() =>
        useBookDialog({
          ...defaultProps,
          bookData: editBookData,
        }),
      );

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      await mutationOptions.onSuccess?.(
        { mode: "edit" as const },
        { status: "reading" },
      );

      expect(mockReplace).toHaveBeenCalledWith("/?status=reading&myBooks=true");
    });

    it("não navega quando o status não mudou", async () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() =>
        useBookDialog({
          ...defaultProps,
          bookData: editBookData,
        }),
      );

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      await mutationOptions.onSuccess?.(
        { mode: "edit" as const },
        { status: "paused" },
      );

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("não navega quando a edição ocorre fora da home", async () => {
      (usePathname as Mock).mockReturnValue("/bookshelves/shelf-1");
      setupMocks({ isLoggedIn: true });
      renderHook(() =>
        useBookDialog({
          ...defaultProps,
          bookData: editBookData,
        }),
      );

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      await mutationOptions.onSuccess?.(
        { mode: "edit" as const },
        { status: "reading" },
      );

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("navega para bookId ao criar um livro novo", async () => {
      (usePathname as Mock).mockReturnValue("/");
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookDialog(defaultProps));

      const mutationOptions = (useMutation as Mock).mock.calls[0][0];
      await mutationOptions.onSuccess?.(
        { mode: "create" as const, book: { id: "book-new" }, shelfDuplicate: false },
        { status: "reading" },
      );

      expect(mockReplace).toHaveBeenCalledWith("/?bookId=book-new");
    });
  });
});
