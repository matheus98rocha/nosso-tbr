import type { ProfileHubLinkItem } from "@/modules/profile/components/ProfileHubLinks";

export type ClientProfileViewModel = {
  userId: string;
  displayName: string;
  userEmail: string;
  avatarInitials: string;
  avatarSeed: string | null;
  formattedAccountCreated: string;
  formattedLastSignIn: string;
  followingCount: number;
  followerCount: number;
  communityPath: string;
  followingHref: string;
  followersHref: string;
  allBooksHref: string;
  hubLinks: ProfileHubLinkItem[];
};
