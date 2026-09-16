export type ClientProfileViewModel = {
  displayName: string;
  userEmail: string;
  avatarInitials: string;
  avatarSeed: string | null;
  formattedAccountCreated: string;
  formattedLastSignIn: string;
  followingCount: number;
  followerCount: number;
  communityPath: string;
};
