import { describe, expect, it } from "vitest";

import { createInviteToken, isExpired, tokensMatch, inviteExpiresAt, buildInviteUrl } from "./registerInvite";

describe("registerInvite (RN36)", () => {
  describe("createInviteToken", () => {
    it("retorna string opaca não vazia", () => {
      const token = createInviteToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("gera tokens distintos em chamadas consecutivas", () => {
      const first = createInviteToken();
      const second = createInviteToken();
      expect(first).not.toBe(second);
    });
  });

  describe("isExpired", () => {
    const expiresAt = new Date("2026-09-07T15:00:00.000Z");

    it("retorna false quando now é anterior a expires_at", () => {
      const now = new Date("2026-09-07T14:59:59.999Z");
      expect(isExpired(expiresAt, now)).toBe(false);
    });

    it("retorna true quando now é igual a expires_at", () => {
      expect(isExpired(expiresAt, expiresAt)).toBe(true);
    });

    it("retorna true quando now é posterior a expires_at", () => {
      const now = new Date("2026-09-07T15:00:00.001Z");
      expect(isExpired(expiresAt, now)).toBe(true);
    });

    it("aceita expires_at como string ISO", () => {
      const now = new Date("2026-09-07T16:00:00.000Z");
      expect(isExpired("2026-09-07T15:00:00.000Z", now)).toBe(true);
    });
  });

  describe("tokensMatch", () => {
    it("retorna true para tokens iguais com trim", () => {
      expect(tokensMatch("  abc-token  ", "abc-token")).toBe(true);
    });

    it("retorna false para tokens diferentes", () => {
      expect(tokensMatch("token-a", "token-b")).toBe(false);
    });

    it("retorna false quando comprimentos diferem", () => {
      expect(tokensMatch("short", "much-longer-token")).toBe(false);
    });
  });

  describe("inviteExpiresAt", () => {
    it("retorna now + 24 horas", () => {
      const now = new Date("2026-09-07T12:00:00.000Z");
      expect(inviteExpiresAt(now).toISOString()).toBe(
        "2026-09-08T12:00:00.000Z",
      );
    });
  });

  describe("buildInviteUrl", () => {
    it("usa NEXT_PUBLIC_SITE_URL quando definido", () => {
      const previous = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = "https://nosso-tbr.example/";
      try {
        expect(
          buildInviteUrl(
            new Request("http://localhost/api/admin/invites"),
            "tok",
          ),
        ).toBe("https://nosso-tbr.example/register?invite=tok");
      } finally {
        if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
        else process.env.NEXT_PUBLIC_SITE_URL = previous;
      }
    });
  });
});
