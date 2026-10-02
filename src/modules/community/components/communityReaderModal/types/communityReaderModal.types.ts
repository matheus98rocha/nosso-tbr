import type { CommunityMember } from "@/modules/community/types/community.types";

export type CommunityReaderModalProps = {
  member: CommunityMember | null;
  open: boolean;
  isToggleBusy: boolean;
  isRemoveBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFollow: () => void;
  onRemoveFollower: () => void;
  onOpenProfile: () => void;
};
