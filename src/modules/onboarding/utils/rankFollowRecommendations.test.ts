import { describe, expect, it } from "vitest";

import {
  FOLLOW_RECOMMENDATION_LIMIT,
  formatFollowRecommendationReason,
  rankFollowRecommendations,
} from "./rankFollowRecommendations";

describe("rankFollowRecommendations", () => {
  it("exclui self e quem já segue", () => {
    const result = rankFollowRecommendations({
      selfId: "me",
      followingIds: ["already"],
      selfGenders: ["fantasy"],
      candidates: [
        {
          id: "me",
          displayName: "Eu",
          avatarSeed: null,
          registeredCount: 9,
          genreRows: [
            { gender: "fantasy", finishedCount: 5, registeredCount: 5 },
          ],
        },
        {
          id: "already",
          displayName: "Já",
          avatarSeed: null,
          registeredCount: 4,
          genreRows: [
            { gender: "fantasy", finishedCount: 4, registeredCount: 4 },
          ],
        },
        {
          id: "ana",
          displayName: "Ana",
          avatarSeed: "a",
          registeredCount: 3,
          genreRows: [
            { gender: "fantasy", finishedCount: 2, registeredCount: 3 },
          ],
        },
      ],
    });

    expect(result.map((item) => item.readerId)).toEqual(["ana"]);
  });

  it("prioriza overlap de gênero e cita o motivo", () => {
    const result = rankFollowRecommendations({
      selfId: "me",
      followingIds: [],
      selfGenders: ["fantasy"],
      candidates: [
        {
          id: "carla",
          displayName: "Carla",
          avatarSeed: null,
          registeredCount: 20,
          genreRows: [
            { gender: "romance", finishedCount: 10, registeredCount: 20 },
          ],
        },
        {
          id: "bia",
          displayName: "Bia",
          avatarSeed: null,
          registeredCount: 2,
          genreRows: [
            { gender: "fantasy", finishedCount: 2, registeredCount: 2 },
          ],
        },
      ],
    });

    expect(result[0]?.readerId).toBe("bia");
    expect(result[0]?.reason).toEqual({
      kind: "shared_genre",
      gender: "fantasy",
    });
    expect(result[1]?.reason.kind).toBe("active_reader");
  });

  it("fallback active_reader ordena por atividade e não inventa gênero", () => {
    const result = rankFollowRecommendations({
      selfId: "me",
      followingIds: [],
      selfGenders: [],
      candidates: [
        {
          id: "a",
          displayName: "Ana",
          avatarSeed: null,
          registeredCount: 2,
          genreRows: [
            { gender: "fantasy", finishedCount: 2, registeredCount: 2 },
          ],
        },
        {
          id: "b",
          displayName: "Bruno",
          avatarSeed: null,
          registeredCount: 8,
          genreRows: [],
        },
      ],
    });

    expect(result.every((item) => item.reason.kind === "active_reader")).toBe(
      true,
    );
    expect(result[0]?.readerId).toBe("b");
  });

  it("respeita o limite padrão", () => {
    const candidates = Array.from({ length: 8 }, (_, index) => ({
      id: `u${index}`,
      displayName: `User ${index}`,
      avatarSeed: null,
      registeredCount: index,
      genreRows: [] as Array<{
        gender: string;
        finishedCount: number;
        registeredCount: number;
      }>,
    }));

    const result = rankFollowRecommendations({
      selfId: "me",
      followingIds: [],
      selfGenders: [],
      candidates,
    });

    expect(result).toHaveLength(FOLLOW_RECOMMENDATION_LIMIT);
  });

  it("usa rótulo Leitor quando o nome está vazio", () => {
    const result = rankFollowRecommendations({
      selfId: "me",
      followingIds: [],
      selfGenders: [],
      candidates: [
        {
          id: "x",
          displayName: "   ",
          avatarSeed: null,
          registeredCount: 1,
          genreRows: [],
        },
      ],
    });

    expect(result[0]?.displayName).toBe("Leitor");
  });
});

describe("formatFollowRecommendationReason", () => {
  it("formata gênero compartilhado em pt-BR", () => {
    expect(
      formatFollowRecommendationReason({
        kind: "shared_genre",
        gender: "fantasy",
      }),
    ).toBe("Também curte Fantasia");
  });

  it("formata leitor ativo sem alegar gênero", () => {
    expect(
      formatFollowRecommendationReason({ kind: "active_reader" }),
    ).toBe("Leitor ativo na comunidade");
  });
});
