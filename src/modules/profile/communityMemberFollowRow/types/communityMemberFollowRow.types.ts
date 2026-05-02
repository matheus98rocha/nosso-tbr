export type CommunityMemberFollowRowProps = {
  memberId: string;
  displayName: string;
  email: string | null;
  isFollowing: boolean;
  isToggleBusy: boolean;
  onPress: () => void;
};
