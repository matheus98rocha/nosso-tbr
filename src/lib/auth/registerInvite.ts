import { randomBytes, timingSafeEqual } from "node:crypto";

export const INVITE_DURATION_MS = 24 * 60 * 60 * 1000;

export function createInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function isExpired(
  expiresAt: Date | string,
  now: Date = new Date(),
): boolean {
  const expiry =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return now.getTime() >= expiry.getTime();
}

export function tokensMatch(provided: string, stored: string): boolean {
  const a = Buffer.from(provided.trim(), "utf8");
  const b = Buffer.from(stored.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildInviteUrl(request: Request, token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;
  return `${base}/register?invite=${encodeURIComponent(token)}`;
}

export function inviteExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_DURATION_MS);
}

export default {
  INVITE_DURATION_MS,
  buildInviteUrl,
  createInviteToken,
  inviteExpiresAt,
  isExpired,
  tokensMatch,
};
