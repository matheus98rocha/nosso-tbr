export type CommunityMemberRowProps = {
  memberId: string;
  displayName: string;
  avatarSeed: string | null;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
  isFollowing: boolean;
  isToggleBusy: boolean;
  onOpen: () => void;
  onToggleFollow: () => void;
};
