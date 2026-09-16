import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookLookupData } from "../types/bookLookup.types";
import { useBookLookupV2 } from "./useBookLookupV2";

const foundBook: BookLookupData = {
  nome_do_livro: "Dom Quixote",
  autor: "Miguel de Cervantes",
  paginas: 863,
  url_capa: null,
  genero: "Fiction",
  isbn_13: null,
  isbn_10: null,
  fonte: "google_books",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useBookLookupV2 — clear", () => {
  it("define book e error como nulos e isLoading como false ao chamar clear", async () => {
    const deferred = createDeferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useBookLookupV2());

    let lookupPromise: Promise<void> = Promise.resolve();
    act(() => {
      lookupPromise = result.current.lookup({
        type: "title",
        value: "Dom Quixote",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    try {
      act(() => {
        result.current.clear();
      });

      expect(result.current.book).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    } finally {
      await act(async () => {
        deferred.resolve(
          new Response(JSON.stringify({ book: foundBook }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
        await lookupPromise;
      });
    }
  });

  it("ignora resposta atrasada do lookup após clear", async () => {
    const deferred = createDeferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useBookLookupV2());

    let lookupPromise: Promise<void> = Promise.resolve();
    act(() => {
      lookupPromise = result.current.lookup({
        type: "title",
        value: "Dom Quixote",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => {
      result.current.clear();
    });

    await act(async () => {
      deferred.resolve(
        new Response(JSON.stringify({ book: foundBook }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await lookupPromise;
    });

    expect(result.current.book).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("ignora erro HTTP atrasado após clear", async () => {
    const deferred = createDeferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(deferred.promise);

    const { result } = renderHook(() => useBookLookupV2());

    let lookupPromise: Promise<void> = Promise.resolve();
    act(() => {
      lookupPromise = result.current.lookup({
        type: "title",
        value: "Dom Quixote",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => {
      result.current.clear();
    });

    await act(async () => {
      deferred.resolve(
        new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await lookupPromise;
    });

    expect(result.current.book).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("aplica resultado de um lookup iniciado depois do clear", async () => {
    const first = createDeferred<Response>();
    const second = createDeferred<Response>();
    vi.spyOn(globalThis, "fetch")
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useBookLookupV2());

    let firstLookup: Promise<void> = Promise.resolve();
    act(() => {
      firstLookup = result.current.lookup({
        type: "title",
        value: "Antigo",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => {
      result.current.clear();
    });

    const newBook: BookLookupData = {
      ...foundBook,
      nome_do_livro: "Novo Livro",
    };

    let secondLookup: Promise<void> = Promise.resolve();
    act(() => {
      secondLookup = result.current.lookup({
        type: "title",
        value: "Novo",
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      first.resolve(
        new Response(JSON.stringify({ book: foundBook }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await firstLookup;
    });

    expect(result.current.book).toBeNull();

    await act(async () => {
      second.resolve(
        new Response(JSON.stringify({ book: newBook }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await secondLookup;
    });

    expect(result.current.book).toEqual(newBook);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
