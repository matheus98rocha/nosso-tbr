import type { ChangeEvent } from "react";

export type ClientProfileCommunityRow = {
  memberId: string;
  displayName: string;
  email: string | null;
  isFollowing: boolean;
  isToggleBusy: boolean;
  onToggle: () => void;
};

export type ClientProfileViewModel = {
  displayName: string;
  userEmail: string;
  avatarInitials: string;
  formattedAccountCreated: string;
  formattedLastSignIn: string;
  searchQuery: string;
  onCommunitySearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCommunitySearch: () => void;
  communityRows: ClientProfileCommunityRow[];
  isDirectoryLoading: boolean;
  isCommunityEmpty: boolean;
};
