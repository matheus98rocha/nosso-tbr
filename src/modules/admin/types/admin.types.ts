import type { UserTier } from "@/lib/auth/userTier";

export type AdminUserListItem = {
  id: string;
  display_name: string;
  email: string | null;
  tier: UserTier;
  books_count: number;
  last_sign_in_at: string | null;
};

export type AdminInviteItem = {
  id: string;
  token: string;
  expires_at: string;
  created_at: string;
  inviteUrl: string;
};

export type AdminInvitesPayload = {
  invites: AdminInviteItem[];
};

export type CreateAdminInvitePayload = {
  invite: Omit<AdminInviteItem, "inviteUrl">;
  inviteUrl: string;
};
