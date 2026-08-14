import type { AvatarOption } from "@/modules/profile/avatarSelection/types/avatarSelection.types";
import type { ReadingAvatarSeed } from "@/modules/profile/avatarSelection/utils";

export type AvatarGridProps = {
  avatarOptions: AvatarOption[];
  selectedSeed: ReadingAvatarSeed | null;
  isDisabled: boolean;
  onSelectAvatar: (seed: ReadingAvatarSeed) => void;
};
