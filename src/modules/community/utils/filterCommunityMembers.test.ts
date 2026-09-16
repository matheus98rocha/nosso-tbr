import { describe, expect, it } from "vitest";

import type { CommunityMember } from "../types/community.types";
import {
  filterCommunityMembers,
  parseCommunityView,
} from "./filterCommunityMembers";

const SELF_ID = "self-1";

function member(
  overrides: Partial<CommunityMember> & Pick<CommunityMember, "id">,
): CommunityMember {
  return {
    displayName: overrides.displayName ?? overrides.id,
    avatarSeed: null,
    isFollowing: false,
    isFollower: false,
    mostReadGender: null,
    mostRegisteredGender: null,
    registeredCount: 0,
    finishedCount: 0,
    currentlyReadingTitle: null,
    ...overrides,
  };
}

const ana = member({
  id: "ana",
  displayName: "Ana",
  isFollowing: true,
  isFollower: false,
});

const jose = member({
  id: "jose",
  displayName: "José",
  isFollowing: false,
  isFollower: true,
});

const bruno = member({
  id: "bruno",
  displayName: "Bruno",
  isFollowing: true,
  isFollower: true,
});

const self = member({
  id: SELF_ID,
  displayName: "Eu Mesmo",
  isFollowing: false,
  isFollower: true,
});

const members: CommunityMember[] = [bruno, self, jose, ana];

describe("parseCommunityView", () => {
  describe("RN-COM-12", () => {
    it("aceita todos, seguidores e seguindo", () => {
      expect(parseCommunityView("todos")).toBe("todos");
      expect(parseCommunityView("seguidores")).toBe("seguidores");
      expect(parseCommunityView("seguindo")).toBe("seguindo");
    });

    it("cai em todos quando o valor é nulo ou inválido", () => {
      expect(parseCommunityView(null)).toBe("todos");
      expect(parseCommunityView(undefined)).toBe("todos");
      expect(parseCommunityView("")).toBe("todos");
      expect(parseCommunityView("followers")).toBe("todos");
      expect(parseCommunityView("TODOS")).toBe("todos");
    });
  });
});

describe("filterCommunityMembers", () => {
  describe("RN-COM-02 / RN-COM-03 / RN-COM-04", () => {
    it("nunca inclui o selfId em nenhum recorte", () => {
      const views = ["todos", "seguidores", "seguindo"] as const;

      for (const view of views) {
        const result = filterCommunityMembers(members, {
          view,
          search: "",
          selfId: SELF_ID,
        });

        expect(result.some((item) => item.id === SELF_ID)).toBe(false);
      }
    });

    it("no recorte todos lista todos os cadastrados exceto o logado", () => {
      const result = filterCommunityMembers(members, {
        view: "todos",
        search: "",
        selfId: SELF_ID,
      });

      expect(result.map((item) => item.id)).toEqual(["ana", "bruno", "jose"]);
    });

    it("no recorte seguidores lista só quem tem isFollower", () => {
      const result = filterCommunityMembers(members, {
        view: "seguidores",
        search: "",
        selfId: SELF_ID,
      });

      expect(result.map((item) => item.id)).toEqual(["bruno", "jose"]);
      expect(result.every((item) => item.isFollower)).toBe(true);
    });

    it("no recorte seguindo lista só quem tem isFollowing", () => {
      const result = filterCommunityMembers(members, {
        view: "seguindo",
        search: "",
        selfId: SELF_ID,
      });

      expect(result.map((item) => item.id)).toEqual(["ana", "bruno"]);
      expect(result.every((item) => item.isFollowing)).toBe(true);
    });

    it("não altera a lista original para o caller contar a rede fora da busca", () => {
      const snapshot = [...members];

      const filtered = filterCommunityMembers(members, {
        view: "todos",
        search: "Ana",
        selfId: SELF_ID,
      });

      expect(filtered.map((item) => item.id)).toEqual(["ana"]);
      expect(members).toEqual(snapshot);
      expect(
        members.filter((item) => item.id !== SELF_ID && item.isFollowing),
      ).toHaveLength(2);
      expect(
        members.filter((item) => item.id !== SELF_ID && item.isFollower),
      ).toHaveLength(2);
    });
  });

  describe("RN-COM-12 / busca por nome", () => {
    it("filtra displayName sem distinguir acento", () => {
      const result = filterCommunityMembers(members, {
        view: "todos",
        search: "jose",
        selfId: SELF_ID,
      });

      expect(result.map((item) => item.id)).toEqual(["jose"]);
    });

    it("aplica a busca só no recorte atual", () => {
      const result = filterCommunityMembers(members, {
        view: "seguindo",
        search: "bru",
        selfId: SELF_ID,
      });

      expect(result.map((item) => item.id)).toEqual(["bruno"]);
    });

    it("não devolve o logado mesmo quando o nome bate com a busca", () => {
      const result = filterCommunityMembers(members, {
        view: "todos",
        search: "Eu",
        selfId: SELF_ID,
      });

      expect(result).toEqual([]);
    });
  });
});
