import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useUser } from "./useUsers";
import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
}));

vi.mock("../service/getUsers.service", () => ({
  getUsers: vi.fn(),
}));

const mockUsers = [
  { id: "1", display_name: "Matheus" },
  { id: "2", display_name: "Barbara" },
];

function setupQuery({
  isLoggedIn = true,
  data = mockUsers,
  isLoading = false,
}: {
  isLoggedIn?: boolean;
  data?: typeof mockUsers | undefined;
  isLoading?: boolean;
} = {}) {
  (useIsLoggedIn as Mock).mockReturnValue(isLoggedIn);
  (useQuery as Mock).mockReturnValue({ data, isLoading });
}

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RN18 — guard de autenticação", () => {
    it("passa enabled: false para useQuery quando não está logado", () => {
      setupQuery({ isLoggedIn: false, data: undefined });
      renderHook(() => useUser());
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("passa enabled: true para useQuery quando está logado", () => {
      setupQuery({ isLoggedIn: true });
      renderHook(() => useUser());
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it("retorna users vazio sem disparar fetch quando não está logado", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useUser());
      expect(result.current.users).toEqual([]);
    });

    it("retorna isLoadingUsers false quando a query está desabilitada", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useUser());
      expect(result.current.isLoadingUsers).toBe(false);
    });
  });

  describe("retorno de dados", () => {
    it("retorna a lista de usuários mapeada corretamente", () => {
      setupQuery({ isLoggedIn: true });
      const { result } = renderHook(() => useUser());
      expect(result.current.users).toEqual(mockUsers);
    });

    it("retorna chosenByOptions com label e value de cada usuário", () => {
      setupQuery({ isLoggedIn: true });
      const { result } = renderHook(() => useUser());
      expect(result.current.chosenByOptions).toEqual([
        { label: "Matheus", value: "1" },
        { label: "Barbara", value: "2" },
      ]);
    });

    it("retorna chosenByOptions vazio quando não está logado", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useUser());
      expect(result.current.chosenByOptions).toEqual([]);
    });

    it("expõe isLoadingUsers true enquanto a query carrega", () => {
      setupQuery({ isLoggedIn: true, isLoading: true, data: undefined });
      const { result } = renderHook(() => useUser());
      expect(result.current.isLoadingUsers).toBe(true);
    });

    it("expõe isLoadingUsers false quando a query termina", () => {
      setupQuery({ isLoggedIn: true, isLoading: false });
      const { result } = renderHook(() => useUser());
      expect(result.current.isLoadingUsers).toBe(false);
    });

    it("retorna users vazio como default quando data é undefined", () => {
      (useIsLoggedIn as Mock).mockReturnValue(true);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useUser());
      expect(result.current.users).toEqual([]);
    });
  });

  describe("queryKey", () => {
    it("usa queryKey [\"users\"]", () => {
      setupQuery();
      renderHook(() => useUser());
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["users"] }),
      );
    });
  });
});
