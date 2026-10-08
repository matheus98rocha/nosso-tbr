import { describe, expect, it } from "vitest";

import {
  countMutualFollows,
  listCommunityRelationMarks,
  shouldShowCommunityLibraryCounts,
} from "./communityRelation";

describe("listCommunityRelationMarks", () => {
  it("marca quando o usuário logado segue o leitor", () => {
    expect(
      listCommunityRelationMarks({ isFollowing: true, isFollower: false }),
    ).toEqual([{ id: "following", label: "Você segue" }]);
  });

  it("marca quando o leitor segue o usuário logado", () => {
    expect(
      listCommunityRelationMarks({ isFollowing: false, isFollower: true }),
    ).toEqual([{ id: "follower", label: "Te segue" }]);
  });

  it("mostra as duas marcas quando a relação é mútua", () => {
    expect(
      listCommunityRelationMarks({ isFollowing: true, isFollower: true }),
    ).toEqual([
      { id: "following", label: "Você segue" },
      { id: "follower", label: "Te segue" },
    ]);
  });

  it("não inventa relação quando ninguém segue ninguém", () => {
    expect(
      listCommunityRelationMarks({ isFollowing: false, isFollower: false }),
    ).toEqual([]);
  });
});

describe("shouldShowCommunityLibraryCounts", () => {
  it("esconde cadastrados e lidos quando ninguém segue ninguém", () => {
    expect(
      shouldShowCommunityLibraryCounts({
        isFollowing: false,
        isFollower: false,
      }),
    ).toBe(false);
  });

  it("mostra cadastrados e lidos quando o usuário segue o leitor", () => {
    expect(
      shouldShowCommunityLibraryCounts({
        isFollowing: true,
        isFollower: false,
      }),
    ).toBe(true);
  });

  it("mostra cadastrados e lidos quando o leitor segue o usuário", () => {
    expect(
      shouldShowCommunityLibraryCounts({
        isFollowing: false,
        isFollower: true,
      }),
    ).toBe(true);
  });
});

describe("countMutualFollows", () => {
  it("conta só a interseção entre seguindo e seguidores", () => {
    expect(countMutualFollows(["ana", "bruno"], ["bruno", "carla"])).toBe(1);
  });

  it("retorna zero quando uma das listas está vazia", () => {
    expect(countMutualFollows([], ["ana"])).toBe(0);
    expect(countMutualFollows(["ana"], [])).toBe(0);
  });
});
