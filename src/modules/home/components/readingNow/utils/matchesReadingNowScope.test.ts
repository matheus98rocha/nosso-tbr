import { describe, expect, it } from "vitest";

import { matchesReadingNowScope } from "./matchesReadingNowScope";

describe("matchesReadingNowScope", () => {
  it("trata como solo só quando há um leitor e ele é o escolhido", () => {
    const solo = { readerIds: ["matheus"], chosen_by: "matheus" };

    expect(matchesReadingNowScope(solo, "solo")).toBe(true);
    expect(matchesReadingNowScope(solo, "collective")).toBe(false);
  });

  it("trata como coletiva quando há mais de um leitor", () => {
    const collective = {
      readerIds: ["emily", "matheus"],
      chosen_by: "emily",
    };

    expect(matchesReadingNowScope(collective, "collective")).toBe(true);
    expect(matchesReadingNowScope(collective, "solo")).toBe(false);
  });
});