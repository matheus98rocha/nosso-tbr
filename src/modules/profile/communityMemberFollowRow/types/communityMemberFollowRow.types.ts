export type CommunityMemberFollowRowProps = {
  displayName: string;
  email: string | null;
  isFollowing: boolean;
  isToggleBusy: boolean;
  onPress: () => void;
};
