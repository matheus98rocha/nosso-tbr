export type CommunityMemberRowProps = {
  memberId: string;
  displayName: string;
  avatarSeed: string | null;
  registeredCount: number;
  finishedCount: number;
  currentlyReadingTitle: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  isToggleBusy: boolean;
  isRemoveBusy: boolean;
  onOpen: () => void;
  onToggleFollow: () => void;
  onRemoveFollower: () => void;
};
