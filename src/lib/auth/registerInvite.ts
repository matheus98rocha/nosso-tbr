import { timingSafeEqual } from "node:crypto";

function secretConfigured(): boolean {
  return Boolean(process.env.REGISTER_INVITE_SECRET?.trim());
}

function tokenValid(provided: string): boolean {
  const expected = process.env.REGISTER_INVITE_SECRET?.trim();
  if (!expected) return false;
  const a = Buffer.from(provided.trim(), "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default {
  secretConfigured,
  tokenValid,
};
