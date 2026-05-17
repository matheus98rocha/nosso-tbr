import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  getReadingProgressManyQueryKey,
  getReadingProgressSingleQueryKey,
  invalidateReadingProgressManyCaches,
} from "./readingProgressQueryKey";

describe("getReadingProgressSingleQueryKey", () => {
  it("inclui livro e usuário sob o prefixo schedule", () => {
    expect(getReadingProgressSingleQueryKey("book-1", "user-1")).toEqual([
      "schedule",
      "book-1",
      "progress",
      "user-1",
    ]);
  });

  it("aceita userId indefinido", () => {
    expect(getReadingProgressSingleQueryKey("book-1", undefined)).toEqual([
      "schedule",
      "book-1",
      "progress",
      undefined,
    ]);
  });
});

describe("getReadingProgressManyQueryKey", () => {
  it("normaliza a ordem dos bookIds para garantir cache key estável", () => {
    const a = getReadingProgressManyQueryKey(["b", "a", "c"], "user-1");
    const b = getReadingProgressManyQueryKey(["c", "a", "b"], "user-1");
    expect(a).toEqual(b);
  });

  it("usa prefixo schedule/progress/many", () => {
    const key = getReadingProgressManyQueryKey(["a", "b"], "user-1");
    expect(key[0]).toBe("schedule");
    expect(key[1]).toBe("progress");
    expect(key[2]).toBe("many");
    expect(key[3]).toBe("a|b");
    expect(key[4]).toBe("user-1");
  });

  it("trata lista vazia gerando hash vazio", () => {
    const key = getReadingProgressManyQueryKey([], "user-1");
    expect(key[3]).toBe("");
  });

  it("não muta o array de entrada", () => {
    const input = ["c", "a", "b"];
    const snapshot = [...input];
    getReadingProgressManyQueryKey(input, "user-1");
    expect(input).toEqual(snapshot);
  });
});

describe("invalidateReadingProgressManyCaches", () => {
  it("invalida queries que casam o predicado do cache many", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateReadingProgressManyCaches(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    const arg = invalidateQueries.mock.calls[0][0] as {
      predicate: (q: { queryKey: unknown }) => boolean;
    };

    expect(arg.predicate({ queryKey: ["schedule", "progress", "many", "a|b", "u"] })).toBe(true);
    expect(arg.predicate({ queryKey: ["schedule", "book-1", "u"] })).toBe(false);
    expect(arg.predicate({ queryKey: ["books", "list"] })).toBe(false);
    expect(arg.predicate({ queryKey: "not-array" })).toBe(false);
  });
});
