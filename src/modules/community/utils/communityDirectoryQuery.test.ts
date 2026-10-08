import { describe, expect, it } from "vitest";

import {
  parseCommunityPage,
  resolveCommunityMemberIds,
  toCommunityNamePattern,
} from "./communityDirectoryQuery";

describe("parseCommunityPage", () => {
  it("usa a primeira página quando o parâmetro está vazio ou inválido", () => {
    expect(parseCommunityPage(null)).toBe(0);
    expect(parseCommunityPage("")).toBe(0);
    expect(parseCommunityPage("abc")).toBe(0);
    expect(parseCommunityPage("-1")).toBe(0);
    expect(parseCommunityPage("1.5")).toBe(0);
  });

  it("aceita página inteira a partir de zero", () => {
    expect(parseCommunityPage("0")).toBe(0);
    expect(parseCommunityPage("2")).toBe(2);
  });
});

describe("resolveCommunityMemberIds", () => {
  it("não restringe ids no recorte de todos", () => {
    expect(resolveCommunityMemberIds("todos", ["ana"], ["bruno"])).toBeNull();
  });

  it("usa quem o usuário segue no recorte seguindo", () => {
    expect(resolveCommunityMemberIds("seguindo", ["ana"], ["bruno"])).toEqual([
      "ana",
    ]);
  });

  it("usa quem segue o usuário no recorte seguidores", () => {
    expect(
      resolveCommunityMemberIds("seguidores", ["ana"], ["bruno"]),
    ).toEqual(["bruno"]);
  });

  it("usa só a interseção no recorte mútuo", () => {
    expect(
      resolveCommunityMemberIds("mutuos", ["ana", "bruno"], ["bruno", "carla"]),
    ).toEqual(["bruno"]);
  });
});

describe("toCommunityNamePattern", () => {
  it("omite o filtro quando a busca está vazia", () => {
    expect(toCommunityNamePattern("   ")).toBeNull();
  });

  it("monta ilike e escapa curingas", () => {
    expect(toCommunityNamePattern(" Ana ")).toBe("%Ana%");
    expect(toCommunityNamePattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });
});
