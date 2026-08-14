import { act, renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookshelves } from "./useBookshelves";
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
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(() => ({ id: "user-1", display_name: "Matheus" })),
}));

const mockCreate = vi.fn().mockResolvedValue(undefined);
const mockUpdate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  fetchBookShelves: vi.fn(),
  BookshelfService: vi.fn(function (this: Record<string, unknown>) {
    this.create = mockCreate;
    this.update = mockUpdate;
  }),
}));

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockPush = vi.fn();

/** UI aberto — alinhado a `enabled: isLoggedIn && isOpen` no hook */
const shelvesWhenOpen = { isOpen: true as const };

const mockShelves = [
  { id: "shelf-1", name: "Favoritos", books: [] },
  { id: "shelf-2", name: "Lidos", books: [] },
];

function setupMocks({
  isLoggedIn = true,
  data = mockShelves,
  isLoading = false,
  isFetched = true,
}: {
  isLoggedIn?: boolean;
  data?: typeof mockShelves | undefined;
  isLoading?: boolean;
  isFetched?: boolean;
} = {}) {
  (useIsLoggedIn as Mock).mockReturnValue(isLoggedIn);
  (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });
  (useQueryClient as Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  });
  (useQuery as Mock).mockReturnValue({
    data,
    isLoading,
    isFetched,
    error: null,
    isError: false,
  });
  (useMutation as Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
}

describe("useBookshelves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RN18 — guard de autenticação", () => {
    it("passa enabled: false para useQuery quando não está logado", () => {
      setupMocks({ isLoggedIn: false, data: undefined });
      renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("passa enabled: true para useQuery quando está logado e a UI está aberta", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it("passa enabled: false para useQuery quando está logado mas a UI está fechada (isOpen: false)", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useBookshelves({ isOpen: false }));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("não retorna dados de estantes quando não está logado", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetched: false,
        error: null,
        isError: false,
      });
      (useMutation as Mock).mockReturnValue({ mutate: mockMutate, isPending: false });
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: vi.fn() });
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });

      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(result.current.bookshelves).toBeUndefined();
    });
  });

  describe("RN19 — staleTime em queries compartilhadas", () => {
    it("declara staleTime de 5 minutos (300000ms)", () => {
      setupMocks();
      renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ staleTime: 1000 * 60 * 5 }),
      );
    });
  });

  describe("queryKey", () => {
    it("usa queryKey [\"bookshelves\"]", () => {
      setupMocks();
      renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["bookshelves"] }),
      );
    });
  });

  describe("retorno de dados", () => {
    it("expõe bookshelves quando logado e dados disponíveis", () => {
      setupMocks({ isLoggedIn: true });
      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(result.current.bookshelves).toEqual(mockShelves);
    });

    it("expõe isFetching true enquanto carrega", () => {
      setupMocks({ isLoading: true });
      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(result.current.isFetching).toBe(true);
    });

    it("expõe isFetched true após carga completa", () => {
      setupMocks({ isFetched: true });
      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      expect(result.current.isFetched).toBe(true);
    });
  });

  describe("mutação — criar / editar estante", () => {
    it("chama mutate ao criar uma estante nova", () => {
      setupMocks();
      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      act(() => result.current.mutate({ name: "Nova Estante" }));
      expect(mockMutate).toHaveBeenCalledWith({ name: "Nova Estante" });
    });

    it("fecha o dialog após sucesso quando handleClose é fornecido", () => {
      const handleClose = vi.fn();
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
      (useQuery as Mock).mockReturnValue({
        data: mockShelves,
        isLoading: false,
        isFetched: true,
        error: null,
        isError: false,
      });
      (useMutation as Mock).mockImplementation(({ onSuccess }) => ({
        mutate: (payload: unknown) => {
          onSuccess();
          return payload;
        },
        isPending: false,
      }));

      const { result } = renderHook(() =>
        useBookshelves({ ...shelvesWhenOpen, handleClose }),
      );
      act(() => result.current.mutate({ name: "Estante X" }));
      expect(handleClose).toHaveBeenCalledWith(false);
    });

    it("invalida queries de bookshelves após sucesso", () => {
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
      (useQuery as Mock).mockReturnValue({
        data: mockShelves,
        isLoading: false,
        isFetched: true,
        error: null,
        isError: false,
      });
      (useMutation as Mock).mockImplementation(({ onSuccess }) => ({
        mutate: (payload: unknown) => {
          onSuccess();
          return payload;
        },
        isPending: false,
      }));

      const { result } = renderHook(() => useBookshelves(shelvesWhenOpen));
      act(() => result.current.mutate({ name: "Estante Y" }));
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["bookshelves"],
      });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["bookshelf-meta"],
      });
    });
  });

  describe("tratamento de sessão expirada", () => {
    it("exibe toast e redireciona para /auth quando query retorna 401", () => {
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useRouter as Mock).mockReturnValue({ push: mockPush, replace: vi.fn() });
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
      (useQuery as Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isFetched: true,
        error: new ApiError("Unauthorized", 401),
        isError: true,
      });
      (useMutation as Mock).mockReturnValue({ mutate: mockMutate, isPending: false });

      renderHook(() => useBookshelves(shelvesWhenOpen));

      expect(toast).toHaveBeenCalledWith("Sessão expirada", {
        description: "Faça login novamente para continuar.",
        className: "toast-error",
      });
      expect(mockPush).toHaveBeenCalledWith("/auth");
    });
  });
});
