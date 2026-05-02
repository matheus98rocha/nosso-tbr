import { describe, expect, it } from "vitest";

import {
  PASSWORD_RULE_LABELS,
  getPasswordRuleStatuses,
  passwordHasLetter,
  passwordHasNumber,
  passwordMeetsMinLength,
} from "./passwordRules";

describe("passwordRules (RN37 — requisitos de senha no registro)", () => {
  describe("passwordMeetsMinLength", () => {
    it("retorna false com menos de 8 caracteres", () => {
      expect(passwordMeetsMinLength("1234567")).toBe(false);
      expect(passwordMeetsMinLength("")).toBe(false);
    });

    it("retorna true com 8 ou mais caracteres", () => {
      expect(passwordMeetsMinLength("12345678")).toBe(true);
      expect(passwordMeetsMinLength("abcdefgh")).toBe(true);
    });
  });

  describe("passwordHasLetter", () => {
    it("retorna false quando não há caractere de letra Unicode", () => {
      expect(passwordHasLetter("12345678")).toBe(false);
      expect(passwordHasLetter("______")).toBe(false);
    });

    it("retorna true com letras latinas ou acentuadas", () => {
      expect(passwordHasLetter("1a234567")).toBe(true);
      expect(passwordHasLetter("1234567é")).toBe(true);
      expect(passwordHasLetter("Ω123")).toBe(true);
    });
  });

  describe("passwordHasNumber", () => {
    it("retorna false sem dígito", () => {
      expect(passwordHasNumber("abcdefgh")).toBe(false);
    });

    it("retorna true com pelo menos um dígito", () => {
      expect(passwordHasNumber("senha1")).toBe(true);
      expect(passwordHasNumber("0abc")).toBe(true);
    });
  });

  describe("getPasswordRuleStatuses", () => {
    it("combina os três verificadores no mesmo objeto", () => {
      expect(getPasswordRuleStatuses("ab12")).toEqual({
        minLength: false,
        hasLetter: true,
        hasNumber: true,
      });
      expect(getPasswordRuleStatuses("senha123")).toEqual({
        minLength: true,
        hasLetter: true,
        hasNumber: true,
      });
    });
  });

  describe("PASSWORD_RULE_LABELS", () => {
    it("tem rótulos em pt-br para cada chave de regra", () => {
      expect(PASSWORD_RULE_LABELS.minLength).toContain("8");
      expect(PASSWORD_RULE_LABELS.hasLetter).toContain("letra");
      expect(PASSWORD_RULE_LABELS.hasNumber).toContain("número");
    });
  });
});
