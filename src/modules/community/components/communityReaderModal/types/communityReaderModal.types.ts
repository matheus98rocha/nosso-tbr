import type { CommunityMember } from "@/modules/community/types/community.types";

export type CommunityReaderModalProps = {
  member: CommunityMember | null;
  open: boolean;
  isToggleBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFollow: () => void;
  onOpenProfile: () => void;
};
