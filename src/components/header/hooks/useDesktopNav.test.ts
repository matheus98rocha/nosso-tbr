import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const {
  mockGetAuthors,
  mockGetByReader,
  mockGetCollaboration,
  mockFetchBookShelves,
  mockUseUserStore,
} = vi.hoisted(() => ({
  mockGetAuthors: vi.fn().mockResolvedValue([]),
  mockGetByReader: vi.fn().mockResolvedValue([]),
  mockGetCollaboration: vi.fn().mockResolvedValue([]),
  mockFetchBookShelves: vi.fn().mockResolvedValue([]),
  mockUseUserStore: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: mockUseUserStore,
}));

vi.mock("@/modules/authors/services/authors.service", () => ({
  AuthorsService: vi.fn(function (this: Record<string, unknown>) {
    this.getAuthors = mockGetAuthors;
  }),
}));

vi.mock("@/modules/stats/services/stats.service", () => ({
  StatsService: vi.fn(function (this: Record<string, unknown>) {
    this.getByReader = mockGetByReader;
    this.getCollaborationStats = mockGetCollaboration;
  }),
}));

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  fetchBookShelves: mockFetchBookShelves,
}));

import { useDesktopNav } from "./useDesktopNav";

const AUTHENTICATED_USER = { id: "user-123", name: "Tester" };

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      ),
  };
}

function mockUser(user: typeof AUTHENTICATED_USER | null) {
  mockUseUserStore.mockReturnValue({ user });
}

describe("useDesktopNav — handlePrefetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Estatisticas — usuário NÃO autenticado (caso de regressão)", () => {
    it("não deve chamar statsService quando user é null", async () => {
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Estatisticas");

      expect(mockGetByReader).not.toHaveBeenCalled();
      expect(mockGetCollaboration).not.toHaveBeenCalled();
    });
  });

  describe("Estatisticas — usuário autenticado", () => {
    it("deve chamar statsService com o id do usuário autenticado", async () => {
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Estatisticas");

      expect(mockGetByReader).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
      expect(mockGetCollaboration).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
    });

    it('não deve chamar statsService com o fallback "Matheus"', async () => {
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Estatisticas");

      expect(mockGetByReader).not.toHaveBeenCalledWith("Matheus");
      expect(mockGetCollaboration).not.toHaveBeenCalledWith("Matheus");
    });
  });

  describe("Ver Estantes", () => {
    it("deve prefetch independente de autenticação", async () => {
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Ver Estantes");

      expect(mockFetchBookShelves).toHaveBeenCalledOnce();
    });
  });

  describe("Autores", () => {
    it("deve prefetch independente de autenticação", async () => {
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Autores");

      expect(mockGetAuthors).toHaveBeenCalledOnce();
    });
  });

  describe("label desconhecido", () => {
    it("não deve acionar nenhum serviço", async () => {
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      await result.current.handlePrefetch("Inexistente");

      expect(mockGetByReader).not.toHaveBeenCalled();
      expect(mockGetCollaboration).not.toHaveBeenCalled();
      expect(mockFetchBookShelves).not.toHaveBeenCalled();
      expect(mockGetAuthors).not.toHaveBeenCalled();
    });
  });
});
