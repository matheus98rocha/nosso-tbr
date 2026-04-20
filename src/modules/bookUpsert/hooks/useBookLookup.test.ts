import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { useBookLookup } from "./useBookLookup";
import { BookCandidate } from "../types/bookCandidate.types";

const mockCandidate: BookCandidate = {
  title: "O Senhor dos Anéis",
  author_name: "J.R.R. Tolkien",
  pages: 1200,
  image_url: "https://example.com/cover.jpg",
  gender: "Fantasy",
  publisher: "Allen & Unwin",
  published_date: "1954",
  isbn: "9780618640157",
  source: "google_books",
};

const mockSuccessResponse = {
  candidates: [mockCandidate],
  query: "senhor dos aneis",
  total: 1,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useBookLookup — estado inicial", () => {
  it("inicializa com valores padrão", () => {
    const { result } = renderHook(() => useBookLookup());

    expect(result.current.candidates).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.lookupQuery).toBe("");
  });
});

describe("useBookLookup — handleLookupQueryChange", () => {
  it("atualiza lookupQuery com o valor digitado", () => {
    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("Harry Potter");
    });

    expect(result.current.lookupQuery).toBe("Harry Potter");
  });

  it("não limpa candidates quando a query tem conteúdo", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSuccessResponse), { status: 200 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("Tolkien");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    act(() => {
      result.current.handleLookupQueryChange("Tolkie");
    });

    expect(result.current.candidates).toEqual([mockCandidate]);
    expect(result.current.hasSearched).toBe(true);
  });

  it("limpa candidates e hasSearched quando a query fica vazia", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSuccessResponse), { status: 200 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("Tolkien");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.hasSearched).toBe(true);

    act(() => {
      result.current.handleLookupQueryChange("");
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.lookupQuery).toBe("");
  });

  it("limpa candidates quando a query contém apenas espaços em branco", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSuccessResponse), { status: 200 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("Tolkien");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    act(() => {
      result.current.handleLookupQueryChange("   ");
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });
});

describe("useBookLookup — clearCandidates", () => {
  it("reseta candidates, hasSearched e lookupQuery para os valores iniciais", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSuccessResponse), { status: 200 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("Tolkien");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(result.current.candidates).toHaveLength(1);

    act(() => {
      result.current.clearCandidates();
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.lookupQuery).toBe("");
  });
});

describe("useBookLookup — handleSearchBooks", () => {
  it("não chama fetch quando lookupQuery está vazia", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useBookLookup());

    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("não chama fetch quando lookupQuery contém apenas espaços", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("   ");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("atualiza candidates e hasSearched após busca bem-sucedida", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockSuccessResponse), { status: 200 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("senhor dos aneis");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(result.current.candidates).toEqual([mockCandidate]);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isSearching).toBe(false);
  });

  it("define hasSearched como true mesmo quando não há resultados", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ candidates: [], query: "xyz", total: 0 }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("xyz");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.hasSearched).toBe(true);
  });

  it("define hasSearched como true mesmo quando a API retorna erro", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    const { result } = renderHook(() => useBookLookup());

    act(() => {
      result.current.handleLookupQueryChange("query");
    });
    await act(async () => {
      result.current.handleSearchBooks();
    });

    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.candidates).toEqual([]);
  });
});
