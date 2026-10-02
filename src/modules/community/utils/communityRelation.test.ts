import { describe, expect, it } from "vitest";

import {
  countMutualFollows,
  listCommunityRelationMarks,
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

describe("countMutualFollows", () => {
  it("conta só a interseção entre seguindo e seguidores", () => {
    expect(countMutualFollows(["ana", "bruno"], ["bruno", "carla"])).toBe(1);
  });

  it("retorna zero quando uma das listas está vazia", () => {
    expect(countMutualFollows([], ["ana"])).toBe(0);
    expect(countMutualFollows(["ana"], [])).toBe(0);
  });
});
