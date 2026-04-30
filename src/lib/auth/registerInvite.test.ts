import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("registerInvite (RN36)", () => {
  const prev = process.env.REGISTER_INVITE_SECRET;

  beforeEach(() => {
    delete process.env.REGISTER_INVITE_SECRET;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.REGISTER_INVITE_SECRET;
    else process.env.REGISTER_INVITE_SECRET = prev;
  });

  it("secretConfigured retorna false quando variável ausente ou só espaços", async () => {
    const mod = await import("./registerInvite");
    expect(mod.default.secretConfigured()).toBe(false);
    process.env.REGISTER_INVITE_SECRET = "   ";
    expect(mod.default.secretConfigured()).toBe(false);
  });

  it("tokenValid retorna false quando segredo não está configurado", async () => {
    process.env.REGISTER_INVITE_SECRET = "";
    const mod = await import("./registerInvite");
    expect(mod.default.tokenValid("abc")).toBe(false);
  });

  it("tokenValid aceita convite igual ao segredo", async () => {
    process.env.REGISTER_INVITE_SECRET = "segredo-fixo";
    const mod = await import("./registerInvite");
    expect(mod.default.tokenValid("segredo-fixo")).toBe(true);
    expect(mod.default.tokenValid("segredo-fixox")).toBe(false);
    expect(mod.default.tokenValid(" outro ")).toBe(false);
  });

  it("tokenValid faz trim no token fornecido", async () => {
    process.env.REGISTER_INVITE_SECRET = "abc";
    const mod = await import("./registerInvite");
    expect(mod.default.tokenValid("  abc  ")).toBe(true);
  });
});
