import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// ─── vi.hoisted: garante que os mocks existam antes dos factories hoistados ───

const {
  mockGetAll,
  mockGetAuthors,
  mockGetByReader,
  mockGetCollaboration,
  mockFetchBookShelves,
  mockUseUserStore,
} = vi.hoisted(() => ({
  mockGetAll: vi.fn().mockResolvedValue([]),
  mockGetAuthors: vi.fn().mockResolvedValue([]),
  mockGetByReader: vi.fn().mockResolvedValue([]),
  mockGetCollaboration: vi.fn().mockResolvedValue([]),
  mockFetchBookShelves: vi.fn().mockResolvedValue([]),
  mockUseUserStore: vi.fn(),
}));

// ─── Mocks de módulo ──────────────────────────────────────────────────────────

vi.mock("@/stores/userStore", () => ({
  useUserStore: mockUseUserStore,
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: vi.fn(function (this: Record<string, unknown>) {
    this.getAll = mockGetAll;
  }),
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

// ─── Imports do SUT ───────────────────────────────────────────────────────────

import { useDesktopNav } from "./useDesktopNav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("useDesktopNav — handlePrefetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Regressão: guard de autenticação em "Estatisticas" ────────────────────

  describe("Estatisticas — usuário NÃO autenticado (caso de regressão)", () => {
    it("não deve chamar statsService quando user é null", async () => {
      // Arrange
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Estatisticas");

      // Assert
      expect(mockGetByReader).not.toHaveBeenCalled();
      expect(mockGetCollaboration).not.toHaveBeenCalled();
    });
  });

  // ── Estatisticas — usuário autenticado ────────────────────────────────────

  describe("Estatisticas — usuário autenticado", () => {
    it("deve chamar statsService com o id do usuário autenticado", async () => {
      // Arrange
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Estatisticas");

      // Assert
      expect(mockGetByReader).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
      expect(mockGetCollaboration).toHaveBeenCalledWith(AUTHENTICATED_USER.id);
    });

    it('não deve chamar statsService com o fallback "Matheus"', async () => {
      // Arrange
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Estatisticas");

      // Assert
      expect(mockGetByReader).not.toHaveBeenCalledWith("Matheus");
      expect(mockGetCollaboration).not.toHaveBeenCalledWith("Matheus");
    });
  });

  // ── Meus Livros ───────────────────────────────────────────────────────────

  describe("Meus Livros", () => {
    it("não deve prefetch quando user é null", async () => {
      // Arrange
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Meus Livros");

      // Assert
      expect(mockGetAll).not.toHaveBeenCalled();
    });

    it("deve prefetch com o userId correto quando autenticado", async () => {
      // Arrange
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Meus Livros");

      // Assert
      expect(mockGetAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: AUTHENTICATED_USER.id }),
      );
    });
  });

  // ── Rotas públicas (sem guard de autenticação) ────────────────────────────

  describe("Ver Estantes", () => {
    it("deve prefetch independente de autenticação", async () => {
      // Arrange
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Ver Estantes");

      // Assert
      expect(mockFetchBookShelves).toHaveBeenCalledOnce();
    });
  });

  describe("Autores", () => {
    it("deve prefetch independente de autenticação", async () => {
      // Arrange
      mockUser(null);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Autores");

      // Assert
      expect(mockGetAuthors).toHaveBeenCalledOnce();
    });
  });

  // ── Label desconhecido ────────────────────────────────────────────────────

  describe("label desconhecido", () => {
    it("não deve acionar nenhum serviço", async () => {
      // Arrange
      mockUser(AUTHENTICATED_USER);
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useDesktopNav(), { wrapper });

      // Act
      await result.current.handlePrefetch("Inexistente");

      // Assert
      expect(mockGetAll).not.toHaveBeenCalled();
      expect(mockGetByReader).not.toHaveBeenCalled();
      expect(mockGetCollaboration).not.toHaveBeenCalled();
      expect(mockFetchBookShelves).not.toHaveBeenCalled();
      expect(mockGetAuthors).not.toHaveBeenCalled();
    });
  });
});
