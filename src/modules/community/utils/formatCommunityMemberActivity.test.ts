import { describe, expect, it } from "vitest";

import { formatCommunityMemberActivity } from "./formatCommunityMemberActivity";

describe("formatCommunityMemberActivity", () => {
  describe("RN-COM-13 / contagens visíveis", () => {
    it("pluraliza zero cadastrados e zero lidos", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 0,
          finishedCount: 0,
          currentlyReadingTitle: null,
        }).countsLabel,
      ).toBe("0 cadastrados · 0 lidos");
    });

    it("pluraliza um cadastrado e um lido", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 1,
          finishedCount: 1,
          currentlyReadingTitle: null,
        }).countsLabel,
      ).toBe("1 cadastrado · 1 lido");
    });

    it("pluraliza vários cadastrados e vários lidos", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 12,
          finishedCount: 8,
          currentlyReadingTitle: null,
        }).countsLabel,
      ).toBe("12 cadastrados · 8 lidos");
    });
  });

  describe("RN-COM-13 / leitura atual", () => {
    it("monta Lendo com o título visível", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 2,
          finishedCount: 1,
          currentlyReadingTitle: "O Nome do Vento",
        }).currentlyReadingLabel,
      ).toBe("Lendo O Nome do Vento");
    });

    it("omite a leitura quando o título é nulo", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 2,
          finishedCount: 0,
          currentlyReadingTitle: null,
        }).currentlyReadingLabel,
      ).toBeNull();
    });

    it("omite a leitura quando o título é vazio ou só espaço", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 1,
          finishedCount: 0,
          currentlyReadingTitle: "",
        }).currentlyReadingLabel,
      ).toBeNull();
      expect(
        formatCommunityMemberActivity({
          registeredCount: 1,
          finishedCount: 0,
          currentlyReadingTitle: "   ",
        }).currentlyReadingLabel,
      ).toBeNull();
    });

    it("usa o título sem espaços nas pontas", () => {
      expect(
        formatCommunityMemberActivity({
          registeredCount: 1,
          finishedCount: 0,
          currentlyReadingTitle: "  O Nome do Vento  ",
        }).currentlyReadingLabel,
      ).toBe("Lendo O Nome do Vento");
    });
  });
});
