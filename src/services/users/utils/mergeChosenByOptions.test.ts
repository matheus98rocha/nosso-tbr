import { describe, expect, it } from "vitest";

import { mergeChosenByOptions } from "./mergeChosenByOptions";

describe("mergeChosenByOptions", () => {
  it("retorna só a rede quando não há readers do livro", () => {
    const network = [{ label: "Eu", value: "me" }];
    expect(mergeChosenByOptions(network, undefined, undefined)).toEqual(
      network,
    );
  });

  it("preserva leitores do livro que saíram da rede no edit", () => {
    const network = [{ label: "Eu", value: "me" }];
    expect(
      mergeChosenByOptions(
        network,
        ["me", "ex"],
        "Eu, Ex Amigo",
      ),
    ).toEqual([
      { label: "Eu", value: "me" },
      { label: "Ex Amigo", value: "ex" },
    ]);
  });

  it("usa fallback Leitor quando não há display", () => {
    expect(mergeChosenByOptions([], ["x"], "")).toEqual([
      { label: "Leitor", value: "x" },
    ]);
  });
});
