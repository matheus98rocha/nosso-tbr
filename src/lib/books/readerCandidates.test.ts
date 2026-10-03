import { describe, expect, it } from "vitest";

import {
  canSearchReaderCandidates,
  excludeCurrentReaders,
  matchesReaderCandidate,
  toReaderCandidateOrFilter,
  toReaderCandidates,
  toReaderSearchPattern,
} from "./readerCandidates";

describe("candidatos a leitor", () => {
  it("exige ao menos duas letras para buscar", () => {
    expect(canSearchReaderCandidates(" a ")).toBe(false);
    expect(canSearchReaderCandidates("an")).toBe(true);
  });

  it("remove quem já lê o livro e a própria pessoa", () => {
    expect(
      excludeCurrentReaders(
        ["ana", "bia", "me", "ana", " "],
        ["ana"],
        "me",
      ),
    ).toEqual(["bia"]);
  });

  it("monta um filtro de nome ou e-mail sem curingas crus", () => {
    expect(toReaderSearchPattern("a_na%")).toBe("%a\\_na\\%%");
    expect(toReaderCandidateOrFilter(toReaderSearchPattern("a_na%") ?? "")).toBe(
      'display_name.ilike."%a\\_na\\%%",email.ilike."%a\\_na\\%%"',
    );
  });

  it("aceita correspondência por nome ou e-mail", () => {
    expect(
      matchesReaderCandidate(
        { display_name: "Bianca", email: "bia@mail.com" },
        "BIA",
      ),
    ).toBe(true);
    expect(
      matchesReaderCandidate(
        { display_name: "Carlos", email: "bia@mail.com" },
        "mail.com",
      ),
    ).toBe(true);
    expect(
      matchesReaderCandidate(
        { display_name: "Carlos", email: "carlos@mail.com" },
        "bia",
      ),
    ).toBe(false);
  });

  it("esconde quem não é seguido, quem já está no livro e nome vazio", () => {
    const candidates = toReaderCandidates(
      [
        { id: "bia", display_name: "Bianca", email: "bia@mail.com" },
        { id: "ana", display_name: "Ana", email: "ana@mail.com" },
        { id: "fora", display_name: "Fora", email: "fora@mail.com" },
        { id: "vazio", display_name: "  ", email: "vazio@mail.com" },
      ],
      new Set(["bia", "ana", "vazio"]),
      new Set(["ana"]),
      "mail",
    );

    expect(candidates).toEqual([
      { id: "bia", displayName: "Bianca", email: "bia@mail.com" },
      { id: "vazio", displayName: "Leitor", email: "vazio@mail.com" },
    ]);
  });
});
