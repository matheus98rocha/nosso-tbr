import { describe, expect, it } from "vitest";

import {
  AVATAR_CATALOG,
  AVATAR_OPTIONS,
  buildCatalogAvatarUrl,
  buildDiceBearAvatarUrl,
  isReadingAvatarSeed,
  isStoredAvatarSeed,
} from "./index";

describe("avatarCatalog", () => {
  it("expõe catálogo com 24 avatares para fileiras de 8", () => {
    expect(AVATAR_CATALOG).toHaveLength(24);
    expect(AVATAR_CATALOG.length % 8).toBe(0);
    expect(AVATAR_CATALOG[0]?.seed).toBe("StephenKing");
    expect(AVATAR_OPTIONS).toHaveLength(AVATAR_CATALOG.length);
  });

  it("valida seeds do catálogo e rejeita valores inválidos", () => {
    expect(isReadingAvatarSeed("StephenKing")).toBe(true);
    expect(isReadingAvatarSeed("Agatha")).toBe(true);
    expect(isReadingAvatarSeed("invalid-seed")).toBe(false);
    expect(isReadingAvatarSeed(null)).toBe(false);
  });

  it("aceita seeds persistidas para exibição", () => {
    expect(isStoredAvatarSeed("StephenKing")).toBe(true);
    expect(isStoredAvatarSeed("")).toBe(false);
    expect(isStoredAvatarSeed(null)).toBe(false);
  });
});

describe("buildDiceBearAvatarUrl", () => {
  it("gera URL avataaars com opções de cor e diversidade", () => {
    const url = buildCatalogAvatarUrl("Agatha");

    expect(url).toContain("https://api.dicebear.com/9.x/avataaars/svg");
    expect(url).toContain("seed=Agatha");
    expect(url).toContain("skinColor=ffdbb4");
    expect(url).toContain("backgroundColor=a29bfe");
    expect(url).toContain("top=hijab");
  });

  it("aceita size opcional para exibição", () => {
    const url = buildDiceBearAvatarUrl({
      seed: "Capitu",
      size: 96,
      options: AVATAR_CATALOG.find((entry) => entry.seed === "Capitu")?.options,
    });

    expect(url).toContain("seed=Capitu");
    expect(url).toContain("size=96");
    expect(url).toContain("skinColor=edb98a");
  });
});
