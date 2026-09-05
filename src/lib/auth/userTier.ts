export type UserTier = "admin" | "common_user";

export const USER_TIERS = {
  admin: "admin",
  commonUser: "common_user",
} as const satisfies Record<string, UserTier>;

export function isAdminTier(tier: UserTier | null | undefined): boolean {
  return tier === USER_TIERS.admin;
}
