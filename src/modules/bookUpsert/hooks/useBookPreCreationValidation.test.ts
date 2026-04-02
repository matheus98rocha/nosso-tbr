import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBookPreCreationValidation } from "./useBookPreCreationValidation";
import { BookCatalogMatchResult } from "../types/bookDiscovery.types";

const basePayload = {
  title: "O Senhor dos Aneis",
  author_id: "author-1",
  chosen_by: "user-1",
  readers: ["user-1"],
  pages: 500,
};

function createMatch(
  overrides?: Partial<BookCatalogMatchResult>,
): BookCatalogMatchResult {
  return {
    kind: "exact",
    userAlreadyLinked: false,
    candidate: {
      id: "book-1",
      title: "O Senhor dos Anéis",
      authorId: "author-1",
      authorName: "J.R.R Tolkien",
      imageUrl: null,
      synopsis: null,
      publisher: null,
      readers: [],
    },
    ...overrides,
  };
}

describe("useBookPreCreationValidation", () => {
  it("retorna bloqueio quando encontra duplicidade e usuário já está vinculado", async () => {
    const service = {
      findCatalogBookMatch: vi.fn().mockResolvedValue(createMatch({ userAlreadyLinked: true })),
      linkReaderToExistingBook: vi.fn(),
    };

    const { result } = renderHook(() =>
      useBookPreCreationValidation({
        isEdit: false,
        currentUserId: "user-1",
        bookUpsertService: service as never,
      }),
    );

    await act(async () => {
      const decision = await result.current.validateBeforeCreate(basePayload as never);
      expect(decision.type).toBe("block_duplicate");
    });

    expect(result.current.isDiscoveryOpen).toBe(false);
  });

  it("abre descoberta para sugestão com string exata", async () => {
    const service = {
      findCatalogBookMatch: vi.fn().mockResolvedValue(createMatch({ kind: "exact" })),
      linkReaderToExistingBook: vi.fn(),
    };

    const { result } = renderHook(() =>
      useBookPreCreationValidation({
        isEdit: false,
        currentUserId: "user-1",
        bookUpsertService: service as never,
      }),
    );

    await act(async () => {
      const decision = await result.current.validateBeforeCreate(basePayload as never);
      expect(decision.type).toBe("suggest_existing");
    });

    expect(result.current.isDiscoveryOpen).toBe(true);
    expect(result.current.matchedBook?.kind).toBe("exact");
  });

  it("abre descoberta para sugestão com string aproximada", async () => {
    const service = {
      findCatalogBookMatch: vi.fn().mockResolvedValue(createMatch({ kind: "approximate" })),
      linkReaderToExistingBook: vi.fn(),
    };

    const { result } = renderHook(() =>
      useBookPreCreationValidation({
        isEdit: false,
        currentUserId: "user-1",
        bookUpsertService: service as never,
      }),
    );

    await act(async () => {
      const decision = await result.current.validateBeforeCreate(basePayload as never);
      expect(decision.type).toBe("suggest_existing");
    });

    expect(result.current.matchedBook?.kind).toBe("approximate");
  });

  it("executa fluxo de vinculação com livro sugerido", async () => {
    const service = {
      findCatalogBookMatch: vi.fn().mockResolvedValue(createMatch()),
      linkReaderToExistingBook: vi.fn().mockResolvedValue(undefined),
    };

    const { result } = renderHook(() =>
      useBookPreCreationValidation({
        isEdit: false,
        currentUserId: "user-1",
        bookUpsertService: service as never,
      }),
    );

    await act(async () => {
      await result.current.validateBeforeCreate(basePayload as never);
    });

    await act(async () => {
      const linked = await result.current.linkUserToExistingBook();
      expect(linked).toBe(true);
    });

    expect(service.linkReaderToExistingBook).toHaveBeenCalledWith("book-1");
    expect(result.current.matchedBook).toBeNull();
  });
});
