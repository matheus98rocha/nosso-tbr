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
    suggestJoinEligible: false,
    candidate: {
      id: "book-1",
      title: "O Senhor dos Anéis",
      authorId: "author-1",
      authorName: "J.R.R Tolkien",
      imageUrl: null,
      pages: null,
      readers: [],
      chosenBy: null,
      chosenByDisplayName: null,
      status: "not_started",
    },
    ...overrides,
  };
}

describe("useBookPreCreationValidation", () => {
  it("em modo edição não consulta o catálogo e retorna create_new", async () => {
    const findCatalogBookMatch = vi.fn();
    const service = {
      findCatalogBookMatch,
      linkReaderToExistingBook: vi.fn(),
    };

    const { result } = renderHook(() =>
      useBookPreCreationValidation({
        isEdit: true,
        currentUserId: "user-1",
        bookUpsertService: service as never,
      }),
    );

    await act(async () => {
      const decision = await result.current.validateBeforeCreate(basePayload as never);
      expect(decision.type).toBe("create_new");
    });

    expect(findCatalogBookMatch).not.toHaveBeenCalled();
  });

  it("ignora verificação de duplicata e retorna create_new quando is_reread é true", async () => {
    const findCatalogBookMatch = vi.fn();
    const service = {
      findCatalogBookMatch,
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
      const decision = await result.current.validateBeforeCreate({
        ...basePayload,
        is_reread: true,
      } as never);
      expect(decision.type).toBe("create_new");
    });

    expect(findCatalogBookMatch).not.toHaveBeenCalled();
    expect(result.current.isParticipationBlockOpen).toBe(false);
    expect(result.current.isDiscoveryOpen).toBe(false);
  });

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
    expect(result.current.isParticipationBlockOpen).toBe(true);
  });

  it("abre descoberta para sugestão com string exata", async () => {
    const service = {
      findCatalogBookMatch: vi
        .fn()
        .mockResolvedValue(createMatch({ kind: "exact", suggestJoinEligible: true })),
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
      findCatalogBookMatch: vi
        .fn()
        .mockResolvedValue(createMatch({ kind: "approximate", suggestJoinEligible: true })),
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

  it("não abre descoberta quando o serviço não marca sugestão elegível", async () => {
    const service = {
      findCatalogBookMatch: vi
        .fn()
        .mockResolvedValue(createMatch({ suggestJoinEligible: false, userAlreadyLinked: false })),
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
      expect(decision.type).toBe("create_new");
    });

    expect(result.current.isDiscoveryOpen).toBe(false);
  });

  it("executa fluxo de vinculação com livro sugerido", async () => {
    const service = {
      findCatalogBookMatch: vi
        .fn()
        .mockResolvedValue(createMatch({ suggestJoinEligible: true })),
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

  it("takePendingPayloadForCreation retorna o payload e limpa estado de descoberta", async () => {
    const pending = {
      ...basePayload,
      title: "Pendente",
    };

    const service = {
      findCatalogBookMatch: vi
        .fn()
        .mockResolvedValue(createMatch({ suggestJoinEligible: true })),
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
      await result.current.validateBeforeCreate(pending as never);
    });

    expect(result.current.isDiscoveryOpen).toBe(true);
    expect(result.current.matchedBook).not.toBeNull();

    let taken: unknown;
    await act(async () => {
      taken = result.current.takePendingPayloadForCreation();
    });

    expect(taken).toEqual(pending);
    expect(result.current.matchedBook).toBeNull();
    expect(result.current.isDiscoveryOpen).toBe(false);
  });
});
