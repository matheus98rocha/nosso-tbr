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

  it("aceita inscrição sem convite", () => {
    const r = registerUserBodySchema.safeParse({
      ...base,
      invite: "   ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.invite).toBe("");
    }
  });

  it("preenche invite vazio quando o campo não vem no payload", () => {
    const r = registerUserBodySchema.safeParse({
      email: base.email,
      password: base.password,
      display_name: base.display_name,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.invite).toBe("");
    }
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

  it("aceita inscrição sem convite no formulário", () => {
    const r = registerUserFormSchema.safeParse({
      email: "a@b.co",
      password: "senha123",
      password_confirm: "senha123",
      display_name: "Maria",
      invite: "",
    });
    expect(r.success).toBe(true);
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
