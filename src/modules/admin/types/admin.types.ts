import type { UserTier } from "@/lib/auth/userTier";

export type AdminUserListItem = {
  id: string;
  display_name: string;
  email: string | null;
  tier: UserTier;
};

export type InviteLinkPayload = {
  inviteUrl: string | null;
  configured: boolean;
};
