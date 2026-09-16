import { describe, expect, it } from "vitest";

import { pickTopGenre } from "./pickTopGenre";

describe("pickTopGenre", () => {
  describe("RN-COM-07 / RN-COM-08", () => {
    it("escolhe o gênero com maior contagem", () => {
      expect(
        pickTopGenre([
          { gender: "fiction", count: 2 },
          { gender: "fantasy", count: 5 },
          { gender: "romance", count: 1 },
        ]),
      ).toBe("fantasy");
    });

    it("ignora gênero vazio ou só com espaço", () => {
      expect(
        pickTopGenre([
          { gender: "", count: 9 },
          { gender: "   ", count: 8 },
          { gender: "romance", count: 1 },
        ]),
      ).toBe("romance");
    });

    it("ignora contagem menor ou igual a zero", () => {
      expect(
        pickTopGenre([
          { gender: "fiction", count: 0 },
          { gender: "fantasy", count: -3 },
          { gender: "romance", count: 2 },
        ]),
      ).toBe("romance");
    });

    it("retorna null para lista vazia", () => {
      expect(pickTopGenre([])).toBeNull();
    });

    it("retorna null quando nenhum gênero é elegível", () => {
      expect(
        pickTopGenre([
          { gender: "", count: 4 },
          { gender: "fantasy", count: 0 },
        ]),
      ).toBeNull();
    });

    it("desempata pelo rótulo pt-BR: Fantasia vence Ficção", () => {
      expect(
        pickTopGenre([
          { gender: "fiction", count: 3 },
          { gender: "fantasy", count: 3 },
        ]),
      ).toBe("fantasy");
    });

    it("usa o value cru como rótulo quando o gênero é desconhecido", () => {
      expect(
        pickTopGenre([
          { gender: "omega", count: 2 },
          { gender: "alpha", count: 2 },
        ]),
      ).toBe("alpha");
    });
  });
});
