import { describe, expect, it } from "vitest";

import {
  registerUserBodySchema,
  registerUserFormSchema,
} from "./userRegistration.validator";

describe("registerUserBodySchema (RN37)", () => {
  const base = {
    email: "a@b.co",
    password: "senha123",
    display_name: "Maria",
    invite: "token",
  };

  it("aceita payload válido", () => {
    expect(() => registerUserBodySchema.parse(base)).not.toThrow();
  });

  it("rejeita senha sem letra", () => {
    const r = registerUserBodySchema.safeParse({
      ...base,
      password: "12345678",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita senha sem número", () => {
    const r = registerUserBodySchema.safeParse({
      ...base,
      password: "abcdefgh",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const r = registerUserBodySchema.safeParse({
      ...base,
      password: "a1",
    });
    expect(r.success).toBe(false);
  });

  it("rejeita display_name curto ou email inválido", () => {
    expect(
      registerUserBodySchema.safeParse({ ...base, display_name: "x" }).success,
    ).toBe(false);
    expect(
      registerUserBodySchema.safeParse({ ...base, email: "x" }).success,
    ).toBe(false);
  });

  it("rejeita invite vazio após trim", () => {
    const r = registerUserBodySchema.safeParse({
      ...base,
      invite: "   ",
    });
    expect(r.success).toBe(false);
  });
});

describe("registerUserFormSchema (RN37)", () => {
  it("exige password_confirm igual a password", () => {
    const r = registerUserFormSchema.safeParse({
      email: "a@b.co",
      password: "senha123",
      password_confirm: "senha124",
      display_name: "Maria",
      invite: "token",
    });
    expect(r.success).toBe(false);
  });

  it("aceita quando confirmação coincide", () => {
    const r = registerUserFormSchema.safeParse({
      email: "a@b.co",
      password: "senha123",
      password_confirm: "senha123",
      display_name: "Maria",
      invite: "token",
    });
    expect(r.success).toBe(true);
  });
});
