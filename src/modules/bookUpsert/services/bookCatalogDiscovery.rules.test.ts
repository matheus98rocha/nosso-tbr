import { describe, expect, it } from "vitest";
import {
  isSuggestJoinReadingAllowed,
  pickCounterpartReaderId,
  userParticipatesInBook,
} from "./bookCatalogDiscovery.rules";

describe("bookCatalogDiscovery.rules", () => {
  describe("userParticipatesInBook", () => {
    it("retorna true quando o usuário é chosen_by", () => {
      expect(
        userParticipatesInBook("u1", "u1", ["u2"]),
      ).toBe(true);
    });

    it("retorna true quando o usuário está em readers", () => {
      expect(
        userParticipatesInBook("u2", "u1", ["u2", "u3"]),
      ).toBe(true);
    });

    it("retorna false quando não é chosen_by nem reader", () => {
      expect(
        userParticipatesInBook("u9", "u1", ["u2", "u3"]),
      ).toBe(false);
    });
  });

  describe("pickCounterpartReaderId", () => {
    it("prioriza chosen_by quando é outro usuário", () => {
      expect(
        pickCounterpartReaderId("alice", ["bob"], "carol"),
      ).toBe("alice");
    });

    it("usa reader diferente do atual quando chosen_by é o próprio usuário", () => {
      expect(
        pickCounterpartReaderId("carol", ["alice", "bob"], "carol"),
      ).toBe("alice");
    });

    it("retorna null quando não há outro leitor", () => {
      expect(pickCounterpartReaderId(null, [], "u1")).toBeNull();
      expect(pickCounterpartReaderId("u1", ["u1"], "u1")).toBeNull();
    });
  });

  describe("isSuggestJoinReadingAllowed", () => {
    it("exige não participar, not_started e mútuo seguir", () => {
      expect(
        isSuggestJoinReadingAllowed(false, "not_started", true),
      ).toBe(true);
      expect(
        isSuggestJoinReadingAllowed(true, "not_started", true),
      ).toBe(false);
      expect(
        isSuggestJoinReadingAllowed(false, "reading", true),
      ).toBe(false);
      expect(
        isSuggestJoinReadingAllowed(false, "not_started", false),
      ).toBe(false);
    });
  });
});
