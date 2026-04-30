import { describe, expect, it } from "vitest";

import {
  INITIAL_FILTERS,
  QUERY_KEYS,
  sortObjectKeys,
} from "./keys";

describe("sortObjectKeys (RN18 — chaves determinísticas na query key)", () => {
  it("devolve entrada inalterada para null ou undefined", () => {
    expect(sortObjectKeys(null as unknown as Record<string, unknown>)).toBeNull();
    expect(
      sortObjectKeys(undefined as unknown as Record<string, unknown>),
    ).toBeUndefined();
  });

  it("devolve entrada inalterada para array ou valor não-objeto", () => {
    const arr = [1, 2];
    expect(sortObjectKeys(arr as unknown as Record<string, unknown>)).toBe(arr);
    expect(sortObjectKeys(42 as unknown as Record<string, unknown>)).toBe(42);
  });

  it("ordena chaves lexicograficamente", () => {
    const sorted = sortObjectKeys({ z: 1, a: 2, m: 3 });
    expect(Object.keys(sorted)).toEqual(["a", "m", "z"]);
    expect(sorted).toEqual({ a: 2, m: 3, z: 1 });
  });
});

describe("INITIAL_FILTERS", () => {
  it("define estado inicial alinhado à visão Todos e filtros vazios", () => {
    expect(INITIAL_FILTERS).toEqual({
      readers: [],
      status: [],
      gender: [],
      view: "todos",
      userId: "",
      bookId: "",
      authorId: "",
      year: undefined,
      myBooks: false,
    });
  });
});

describe("QUERY_KEYS.books.list", () => {
  describe("readers array normalization (RN18)", () => {
    it("produces the same key for reader id permutations", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, b] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [b, a] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });

    it("produces the same key for three reader ids in any order", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const c = "33333333-3333-4333-8333-333333333333";
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [c, b, a] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, c, b] },
        "",
        0,
      );
      const keyC = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [b, a, c] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
      expect(JSON.stringify(keyB)).toBe(JSON.stringify(keyC));
    });

    it("produces different keys for different reader subsets", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const keyOnlyMatheus = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a] },
        "",
        0,
      );
      const keyBoth = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, b] },
        "",
        0,
      );

      expect(JSON.stringify(keyOnlyMatheus)).not.toBe(JSON.stringify(keyBoth));
    });
  });

  describe("status array normalization (RN18)", () => {
    it("produces the same key for status in any order", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, status: ["reading", "finished"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, status: ["finished", "reading"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });
  });

  describe("gender array normalization (RN18)", () => {
    it("produces the same key for gender in any order", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, gender: ["Romance", "Fantasia"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, gender: ["Fantasia", "Romance"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });
  });

  describe("key differentiation by other params", () => {
    it("produces different keys for different view filters", () => {
      const keyTodos = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, view: "todos" },
        "",
        0,
      );
      const keyJoint = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, view: "joint" },
        "",
        0,
      );

      expect(JSON.stringify(keyTodos)).not.toBe(JSON.stringify(keyJoint));
    });

    it("produces different keys for different search terms", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "harry", 0);
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "potter", 0);

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });

    it("produces different keys for different pages", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0);
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 1);

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });

    it("produces different keys for different userIds", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0, "user-1");
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0, "user-2");

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });
  });
});

describe("QUERY_KEYS.authors", () => {
  it("list inclui página e termo na ordem estável", () => {
    expect(QUERY_KEYS.authors.list(2, "borges")).toEqual([
      ...QUERY_KEYS.authors.all,
      "list",
      2,
      "borges",
    ]);
    expect(QUERY_KEYS.authors.list(0, "")).not.toEqual(
      QUERY_KEYS.authors.list(1, ""),
    );
  });
});

describe("QUERY_KEYS.stats", () => {
  it("byReader e collaboration diferenciam o id do leitor", () => {
    const reader = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(QUERY_KEYS.stats.byReader(reader)).toEqual([
      ...QUERY_KEYS.stats.all,
      "reader",
      reader,
    ]);
    expect(QUERY_KEYS.stats.collaboration(reader)).toEqual([
      ...QUERY_KEYS.stats.all,
      "collaboration",
      reader,
    ]);
    expect(JSON.stringify(QUERY_KEYS.stats.byReader(reader))).not.toBe(
      JSON.stringify(QUERY_KEYS.stats.collaboration(reader)),
    );
  });

  it("leaderboard inclui ano ou all", () => {
    expect(QUERY_KEYS.stats.leaderboard(2024)).toEqual([
      ...QUERY_KEYS.stats.all,
      "leaderboard",
      2024,
    ]);
    expect(QUERY_KEYS.stats.leaderboard("all")).toEqual([
      ...QUERY_KEYS.stats.all,
      "leaderboard",
      "all",
    ]);
  });
});

describe("QUERY_KEYS.search.autocomplete (RN22 — chave por termo)", () => {
  it("prefixa com search.all e diferencia o termo normalizado na chave", () => {
    expect(QUERY_KEYS.search.autocomplete("dune")).toEqual([
      ...QUERY_KEYS.search.all,
      "autocomplete",
      "dune",
    ]);
    expect(JSON.stringify(QUERY_KEYS.search.autocomplete("a"))).not.toBe(
      JSON.stringify(QUERY_KEYS.search.autocomplete("ab")),
    );
  });
});
