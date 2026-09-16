import { describe, expect, it } from "vitest";

import { resolveCommunityDisplayName } from "./resolveCommunityDisplayName";

describe("resolveCommunityDisplayName", () => {
  it("devolve o nome quando há texto útil", () => {
    expect(resolveCommunityDisplayName(" Ana ")).toBe("Ana");
  });

  it("usa Leitor para vazio, nulo ou UUID", () => {
    expect(resolveCommunityDisplayName("")).toBe("Leitor");
    expect(resolveCommunityDisplayName("   ")).toBe("Leitor");
    expect(resolveCommunityDisplayName(null)).toBe("Leitor");
    expect(
      resolveCommunityDisplayName("11111111-1111-4111-8111-111111111111"),
    ).toBe("Leitor");
  });
});
